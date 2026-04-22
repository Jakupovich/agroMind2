"""Sentinel Hub / Copernicus Data Space Ecosystem (CDSE) NDVI service.

Uses the CDSE Sentinel Hub compatible Process API + Statistics API to compute a
field-level NDVI for the user's farm pin. A single OAuth2 client-credentials
flow is used; tokens are cached in-process until ~60 seconds before expiry.
"""

from __future__ import annotations

import asyncio
import base64
import math
import time
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any

import httpx

from app.core.config import get_settings

CDSE_TOKEN_URL = (
    "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/"
    "openid-connect/token"
)
CDSE_PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"
CDSE_STATISTICS_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"

# Default analysis window — last N days of Sentinel-2 observations. CDSE will
# auto-pick the least-cloudy scene inside this window via mosaickingOrder.
DEFAULT_LOOKBACK_DAYS = 30
DEFAULT_BOX_METERS = 500
IMAGE_PIXELS = 512


# ----- Evalscripts -------------------------------------------------------

# Colour-ramp visualization (-1..1 → red→yellow→green PNG).
# SCL band used to mask clouds / shadow / water / snow.
EVALSCRIPT_VIS = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: { bands: 4, sampleType: "AUTO" }
  };
}
const ramp = [
  [-0.2, [0.8, 0.0, 0.0]],
  [ 0.0, [0.9, 0.4, 0.0]],
  [ 0.2, [1.0, 0.9, 0.3]],
  [ 0.4, [0.6, 0.9, 0.2]],
  [ 0.6, [0.1, 0.7, 0.1]],
  [ 0.8, [0.0, 0.4, 0.0]]
];
function colorFor(v) {
  for (let i = 0; i < ramp.length - 1; i++) {
    const [x0, c0] = ramp[i];
    const [x1, c1] = ramp[i + 1];
    if (v <= x1) {
      const t = (v - x0) / (x1 - x0);
      return [
        c0[0] + t * (c1[0] - c0[0]),
        c0[1] + t * (c1[1] - c0[1]),
        c0[2] + t * (c1[2] - c0[2])
      ];
    }
  }
  return ramp[ramp.length - 1][1];
}
function evaluatePixel(s) {
  const invalid = (s.dataMask === 0) || [0, 1, 3, 8, 9, 10, 11].includes(s.SCL);
  if (invalid) {
    return [0.2, 0.2, 0.25, 1];
  }
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 1e-6);
  const c = colorFor(ndvi);
  return [c[0], c[1], c[2], 1];
}
"""

# Statistics evalscript — one float output (NDVI) plus a dataMask output so the
# Statistics API ignores clouds / water / no-data when averaging.
EVALSCRIPT_STATS = """
//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "SCL", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1 }
    ]
  };
}
function evaluatePixel(s) {
  const invalid = (s.dataMask === 0) || [0, 1, 3, 8, 9, 10, 11].includes(s.SCL);
  if (invalid) {
    return { ndvi: [0], dataMask: [0] };
  }
  const ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 1e-6);
  return { ndvi: [ndvi], dataMask: [1] };
}
"""


# ----- OAuth token cache -------------------------------------------------


@dataclass
class _TokenCache:
    token: str
    expires_at: float


_token_cache: _TokenCache | None = None
_token_lock = asyncio.Lock()


async def _get_token(client: httpx.AsyncClient) -> str:
    """Fetch and cache a CDSE OAuth2 access token."""

    global _token_cache
    settings = get_settings()
    if not settings.sentinelhub_client_id or not settings.sentinelhub_client_secret:
        raise RuntimeError(
            "Sentinel Hub / CDSE credentials are not configured "
            "(SENTINELHUB_CLIENT_ID / SENTINELHUB_CLIENT_SECRET)."
        )

    async with _token_lock:
        if _token_cache and _token_cache.expires_at - 60 > time.time():
            return _token_cache.token
        resp = await client.post(
            CDSE_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": settings.sentinelhub_client_id,
                "client_secret": settings.sentinelhub_client_secret,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        payload = resp.json()
        _token_cache = _TokenCache(
            token=payload["access_token"],
            expires_at=time.time() + float(payload.get("expires_in", 1800)),
        )
        return _token_cache.token


# ----- Geometry ----------------------------------------------------------


def _bbox_around(lat: float, lon: float, meters: int) -> list[float]:
    """Return [minLon, minLat, maxLon, maxLat] for a square of side `meters`."""

    half = meters / 2.0
    dlat = half / 111_320.0
    dlon = half / (111_320.0 * max(math.cos(math.radians(lat)), 1e-6))
    return [lon - dlon, lat - dlat, lon + dlon, lat + dlat]


# ----- Core fetch --------------------------------------------------------


async def _fetch_image(
    client: httpx.AsyncClient,
    token: str,
    bbox: list[float],
    date_from: str,
    date_to: str,
) -> bytes:
    body: dict[str, Any] = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"},
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "timeRange": {
                            "from": f"{date_from}T00:00:00Z",
                            "to": f"{date_to}T23:59:59Z",
                        },
                        "mosaickingOrder": "leastCC",
                        "maxCloudCoverage": 60,
                    },
                }
            ],
        },
        "output": {
            "width": IMAGE_PIXELS,
            "height": IMAGE_PIXELS,
            "responses": [
                {"identifier": "default", "format": {"type": "image/png"}}
            ],
        },
        "evalscript": EVALSCRIPT_VIS,
    }
    resp = await client.post(
        CDSE_PROCESS_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "image/png",
        },
        json=body,
    )
    resp.raise_for_status()
    return resp.content


async def _fetch_stats(
    client: httpx.AsyncClient,
    token: str,
    bbox: list[float],
    date_from: str,
    date_to: str,
) -> dict[str, Any]:
    body: dict[str, Any] = {
        "input": {
            "bounds": {
                "bbox": bbox,
                "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"},
            },
            "data": [
                {
                    "type": "sentinel-2-l2a",
                    "dataFilter": {
                        "mosaickingOrder": "leastCC",
                        "maxCloudCoverage": 60,
                    },
                }
            ],
        },
        "aggregation": {
            "timeRange": {
                "from": f"{date_from}T00:00:00Z",
                "to": f"{date_to}T23:59:59Z",
            },
            "aggregationInterval": {"of": "P30D"},
            "evalscript": EVALSCRIPT_STATS,
            "resx": 10,
            "resy": 10,
        },
        "calculations": {
            "default": {
                "statistics": {
                    "default": {
                        "percentiles": {"k": [25, 50, 75]},
                    }
                }
            }
        },
    }
    resp = await client.post(
        CDSE_STATISTICS_URL,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json=body,
    )
    resp.raise_for_status()
    return resp.json()


def _parse_stats(payload: dict[str, Any]) -> tuple[dict[str, float], str | None]:
    """Extract mean/min/max/stdev and acquisition date from the Statistics API response."""

    data = payload.get("data") or []
    if not data:
        return (
            {"mean": 0.0, "min": 0.0, "max": 0.0, "stdev": 0.0, "valid_pixel_ratio": 0.0},
            None,
        )
    interval = data[0]
    outputs = interval.get("outputs", {})
    ndvi_bands = outputs.get("ndvi", {}).get("bands", {}).get("B0", {})
    stats = ndvi_bands.get("stats", {})
    sample_count = float(stats.get("sampleCount", 0) or 0)
    no_data = float(stats.get("noDataCount", 0) or 0)
    valid_ratio = 0.0
    if sample_count > 0:
        valid_ratio = max(0.0, min(1.0, 1.0 - (no_data / sample_count)))
    mean = float(stats.get("mean", 0.0) or 0.0)
    std = float(stats.get("stDev", stats.get("stdDev", 0.0)) or 0.0)
    acquisition = interval.get("interval", {}).get("from")
    if acquisition:
        acquisition = acquisition[:10]
    return (
        {
            "mean": mean,
            "min": float(stats.get("min", 0.0) or 0.0),
            "max": float(stats.get("max", 0.0) or 0.0),
            "stdev": std,
            "valid_pixel_ratio": valid_ratio,
        },
        acquisition,
    )


# ----- Scoring -----------------------------------------------------------


def _score(mean_ndvi: float, valid_ratio: float) -> tuple[str, str, list[str]]:
    if valid_ratio < 0.2:
        return (
            "amber",
            "Insufficient clear-sky coverage",
            [
                "Sentinel-2 could not get a cloud-free look at your field in the last month.",
                "Try again in a few days, or after the next clear pass.",
            ],
        )
    if mean_ndvi < 0.15:
        return (
            "red",
            "Bare or non-vegetated",
            [
                "Mean NDVI below 0.15 — the patch looks bare, water or built-up.",
                "If the field was recently ploughed or sown, this is expected; check again after emergence.",
            ],
        )
    if mean_ndvi < 0.35:
        return (
            "amber",
            "Sparse / stressed vegetation",
            [
                "Low vegetation vigour. Possible early-growth stage, water stress or poor canopy cover.",
                "Cross-check with the Smart Irrigation card; consider scouting the field.",
            ],
        )
    if mean_ndvi < 0.6:
        return (
            "green",
            "Moderate canopy",
            [
                "Healthy, mid-season canopy. NDVI is in the normal range for active crops.",
                "No immediate action required — keep monitoring for disease pressure.",
            ],
        )
    return (
        "green",
        "Dense, vigorous canopy",
        [
            "High NDVI — dense, vigorous vegetation. Crops look healthy in this window.",
            "Keep irrigation and nutrition on schedule to sustain the canopy.",
        ],
    )


# ----- Public API --------------------------------------------------------


async def fetch_ndvi(
    *,
    lat: float,
    lon: float,
    box_meters: int = DEFAULT_BOX_METERS,
    lookback_days: int = DEFAULT_LOOKBACK_DAYS,
    timeout: float = 25.0,
) -> dict[str, Any]:
    """Return the NDVI response dictionary for the given field pin."""

    end = date.today()
    start = end - timedelta(days=lookback_days)
    bbox = _bbox_around(lat, lon, box_meters)

    async with httpx.AsyncClient(timeout=timeout) as client:
        token = await _get_token(client)
        img_bytes, stats_payload = await asyncio.gather(
            _fetch_image(client, token, bbox, start.isoformat(), end.isoformat()),
            _fetch_stats(client, token, bbox, start.isoformat(), end.isoformat()),
        )

    stats, acquisition = _parse_stats(stats_payload)
    traffic_light, label, bullets = _score(stats["mean"], stats["valid_pixel_ratio"])
    image_b64 = base64.b64encode(img_bytes).decode("ascii")

    return {
        "latitude": lat,
        "longitude": lon,
        "box_meters": box_meters,
        "acquisition_date": acquisition,
        "cloud_coverage": None,
        "stats": {k: round(v, 4) for k, v in stats.items()},
        "traffic_light": traffic_light,
        "score_label": label,
        "explanation": bullets,
        "image_png_base64": image_b64,
    }

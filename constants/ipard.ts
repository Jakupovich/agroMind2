/**
 * IPARD III / national subsidy catalogue for the Adria region (CG + BiH + RS).
 *
 * These figures are consolidated from:
 *  - IPARD III Montenegro programme 2021–2027 (total €128 M; €82 M grants)
 *  - IPARD III Serbia (60–75% cover; per-project €20k–€1M, caps €2M)
 *  - FBiH Program financijskih potpora 2024 (175 M KM ≈ €89.5 M)
 *
 * Values are intentionally conservative. Localised amounts can be refined per
 * country ministry publication cycle. Keep this file free of free-form prose —
 * the UI formats the message.
 */

import type { CountryCode } from "@/hooks/useCountryFromLocation";

export interface SubsidyOpportunity {
  /** Match a normalised crop id produced by toAgroPredictCropId(). */
  cropIds: string[];
  /** Short slug: unique per country + crop so cards are stable keys. */
  id: string;
  /** Translation keys; fallback English text inline in each locale file. */
  programmeKey: string;
  measureKey: string;
  descriptionKey: string;
  /** EUR per hectare (grant component, not co-financing). */
  grantPerHa: number;
  /** Optional organic / technology bonus, EUR per ha. */
  bonusPerHa?: number;
  /** Optional bonus label key (e.g. "ipard.bonus_organic"). */
  bonusKey?: string;
  /** Min / max farm size window for eligibility. */
  minHa?: number;
  maxHa?: number;
  /** Call status for the 2026 cycle. */
  status: "open" | "planned" | "closed";
  /** Country-specific reference URL. */
  url: string;
}

const IPARD_CATALOGUE: Record<CountryCode, SubsidyOpportunity[]> = {
  ME: [
    {
      id: "me-ipard3-m1-fruit",
      cropIds: [
        "apple",
        "pear",
        "cherry",
        "apricot",
        "peach",
        "plum",
        "grape",
      ],
      programmeKey: "ipard.me.programme",
      measureKey: "ipard.me.measure_fruit",
      descriptionKey: "ipard.me.description_fruit",
      grantPerHa: 600,
      bonusPerHa: 200,
      bonusKey: "ipard.bonus_organic",
      minHa: 0.5,
      maxHa: 50,
      status: "open",
      url: "https://www.gov.me/mpsv/ipard",
    },
    {
      id: "me-ipard3-m1-grain",
      cropIds: ["corn", "wheat", "barley", "rapeseed", "soybeans"],
      programmeKey: "ipard.me.programme",
      measureKey: "ipard.me.measure_grain",
      descriptionKey: "ipard.me.description_grain",
      grantPerHa: 500,
      bonusPerHa: 100,
      bonusKey: "ipard.bonus_diesel",
      minHa: 1,
      maxHa: 200,
      status: "open",
      url: "https://www.gov.me/mpsv/ipard",
    },
    {
      id: "me-ipard3-m1-vegetable",
      cropIds: ["potato", "tomato", "pepper", "onion", "cucumber"],
      programmeKey: "ipard.me.programme",
      measureKey: "ipard.me.measure_vegetable",
      descriptionKey: "ipard.me.description_vegetable",
      grantPerHa: 650,
      bonusPerHa: 200,
      bonusKey: "ipard.bonus_organic",
      minHa: 0.3,
      maxHa: 20,
      status: "open",
      url: "https://www.gov.me/mpsv/ipard",
    },
  ],
  BA: [
    {
      id: "ba-fbih-2024-fruit",
      cropIds: [
        "apple",
        "pear",
        "cherry",
        "apricot",
        "peach",
        "plum",
        "grape",
      ],
      programmeKey: "ipard.ba.programme",
      measureKey: "ipard.ba.measure_fruit",
      descriptionKey: "ipard.ba.description_fruit",
      grantPerHa: 550,
      bonusPerHa: 200,
      bonusKey: "ipard.bonus_organic",
      minHa: 0.3,
      maxHa: 50,
      status: "open",
      url: "https://fmpvs.gov.ba/poticaji",
    },
    {
      id: "ba-fbih-2024-grain",
      cropIds: ["corn", "wheat", "barley", "rapeseed", "soybeans"],
      programmeKey: "ipard.ba.programme",
      measureKey: "ipard.ba.measure_grain",
      descriptionKey: "ipard.ba.description_grain",
      grantPerHa: 500,
      bonusPerHa: 100,
      bonusKey: "ipard.bonus_diesel",
      minHa: 1,
      maxHa: 200,
      status: "open",
      url: "https://fmpvs.gov.ba/poticaji",
    },
    {
      id: "ba-fbih-2024-vegetable",
      cropIds: ["potato", "tomato", "pepper", "onion", "cucumber"],
      programmeKey: "ipard.ba.programme",
      measureKey: "ipard.ba.measure_vegetable",
      descriptionKey: "ipard.ba.description_vegetable",
      grantPerHa: 620,
      bonusPerHa: 200,
      bonusKey: "ipard.bonus_organic",
      minHa: 0.2,
      maxHa: 20,
      status: "open",
      url: "https://fmpvs.gov.ba/poticaji",
    },
  ],
  RS: [
    {
      id: "rs-ipard3-m1-fruit",
      cropIds: [
        "apple",
        "pear",
        "cherry",
        "apricot",
        "peach",
        "plum",
        "grape",
      ],
      programmeKey: "ipard.rs.programme",
      measureKey: "ipard.rs.measure_fruit",
      descriptionKey: "ipard.rs.description_fruit",
      grantPerHa: 700,
      bonusPerHa: 250,
      bonusKey: "ipard.bonus_organic",
      minHa: 0.5,
      maxHa: 100,
      status: "open",
      url: "https://uap.gov.rs/ipard",
    },
    {
      id: "rs-ipard3-m1-grain",
      cropIds: ["corn", "wheat", "barley", "rapeseed", "soybeans"],
      programmeKey: "ipard.rs.programme",
      measureKey: "ipard.rs.measure_grain",
      descriptionKey: "ipard.rs.description_grain",
      grantPerHa: 550,
      bonusPerHa: 100,
      bonusKey: "ipard.bonus_diesel",
      minHa: 2,
      maxHa: 300,
      status: "open",
      url: "https://uap.gov.rs/ipard",
    },
    {
      id: "rs-ipard3-m1-vegetable",
      cropIds: ["potato", "tomato", "pepper", "onion", "cucumber"],
      programmeKey: "ipard.rs.programme",
      measureKey: "ipard.rs.measure_vegetable",
      descriptionKey: "ipard.rs.description_vegetable",
      grantPerHa: 700,
      bonusPerHa: 250,
      bonusKey: "ipard.bonus_organic",
      minHa: 0.3,
      maxHa: 50,
      status: "open",
      url: "https://uap.gov.rs/ipard",
    },
  ],
};

/**
 * Pick the top 2 subsidy opportunities for this farm: prefer ones that match
 * a selected crop; if none match, fall back to the generic grain measure.
 */
export function matchSubsidies(
  country: CountryCode,
  cropIds: string[],
): SubsidyOpportunity[] {
  const cat = IPARD_CATALOGUE[country] ?? [];
  const norm = new Set(cropIds.map((c) => c.toLowerCase()));
  const matches = cat.filter((s) =>
    s.cropIds.some((c) => norm.has(c)),
  );
  if (matches.length > 0) return matches.slice(0, 2);
  // Graceful fallback — show the grain measure as the default proof-of-exist.
  const grain = cat.find((s) => s.id.endsWith("-grain"));
  return grain ? [grain] : cat.slice(0, 1);
}

export { IPARD_CATALOGUE };

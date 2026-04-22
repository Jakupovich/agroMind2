# AgroMind Backend

FastAPI service that powers AgroMind's agronomy AI features.

## Endpoints

- `GET /irrigation?lat={lat}&lon={lon}&crop={crop}` — smart irrigation recommendation based on a 7-day Open-Meteo forecast.
- `GET /health` — liveness probe.
- `GET /docs` — Swagger UI (auto-generated).
- `GET /redoc` — ReDoc UI.

## Project layout

```
backend/
├── app/
│   ├── core/           # Settings
│   ├── routes/         # FastAPI routers
│   ├── schemas/        # Pydantic response models
│   ├── services/       # Business logic (weather client, irrigation, AI)
│   └── main.py         # FastAPI app factory
├── requirements.txt
├── Procfile            # Railway / Heroku start command
├── railway.json        # Railway deployment config
└── nixpacks.toml
```

## Local development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # optional
uvicorn app.main:app --reload --port 8000
```

Then open http://localhost:8000/docs.

Example request:

```bash
curl "http://localhost:8000/irrigation?lat=43.85&lon=18.41&crop=corn"
```

## Configuration

All settings are read from environment variables (see `.env.example`). The
`OPENAI_API_KEY` is optional — when unset the irrigation endpoint returns a
deterministic, rule-based explanation.

## Deployment (Railway)

Point Railway at the `backend/` directory. `railway.json` and `nixpacks.toml`
declare the build and start commands; Railway will inject `$PORT` automatically.

# SafeVision AI

**AI-Powered School & Facility Security Platform**

SafeVision AI is a multi-tenant SaaS platform that monitors live CCTV/IP camera feeds and detects security incidents in real time using advanced AI models.

## Features

### AI Detection Engine
- **Violence Detection** — YOLOv8 person detection + DeepSORT tracking + action recognition (SlowFast/MoViNet)
- **Bullying Detection** — Trajectory analysis, person grouping, surrounding pattern detection
- **Weapon Detection** — YOLOv8 custom object detection (knives, guns, metallic objects)

### Smart Alert System
- Real-time dashboard notifications via WebSocket
- Email & SMS webhook alerts
- Severity classification: Low / Medium / High / Critical
- Incident clip capture (15s before + 30s after)

### Incident Analytics Dashboard
- Live monitoring with all cameras
- Incident management with filters, playback, and status tracking
- Trend analysis (incidents per day/week/month)
- Risk heatmaps by zone

### Risk Prediction Module
- Zone risk scores (1–10)
- Predicted peak incident periods
- Trend forecasting based on historical data

### Multi-Site Enterprise Support
- Multi-tenant architecture with isolated data
- Organization → Location → Zone → Camera hierarchy
- Role-based access: Super Admin, Org Admin, Security Operator

### SaaS Billing
- Standard (€500/mo) — up to 10 cameras, violence + alerts
- Professional (€750/mo) — bullying + analytics + heatmaps
- Enterprise (€1000/mo) — all modules + predictive risk + multi-site
- Stripe integration ready

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, TailwindCSS, Recharts, Socket.IO |
| Backend API | FastAPI, SQLAlchemy, PostgreSQL, Redis |
| AI Service | Python, PyTorch, OpenCV, YOLOv8, DeepSORT |
| Infrastructure | Docker, Docker Compose |

---

## Project Structure

```
safevision-ai/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/routes/       # REST API endpoints
│   │   ├── core/             # Config, auth, database
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # Business logic services
│   │   ├── websocket/        # WebSocket connection manager
│   │   └── main.py           # FastAPI application entry
│   ├── alembic/              # Database migrations
│   ├── Dockerfile
│   └── pyproject.toml
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Route page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API client
│   │   ├── store/            # State management
│   │   └── types/            # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── ai_service/               # AI inference microservice
│   ├── service/
│   │   ├── detectors/        # Violence, bullying, weapon detectors
│   │   ├── trackers/         # DeepSORT person tracking
│   │   ├── processors/       # Camera stream processor
│   │   └── main.py           # FastAPI service entry
│   ├── Dockerfile
│   └── pyproject.toml
├── docker-compose.yml        # Full stack orchestration
├── .env.example              # Environment template
└── README.md
```

---

## Quick Start

### 1. Clone & Configure

```bash
git clone <repo-url>
cd safevision-ai
cp .env.example .env
# Edit .env with your configuration
```

### 2. Start with Docker Compose

```bash
docker compose up --build
```

This starts all services:
- **Frontend** → http://localhost:80
- **Backend API** → http://localhost:8000/api/docs
- **AI Service** → http://localhost:8001/docs
- **PostgreSQL** → localhost:5432
- **Redis** → localhost:6379

### 3. Development Mode

**Backend:**
```bash
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**AI Service:**
```bash
cd ai_service
pip install -e .
uvicorn service.main:app --reload --port 8001
```

---

## API Documentation

Once running, access the interactive API docs:
- Swagger UI: http://localhost:8000/api/docs
- OpenAPI JSON: http://localhost:8000/api/openapi.json

### Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new organization |
| POST | `/api/v1/auth/login` | User authentication |
| GET | `/api/v1/analytics/dashboard` | Dashboard statistics |
| GET | `/api/v1/incidents` | List incidents (with filters) |
| PATCH | `/api/v1/incidents/{id}` | Update/resolve incident |
| GET | `/api/v1/analytics/trends` | Incident trend data |
| GET | `/api/v1/analytics/heatmap` | Zone heatmap data |
| GET | `/api/v1/analytics/risk-predictions` | Risk forecasts |
| WS | `/ws/alerts` | Real-time alert stream |

---

## Database Schema

### Core Entities
- **organizations** — Multi-tenant isolation, billing
- **locations** — Physical sites within an organization
- **zones** — Areas within a location (hallways, classrooms)
- **cameras** — IP/RTSP camera configurations
- **incidents** — Detected security events
- **alerts** — Notification records per channel
- **users** — Role-based access control
- **risk_scores** — Zone risk calculations
- **analytics_snapshots** — Aggregated analytics data

---

## MVP Roadmap

### Phase 1 (Current)
- [x] Violence detection pipeline
- [x] Live alerts via WebSocket
- [x] Incident dashboard & management
- [x] Multi-camera support
- [x] User authentication & RBAC

### Phase 2
- [ ] Bullying detection (trajectory analysis)
- [ ] Full analytics dashboard
- [ ] Interactive heatmaps
- [ ] Email/SMS alert delivery

### Phase 3
- [ ] Weapon detection (custom YOLO model)
- [ ] Predictive risk scoring
- [ ] Multi-site management
- [ ] Stripe billing integration

---

## License

Proprietary — All rights reserved.

# hakscatch

**AI observability by HAKS LABS.** React dashboard · Python/FastAPI · PostgreSQL · optional Ollama judge.

A runnable single-workspace MVP for collecting AI/agent telemetry and investigating performance, evidence support and behavior changes. No paid API is required. All application code is MIT licensed. Dependencies retain their own open-source licenses. The model is optional and has its own license.

## What works

- Authenticated HTTP ingestion of traces, nested spans, logs and numeric metrics.
- PostgreSQL persistence, JSONB metadata, full-text log search and time indexes.
- Dashboard: request counts, p95 latency, errors, tokens and hourly request chart.
- Trace inspector: prompt, response, contexts, tool sequence, span hierarchy and evaluations.
- Lexical evidence-grounding check (explicitly a proxy, not a truth detector).
- LLM-as-a-judge via local Ollama, validated structured JSON, stored model/rubric metadata.
- Vector drift: normalized centroid shift against saved, versioned embedding baselines.
- Agent drift: Jensen–Shannon divergence of adjacent tool transitions.
- Baseline workbench, configurable drift thresholds, visible threshold alerts.
- Python SDK, synthetic demo seed, retention script, integration tests and Docker Compose.

## Quick start: Docker Engine + Compose

Requirements: Docker Engine with Compose v2 and Python 3.10+ for helper scripts. On Linux these are open-source tools; Docker Desktop has separate licensing terms. Docker services require available RAM/disk/CPU. Judge inference needs additional model memory and is disabled by default.

From the extracted **hakscatch** directory:

```bash
python3 scripts/setup.py
docker compose up --build -d
python3 scripts/seed.py
```

On Windows, use `py -3 scripts/setup.py` / `py -3 scripts/seed.py` instead of `python3`.

1. Open http://localhost:8080.
2. Open `.env` locally; copy **HAKSCATCH_ADMIN_KEY** into the sign-in form. Do not commit or share this file.
3. Select project **demo**. Seeded records are synthetic and use actual ingestion time, so the initial activity chart occupies one hour.
4. Go to **Traces**, select a request, and click **Run grounding check**.
5. Go to **Drift lab** to save/compare your own vectors or tool sequences.
6. To capture real data, install `pip install ./sdk` and follow `examples/instrument_agent.py`.

API: http://localhost:8000/docs · Health: http://localhost:8000/healthz.

The web container proxies `/api` to the Python service. PostgreSQL is not exposed on a host port. Stopping containers retains the database volume. `docker compose down -v` deletes stored data; do not use it unless you intend to erase your database.

## Browser-only build (your laptop does not need VS Code)

1. Create a private GitHub repository and upload the extracted project contents, including `.devcontainer`.
2. Open **Code → Codespaces → Create codespace**.
3. The included dev-container configuration supplies Python, Node and Docker-in-Docker. Let setup finish.
4. Run the same quick-start commands in the browser terminal.
5. In **Ports**, open port **8080** and keep port visibility **Private**. Port 8000 is only needed for direct SDK/API access.
6. Stop the Codespace when finished and commit source changes. Do not commit `.env` or data dumps.

Codespaces is a proprietary hosted service with account-specific allowances; it is an optional development convenience, not part of the open-source product or an always-free production host. You can use your own Linux server instead.

## Enable the optional judge

See [docs/JUDGE.md](docs/JUDGE.md). Grounding and drift features work without downloading a model. The SDK deliberately does not capture prompts/responses/contexts unless `capture_content=True`.

## Repository

| Path | Purpose |
|---|---|
| `frontend/` | React/Vite source, lockfile, nginx and Docker build |
| `backend/app/` | FastAPI routes, validation, schema and evaluation algorithms |
| `backend/tests/` | Algorithm, API and SDK tests |
| `sdk/` | Installable Python telemetry client |
| `examples/` | Instrumentation example |
| `scripts/` | Credentials, synthetic telemetry and retention |
| `docs/` | Architecture, API, operations, evaluation limits and verification |
| `.devcontainer/` | Optional browser development environment |

## Native development

Use a PostgreSQL 17 database and Python 3.12+. The Compose path is simpler; for native development:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
python3 scripts/setup.py
set -a
. ./.env
set +a
export DATABASE_URL='postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/hakscatch'
cd backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal with Node 22.12+:

```bash
cd frontend
npm ci
npm run dev
```

Vite proxies the API to localhost:8000. Production build: `npm run build`. Apply the SQL schema on first API startup; never assume this initial-schema initializer supports arbitrary future upgrades.

## Tests

```bash
cd backend
python -m pytest -q
```

Integration tests skip unless **TEST_DATABASE_URL** names a **disposable** PostgreSQL database. For full tests:

```bash
TEST_DATABASE_URL='postgresql://user:password@localhost:5432/hakscatch_test' python -m pytest -q
```

See [docs/VALIDATION.md](docs/VALIDATION.md) for what was actually run on delivery.

## Deployment boundaries

This is a single trusted workspace MVP, not a multi-tenant SaaS. Projects are filters, not access-control boundaries. Admin keys can read every project; ingest keys can write every project. API keys are not individual user accounts. There is no SSO/RBAC, billing, audit trail, durable evaluation queue, hosted alert delivery, OTLP receiver, or automatic framework instrumentation. The SDK sends synchronous HTTP requests and does not persist retries.

Public launch requires HTTPS, identity/access control, rate limiting, backups, resource limits and capacity planning. Storage is unbounded unless you run retention. See [docs/OPERATIONS.md](docs/OPERATIONS.md).

**Free software does not mean unlimited free hosting or inference.** Self-hosted PostgreSQL has no software subscription fee, but hardware, electricity, storage and backups still require resources. Cloudflare Pages alone cannot run this Python/PostgreSQL stack. No revenue or availability is guaranteed.

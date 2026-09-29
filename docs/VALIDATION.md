# Delivery verification — 29 September 2026

## Executed

- React production build (`npm run build`) passed. Vite reports a large-bundle warning for the chart/UI bundle; this is not a build failure.
- 10 Python tests passed: grounding, drift identity/change, invalid vectors, cycle validation, nonfinite metrics, redaction, SDK privacy/error behavior, API workflow and judge output validation/error handling.
- API tests and browser flows ran against **PGlite with its PostgreSQL socket adapter** (PostgreSQL compiled to WebAssembly), using the actual psycopg client, SQL schema and Python API. This validates SQL/API behavior but does not replace a native PostgreSQL deployment test or concurrency benchmark.
- Real API demo seed: 36 traces, logs and metrics; grounding and both drift kinds persisted.
- Chromium browser checks: admin sign-in, overview, all navigation pages, trace drawer, grounding evaluation, drift comparison, log search, mobile navigation and 390px overflow check.
- Screenshots were inspected at desktop and mobile sizes; included in `docs/screenshots/`.
- `npm audit --omit=dev` reported no known production dependency advisories at verification time. This is not a security certification.

## Not executed here

- Docker Engine/Compose and native PostgreSQL 17 container startup (Docker was unavailable in this environment).
- GitHub Codespaces devcontainer and CI workflow execution.
- Real Ollama model download/inference. Judge integration was tested with controlled valid/invalid HTTP responses; model quality is unmeasured.
- Public deployment, TLS/SSO, high-volume load, concurrent write endurance, backup restoration or long-term retention scheduling.

A GitHub Actions workflow is included to run the tests against a disposable **native PostgreSQL 17** service when you push the repository. Review its actual result before deploying.

Run `docker compose up --build -d`, seed demo data, and confirm dashboard/health on your environment before connecting real workloads. Existing tests are also available for repeatable validation on a disposable database.

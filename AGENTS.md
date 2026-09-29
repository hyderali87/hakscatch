# hakscatch contributor instructions

- Preserve React frontend, Python API and PostgreSQL storage.
- Keep core features usable without paid APIs. Ollama remains optional.
- Never label lexical overlap as a hallucination probability or drift as proof of regression.
- Keep admin and ingest roles distinct. Projects are not tenant boundaries.
- Do not commit .env, credentials, database dumps, node_modules or local telemetry.
- Changes to payload contracts require corresponding SDK, API schema and docs updates.
- Verify Python tests and frontend build. Integration tests require a disposable database.
- Document actual validation; do not claim Docker or a real judge run unless executed.
- New schema changes need explicit migrations and rollback planning.

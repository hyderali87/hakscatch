# API and instrumentation

Interactive schema: backend `http://localhost:8000/docs`. All `/api` routes require `X-API-Key`. Health is public. Admin key allows reads, evaluations, baselines and writes. Ingest key allows telemetry writes only.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/traces` | Store one immutable trace |
| GET | `/api/traces` | Filter by project, hours, q, status; limit/offset |
| GET | `/api/traces/{id}` | Trace payload and evaluations; requires matching project |
| POST / GET | `/api/logs` | Ingest / English full-text search; level, hours, limit/offset |
| POST / GET | `/api/metrics` | Ingest gauge / aggregate by name and unit |
| GET | `/api/overview` | Request/tokens/errors/p95 and hourly counts |
| POST | `/api/traces/{id}/evaluate` | mode=lexical or judge; project required |
| GET | `/api/evaluations` | Recent stored results; project, hours, offset |
| POST / GET | `/api/baselines` | Create immutable named baseline / list metadata |
| POST | `/api/drift` | Compare submitted samples against baseline_id |

Default project is `default`; demo seed uses `demo`. Hours range 1–2160. 401 = invalid role/key, 404 = missing or mismatched project reference, 409 = duplicate ID/baseline name, 413 = >2MB, 422 = validation, 503 = judge disabled, 502 = failed judge.

## SDK

```bash
pip install ./sdk
export HAKSCATCH_URL=http://localhost:8000
export HAKSCATCH_INGEST_KEY='<your ingest key from .env>'
python examples/instrument_agent.py
```

Use `Client.from_env(project='your-project', capture_content=True)` only when you intend to store prompts, answers and contexts. Default capture_content=False excludes those fields; attributes, names and logs must still be sanitized by the caller. Exceptions inside a trace are recorded as errors and re-raised. Telemetry failure is best-effort by default; strict=True raises failures (except when that would mask an application exception).

No framework lock-in: wrap LangGraph, LangChain, LlamaIndex or your own code in the trace/span context managers. This is manual instrumentation; it is not automatic OpenTelemetry or OTLP compatibility. Token counts must be filled from your model response. The SDK does not guess token counts or monetary costs.

## Example vector baseline body

```json
{"project":"demo","name":"embedding-v1-reference","kind":"vector","embedding_space":"model-version-preprocess-v1","vectors":[[1,0],[0.9,0.1]],"tool_sequences":[]}
```

To compare, POST `/api/drift` with the same fields, replace vectors with your current samples, and add `baseline_id` and `threshold` (0–1). Do not change embedding-space identity.

## Example agent baseline body

```json
{"project":"demo","name":"agent-release-v1","kind":"agent","tool_sequences":[["search","answer"],["search","answer"]]}
```

For comparison supply current tool sequences and baseline_id. Results are stored in evaluations with trace_id=null.

# Operations and deployment

## Cost and hosting

All required server components are open-source. PostgreSQL is free to self-host; there is no database vendor account requirement. A provider's free managed PostgreSQL plan is optional and subject to its quotas, availability, TLS rules and terms. No hosted plan is required or promised here.

For a truly open-source runtime use a Linux host with Docker Engine + Compose or equivalent OCI tooling. Docker Desktop, GitHub Codespaces and cloud providers have separate terms. A static hosting platform alone cannot run this whole stack. A small developer machine can run the app without Ollama; running a local judge is much heavier. Measure actual memory/disk use before sizing production.

## Networking

Compose binds dashboard 8080 and API 8000 to localhost; database and Ollama have no public ports. In Codespaces use private forwarded ports. For public hosting terminate HTTPS at a reverse proxy on the same host and keep database/Ollama private. Add authenticated per-user access and rate limits before a multi-user launch. Do not publish an admin API key in frontend source or a VITE_ environment variable.

The dashboard holds the key in React memory only. Refreshing/signing out clears it. Keys are workspace-wide shared credentials; there is no per-user session revocation or tenant isolation.

## Backups

From a POSIX shell on the Compose host:

```bash
docker compose exec -T db pg_dump -U hakscatch -d hakscatch -Fc > hakscatch.dump
```

Back up `.env` separately in a secret store. Encrypt database backups, because telemetry may contain sensitive text. Restore into a separate empty PostgreSQL database and verify before switching traffic. Never overwrite a live database casually.

## Retention

Set DATABASE_URL to the target database and install backend requirements. Run `python scripts/retention.py --days 30` for a dry run. Add `--apply` only after verifying backups and deletion scope. This deletes old traces (and their dependent evaluations), logs, metrics and evaluations across all projects. Baselines are retained. Schedule the command with cron/systemd on your host; no automatic deletion is enabled by default.

## Security limits

Basic redaction removes emails, Bearer tokens and sensitive dictionary keys. It is not a complete PII/DLP system: arbitrary secrets in prompts/logs may remain. Minimize content at the producer. SDK capture_content is off by default. Request bodies are limited to 2MB, but this is not a complete abuse-prevention mechanism. Install rate/concurrency limits at the gateway. Evaluate encryption-at-rest, audit logs and tenant isolation before storing customer data.

The initial schema uses a startup advisory lock for creation. Review upgrades and run backups before changing database versions. Pin container digests and scan dependencies/images for your deployment. The included package lock and Python pins reproduce the delivered dependency set, not a guarantee of future security.

## Known MVP limits

No durable queue, batching, retries, RBAC/SSO, per-project keys, billing, scheduled judge jobs, email/Slack alerts, agent framework auto-instrumentation, OTLP receiver, object storage or distributed trace propagation. Long judge calls occupy an API worker thread. Drift alerts are visible in stored results, not sent externally. Logs are PostgreSQL records, not an unlimited log archive.

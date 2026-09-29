"""Generate local credentials without overwriting an existing environment."""
from pathlib import Path
import secrets
p=Path(__file__).resolve().parents[1]/'.env'
if p.exists():
    print('.env already exists; left unchanged.')
else:
    p.write_text('POSTGRES_PASSWORD='+secrets.token_hex(24)+'\nHAKSCATCH_ADMIN_KEY='+secrets.token_hex(24)+'\nHAKSCATCH_INGEST_KEY='+secrets.token_hex(24)+'\nOLLAMA_MODEL=\n')
    p.chmod(0o600)
    print('Created .env. Keep it private. Paste HAKSCATCH_ADMIN_KEY into the dashboard.')

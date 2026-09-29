import os
from pathlib import Path
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
pool = ConnectionPool(os.getenv("DATABASE_URL", "postgresql://hakscatch:hakscatch@localhost:5432/hakscatch"),
                      min_size=1,max_size=8,open=False,kwargs={"row_factory":dict_row})
def migrate():
    with pool.connection() as c:
        c.execute("SELECT pg_advisory_xact_lock(73482910)")
        c.execute(Path(__file__).with_name("schema.sql").read_text())

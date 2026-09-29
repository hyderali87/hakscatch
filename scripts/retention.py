"""Explicit manual retention job. Export/back up before deleting."""
import argparse,os
import psycopg
p=argparse.ArgumentParser();p.add_argument('--days',type=int,default=30);p.add_argument('--apply',action='store_true');a=p.parse_args()
if a.days<1:raise SystemExit('days must be positive')
with psycopg.connect(os.environ['DATABASE_URL']) as c:
    for table in ['evaluations','logs','metrics','traces']:
        # table comes from the hardcoded allowlist above, never user input.
        n=c.execute(f"SELECT count(*) FROM {table} WHERE created_at < now() - %s * interval '1 day'",(a.days,)).fetchone()[0]
        print(table,n,'delete' if a.apply else 'dry-run')
        if a.apply:c.execute(f"DELETE FROM {table} WHERE created_at < now() - %s * interval '1 day'",(a.days,))
print('Baselines retained. Run VACUUM via your database maintenance schedule.')

CREATE TABLE IF NOT EXISTS schema_version(version integer PRIMARY KEY);
INSERT INTO schema_version VALUES (1) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS traces (
 id text PRIMARY KEY, project text NOT NULL, name text NOT NULL, model text NOT NULL,
 status text NOT NULL, latency_ms double precision NOT NULL, input_tokens integer NOT NULL,
 output_tokens integer NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS traces_project_time ON traces(project, created_at DESC);
CREATE TABLE IF NOT EXISTS logs (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, project text NOT NULL,
 trace_id text REFERENCES traces(id) ON DELETE SET NULL, level text NOT NULL, message text NOT NULL,
 attributes jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS logs_project_time ON logs(project, created_at DESC);
CREATE INDEX IF NOT EXISTS logs_search ON logs USING gin(to_tsvector('english',message));
CREATE TABLE IF NOT EXISTS metrics (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, project text NOT NULL, name text NOT NULL,
 value double precision NOT NULL, unit text NOT NULL, attributes jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS metrics_project_time ON metrics(project,created_at DESC);
CREATE TABLE IF NOT EXISTS evaluations (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, project text NOT NULL,
 trace_id text REFERENCES traces(id) ON DELETE CASCADE, kind text NOT NULL,
 result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evaluations_project_time ON evaluations(project,created_at DESC);
CREATE TABLE IF NOT EXISTS baselines (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, project text NOT NULL,
 name text NOT NULL, kind text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(project,name,kind)
);

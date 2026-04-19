CREATE TABLE IF NOT EXISTS llm_traces (
    id SERIAL PRIMARY KEY,
    trace_id UUID DEFAULT gen_random_uuid(),
    session_id VARCHAR(64),
    user_id VARCHAR(64) DEFAULT 'anonymous',
    model VARCHAR(128) NOT NULL,
    provider VARCHAR(64) NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    total_tokens INT NOT NULL DEFAULT 0,
    latency_ms FLOAT NOT NULL DEFAULT 0,
    estimated_cost_usd FLOAT NOT NULL DEFAULT 0,
    status VARCHAR(16) NOT NULL DEFAULT 'success',
    error_message TEXT,
    prompt_preview TEXT,
    response_preview TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traces_created_at ON llm_traces(created_at);
CREATE INDEX IF NOT EXISTS idx_traces_session_id ON llm_traces(session_id);
CREATE INDEX IF NOT EXISTS idx_traces_model ON llm_traces(model);

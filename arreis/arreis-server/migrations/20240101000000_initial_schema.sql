CREATE TABLE agents (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    temperature REAL NOT NULL,
    created_at INTEGER NOT NULL
);

CREATE TABLE memories (
    id TEXT PRIMARY KEY NOT NULL,
    agent_id TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata TEXT NOT NULL, -- JSON
    timestamp INTEGER NOT NULL,
    FOREIGN KEY(agent_id) REFERENCES agents(id)
);

CREATE TABLE tools (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    parameters TEXT NOT NULL, -- JSON Schema
    created_at INTEGER NOT NULL
);

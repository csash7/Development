use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MemoryError {
    #[error("Storage error: {0}")]
    Storage(String),
    #[error("Retrieval error: {0}")]
    Retrieval(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub content: String,
    pub metadata: serde_json::Value,
    pub timestamp: i64,
}

#[async_trait]
pub trait MemoryStore: Send + Sync {
    async fn store(&self, entry: MemoryEntry) -> Result<(), MemoryError>;
    async fn retrieve(&self, query: String, limit: usize) -> Result<Vec<MemoryEntry>, MemoryError>;
}

#[cfg(feature = "sqlite")]
pub struct SqliteMemoryStore {
    pool: sqlx::SqlitePool,
}

#[cfg(feature = "sqlite")]
impl SqliteMemoryStore {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        Self { pool }
    }
}

#[cfg(feature = "sqlite")]
#[async_trait]
impl MemoryStore for SqliteMemoryStore {
    async fn store(&self, entry: MemoryEntry) -> Result<(), MemoryError> {
        sqlx::query(
            "INSERT INTO memories (id, agent_id, content, metadata, timestamp) VALUES (?, ?, ?, ?, ?)",
        )
        .bind(&entry.id)
        .bind("default_agent") // TODO: Pass agent_id
        .bind(&entry.content)
        .bind(entry.metadata.to_string())
        .bind(entry.timestamp)
        .execute(&self.pool)
        .await
        .map_err(|e| MemoryError::Storage(e.to_string()))?;
        Ok(())
    }

    async fn retrieve(&self, _query: String, limit: usize) -> Result<Vec<MemoryEntry>, MemoryError> {
        // Simple retrieval by recency for now (ignoring query semantic search)
        let rows = sqlx::query_as::<_, (String, String, String, String, i64)>(
            "SELECT id, agent_id, content, metadata, timestamp FROM memories ORDER BY timestamp DESC LIMIT ?",
        )
        .bind(limit as i64)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| MemoryError::Retrieval(e.to_string()))?;

        let entries = rows
            .into_iter()
            .map(|(id, _, content, metadata_str, timestamp)| {
                let metadata = serde_json::from_str(&metadata_str).unwrap_or(serde_json::Value::Null);
                MemoryEntry {
                    id,
                    content,
                    metadata,
                    timestamp,
                }
            })
            .collect();

        Ok(entries)
    }
}

use async_trait::async_trait;
use serde_json::Value;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ToolError {
    #[error("Execution error: {0}")]
    Execution(String),
    #[error("Invalid arguments: {0}")]
    InvalidArguments(String),
}

#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters(&self) -> Value; // JSON Schema
    async fn execute(&self, args: Value) -> Result<Value, ToolError>;
}

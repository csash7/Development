use arreis_core::agent::{Agent, AgentConfig};
use arreis_core::llm::{CompletionRequest, CompletionResponse, LLMError, LLMProvider, Usage};
use arreis_core::memory::{MemoryEntry, MemoryError, MemoryStore, SqliteMemoryStore};
use arreis_core::tools::Tool;
use arreis_core::workflow::WorkflowGraph;
use async_trait::async_trait;
use axum::{
    extract::{Json, Path, State},
    routing::{get, post, put},
    Router,
};
use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqlitePoolOptions;
use std::sync::Arc;
use uuid::Uuid;

// --- Mock LLM (Still mock for now) ---

struct MockLLM;

#[async_trait]
impl LLMProvider for MockLLM {
    async fn complete(&self, _request: CompletionRequest) -> Result<CompletionResponse, LLMError> {
        Ok(CompletionResponse {
            content: "This is a mock response from Arreis (Persistent).".to_string(),
            usage: Some(Usage {
                prompt_tokens: 10,
                completion_tokens: 10,
                total_tokens: 20,
            }),
        })
    }
}

// --- Server State ---

#[derive(Clone)]
struct AppState {
    // For now, we keep a single active agent in memory for chat, 
    // but we store configs in DB. In a real system, we'd load agents on demand.
    agent: Arc<Agent>, 
    db: sqlx::SqlitePool,
}

#[derive(Deserialize)]
struct ChatRequest {
    message: String,
}

#[derive(Serialize)]
struct ChatResponse {
    response: String,
}

#[derive(Deserialize)]
struct CreateAgentRequest {
    name: String,
    system_prompt: String,
    temperature: f32,
    #[serde(default)]
    tool_ids: Vec<String>,
    workflow_graph: Option<WorkflowGraph>,
}

#[derive(Deserialize)]
struct UpdateAgentRequest {
    name: Option<String>,
    system_prompt: Option<String>,
    temperature: Option<f32>,
    tool_ids: Option<Vec<String>>,
    workflow_graph: Option<WorkflowGraph>,
}

#[derive(Deserialize)]
struct CreateToolRequest {
    name: String,
    description: String,
    parameters: serde_json::Value,
}

#[derive(Serialize)]
struct AgentDto {
    id: String,
    name: String,
    system_prompt: String,
    temperature: f32,
    tool_ids: Vec<String>,
    workflow_graph: Option<WorkflowGraph>,
    created_at: i64,
}

#[derive(Serialize)]
struct ToolDto {
    id: String,
    name: String,
    description: String,
    parameters: serde_json::Value,
    created_at: i64,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:arreis.db?mode=rwc".to_string());

    // 1. Setup DB
    let pool = SqlitePoolOptions::new()
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // 2. Run Migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    // 3. Setup Core Components
    let llm = Arc::new(MockLLM);
    let memory = Arc::new(SqliteMemoryStore::new(pool.clone()));
    let tools: Vec<Arc<dyn Tool>> = vec![];

    // Default agent for testing
    let config = AgentConfig {
        name: "Default Agent".to_string(),
        system_prompt: "You are a helpful assistant.".to_string(),
        temperature: 0.7,
        workflow_graph: None,
    };
    let agent = Arc::new(Agent::new(config, llm, memory, tools));

    let state = AppState { 
        agent,
        db: pool,
    };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/v1/chat", post(chat_handler))
        .route("/v1/agents", post(create_agent_handler))
        .route("/v1/agents", get(list_agents_handler))
        .route("/v1/agents/{id}", put(update_agent_handler))
        .route("/v1/agents/{id}", get(get_agent_handler))
        .route("/v1/tools", post(create_tool_handler))
        .route("/v1/tools", get(list_tools_handler))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await?;
    tracing::info!("listening on {}", listener.local_addr()?);
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}

async fn chat_handler(
    State(state): State<AppState>,
    Json(payload): Json<ChatRequest>,
) -> Json<ChatResponse> {
    match state.agent.chat(&payload.message).await {
        Ok(response) => Json(ChatResponse { response }),
        Err(e) => Json(ChatResponse {
            response: format!("Error: {}", e),
        }),
    }
}

async fn create_agent_handler(
    State(state): State<AppState>,
    Json(payload): Json<CreateAgentRequest>,
) -> Json<AgentDto> {
    let id = Uuid::new_v4().to_string();
    let created_at = chrono::Utc::now().timestamp();
    let tool_ids_json = serde_json::to_string(&payload.tool_ids).unwrap_or_else(|_| "[]".to_string());
    let workflow_graph_json = serde_json::to_string(&payload.workflow_graph).ok();

    sqlx::query(
        "INSERT INTO agents (id, name, system_prompt, temperature, tool_ids, workflow_graph, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.system_prompt)
    .bind(payload.temperature)
    .bind(tool_ids_json)
    .bind(workflow_graph_json)
    .bind(created_at)
    .execute(&state.db)
    .await
    .unwrap();

    Json(AgentDto {
        id,
        name: payload.name,
        system_prompt: payload.system_prompt,
        temperature: payload.temperature,
        tool_ids: payload.tool_ids,
        workflow_graph: payload.workflow_graph,
        created_at,
    })
}

async fn list_agents_handler(
    State(state): State<AppState>,
) -> Json<Vec<AgentDto>> {
    let rows = sqlx::query_as::<_, (String, String, String, f32, String, Option<String>, i64)>(
        "SELECT id, name, system_prompt, temperature, tool_ids, workflow_graph, created_at FROM agents ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .unwrap();

    let agents = rows
        .into_iter()
        .map(|(id, name, system_prompt, temperature, tool_ids_str, workflow_graph_str, created_at)| {
            let tool_ids: Vec<String> = serde_json::from_str(&tool_ids_str).unwrap_or_default();
            let workflow_graph: Option<WorkflowGraph> = workflow_graph_str
                .and_then(|s| serde_json::from_str(&s).ok());
            
            AgentDto {
                id,
                name,
                system_prompt,
                temperature,
                tool_ids,
                workflow_graph,
                created_at,
            }
        })
        .collect();

    Json(agents)
}

async fn get_agent_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Json<AgentDto> {
    let row = sqlx::query_as::<_, (String, String, String, f32, String, Option<String>, i64)>(
        "SELECT id, name, system_prompt, temperature, tool_ids, workflow_graph, created_at FROM agents WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .unwrap();

    let (id, name, system_prompt, temperature, tool_ids_str, workflow_graph_str, created_at) = row;
    let tool_ids: Vec<String> = serde_json::from_str(&tool_ids_str).unwrap_or_default();
    let workflow_graph: Option<WorkflowGraph> = workflow_graph_str.and_then(|s| serde_json::from_str(&s).ok());

    Json(AgentDto {
        id,
        name,
        system_prompt,
        temperature,
        tool_ids,
        workflow_graph,
        created_at,
    })
}

async fn update_agent_handler(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateAgentRequest>,
) -> Json<AgentDto> {
    // First get existing agent
    let existing = sqlx::query_as::<_, (String, String, String, f32, String, Option<String>, i64)>(
        "SELECT id, name, system_prompt, temperature, tool_ids, workflow_graph, created_at FROM agents WHERE id = ?",
    )
    .bind(&id)
    .fetch_one(&state.db)
    .await
    .unwrap();

    let name = payload.name.unwrap_or(existing.1);
    let system_prompt = payload.system_prompt.unwrap_or(existing.2);
    let temperature = payload.temperature.unwrap_or(existing.3);
    
    let tool_ids = payload.tool_ids.unwrap_or_else(|| serde_json::from_str(&existing.4).unwrap_or_default());
    let tool_ids_json = serde_json::to_string(&tool_ids).unwrap_or_else(|_| "[]".to_string());

    let workflow_graph = payload.workflow_graph.or_else(|| existing.5.and_then(|s| serde_json::from_str(&s).ok()));
    let workflow_graph_json = serde_json::to_string(&workflow_graph).ok();

    sqlx::query(
        "UPDATE agents SET name = ?, system_prompt = ?, temperature = ?, tool_ids = ?, workflow_graph = ? WHERE id = ?",
    )
    .bind(&name)
    .bind(&system_prompt)
    .bind(temperature)
    .bind(tool_ids_json)
    .bind(workflow_graph_json)
    .bind(&id)
    .execute(&state.db)
    .await
    .unwrap();

    Json(AgentDto {
        id,
        name,
        system_prompt,
        temperature,
        tool_ids,
        workflow_graph,
        created_at: existing.6,
    })
}

async fn create_tool_handler(
    State(state): State<AppState>,
    Json(payload): Json<CreateToolRequest>,
) -> Json<ToolDto> {
    let id = Uuid::new_v4().to_string();
    let created_at = chrono::Utc::now().timestamp();
    let parameters_json = serde_json::to_string(&payload.parameters).unwrap_or_else(|_| "{}".to_string());

    sqlx::query(
        "INSERT INTO tools (id, name, description, parameters, created_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&payload.name)
    .bind(&payload.description)
    .bind(parameters_json)
    .bind(created_at)
    .execute(&state.db)
    .await
    .unwrap();

    Json(ToolDto {
        id,
        name: payload.name,
        description: payload.description,
        parameters: payload.parameters,
        created_at,
    })
}

async fn list_tools_handler(
    State(state): State<AppState>,
) -> Json<Vec<ToolDto>> {
    let rows = sqlx::query_as::<_, (String, String, String, String, i64)>(
        "SELECT id, name, description, parameters, created_at FROM tools ORDER BY created_at DESC",
    )
    .fetch_all(&state.db)
    .await
    .unwrap();

    let tools = rows
        .into_iter()
        .map(|(id, name, description, parameters_str, created_at)| {
            let parameters: serde_json::Value = serde_json::from_str(&parameters_str).unwrap_or(serde_json::Value::Null);
            ToolDto {
                id,
                name,
                description,
                parameters,
                created_at,
            }
        })
        .collect();

    Json(tools)
}

use crate::llm::{CompletionRequest, LLMProvider, Message};
use crate::memory::MemoryStore;
use crate::tools::Tool;
use crate::workflow::{NodeType, WorkflowGraph};
use std::sync::Arc;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AgentError {
    #[error("LLM error: {0}")]
    LLM(#[from] crate::llm::LLMError),
    #[error("Memory error: {0}")]
    Memory(#[from] crate::memory::MemoryError),
    #[error("Tool error: {0}")]
    Tool(#[from] crate::tools::ToolError),
    #[error("Workflow error: {0}")]
    Workflow(String),
}

pub struct AgentConfig {
    pub name: String,
    pub system_prompt: String,
    pub temperature: f32,
    pub workflow_graph: Option<WorkflowGraph>,
}

pub struct Agent {
    config: AgentConfig,
    llm: Arc<dyn LLMProvider>,
    memory: Arc<dyn MemoryStore>,
    tools: Vec<Arc<dyn Tool>>,
}

impl Agent {
    pub fn new(
        config: AgentConfig,
        llm: Arc<dyn LLMProvider>,
        memory: Arc<dyn MemoryStore>,
        tools: Vec<Arc<dyn Tool>>,
    ) -> Self {
        Self {
            config,
            llm,
            memory,
            tools,
        }
    }

    pub async fn chat(&self, user_input: &str) -> Result<String, AgentError> {
        if let Some(graph) = &self.config.workflow_graph {
            return self.execute_workflow(user_input, graph).await;
        }

        // 1. Retrieve context from memory
        let context = self.memory.retrieve(user_input.to_string(), 5).await?;
        let context_str = context
            .iter()
            .map(|entry| entry.content.clone())
            .collect::<Vec<_>>()
            .join("\n");

        // 2. Construct messages
        let mut messages = vec![
            Message {
                role: "system".to_string(),
                content: format!("{}\n\nContext:\n{}", self.config.system_prompt, context_str),
            },
            Message {
                role: "user".to_string(),
                content: user_input.to_string(),
            },
        ];

        // 3. Call LLM
        let request = CompletionRequest {
            messages: messages.clone(),
            temperature: self.config.temperature,
            max_tokens: None,
        };

        let response = self.llm.complete(request).await?;
        
        // TODO: Tool execution loop would go here

        // 4. Store interaction in memory
        // For now, we just return the response. In a real system, we'd store the user input and agent response.
        
        Ok(response.content)
    }

    async fn execute_workflow(&self, user_input: &str, graph: &WorkflowGraph) -> Result<String, AgentError> {
        let start_node = graph.get_start_node().ok_or(AgentError::Workflow("No start node found".to_string()))?;
        
        let mut current_node = start_node;
        let mut context = user_input.to_string(); // Simple context passing for now

        // Limit iterations to prevent infinite loops
        for _ in 0..20 {
            match &current_node.node_type {
                NodeType::Start => {
                    // Just move to next
                }
                NodeType::LLM { system_prompt, temperature } => {
                     let messages = vec![
                        Message {
                            role: "system".to_string(),
                            content: system_prompt.clone(),
                        },
                        Message {
                            role: "user".to_string(),
                            content: context.clone(),
                        },
                    ];
                    let request = CompletionRequest {
                        messages,
                        temperature: *temperature,
                        max_tokens: None,
                    };
                    let response = self.llm.complete(request).await?;
                    context = response.content;
                }
                NodeType::Tool { tool_id: _ } => {
                    // TODO: Execute tool
                }
                NodeType::Condition { expression: _ } => {
                    // TODO: Evaluate expression
                }
                NodeType::End => {
                    return Ok(context);
                }
            }

            let next_nodes = graph.get_next_nodes(&current_node.id);
            if next_nodes.is_empty() {
                break;
            }
            // For now, just take the first one (linear flow)
            current_node = next_nodes[0];
        }

        Ok(context)
    }
}

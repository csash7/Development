use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NodeType {
    Start,
    LLM {
        system_prompt: String,
        temperature: f32,
    },
    Tool {
        tool_id: String,
    },
    Condition {
        expression: String, // e.g., "result contains 'error'"
    },
    End,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Node {
    pub id: String,
    pub node_type: NodeType,
    pub position: Position, // For UI persistence
    pub data: HashMap<String, String>, // Extra metadata
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Edge {
    pub id: String,
    pub source: String,
    pub target: String,
    pub label: Option<String>, // For condition branches (e.g., "true", "false")
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkflowGraph {
    pub nodes: Vec<Node>,
    pub edges: Vec<Edge>,
}

impl WorkflowGraph {
    pub fn new() -> Self {
        Self {
            nodes: vec![],
            edges: vec![],
        }
    }

    pub fn get_start_node(&self) -> Option<&Node> {
        self.nodes.iter().find(|n| matches!(n.node_type, NodeType::Start))
    }

    pub fn get_next_nodes(&self, current_node_id: &str) -> Vec<&Node> {
        let target_ids: Vec<&String> = self
            .edges
            .iter()
            .filter(|e| e.source == current_node_id)
            .map(|e| &e.target)
            .collect();

        self.nodes
            .iter()
            .filter(|n| target_ids.contains(&&n.id))
            .collect()
    }
}

const API_BASE = "http://localhost:3000/v1";

export interface Agent {
    id: string;
    name: string;
    system_prompt: string;
    temperature: number;
    tool_ids: string[];
    workflow_graph?: any; // JSON graph
    created_at: number;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    parameters: any;
    created_at: number;
}

export interface CreateAgentRequest {
    name: string;
    system_prompt: string;
    temperature: number;
    tool_ids: string[];
    workflow_graph?: any;
}

export interface UpdateAgentRequest {
    name?: string;
    system_prompt?: string;
    temperature?: number;
    tool_ids?: string[];
    workflow_graph?: any;
}

export interface CreateToolRequest {
    name: string;
    description: string;
    parameters: any;
}

export const api = {
    agents: {
        list: async (): Promise<Agent[]> => {
            const res = await fetch(`${API_BASE}/agents`);
            return res.json();
        },
        create: async (data: CreateAgentRequest): Promise<Agent> => {
            const res = await fetch(`${API_BASE}/agents`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return res.json();
        },
        get: async (id: string): Promise<Agent> => {
            const res = await fetch(`${API_BASE}/agents/${id}`);
            return res.json();
        },
        update: async (id: string, data: UpdateAgentRequest): Promise<Agent> => {
            const res = await fetch(`${API_BASE}/agents/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return res.json();
        },
    },
    tools: {
        list: async (): Promise<Tool[]> => {
            const res = await fetch(`${API_BASE}/tools`);
            return res.json();
        },
        create: async (data: CreateToolRequest): Promise<Tool> => {
            const res = await fetch(`${API_BASE}/tools`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            return res.json();
        },
    },
    chat: async (message: string): Promise<string> => {
        const res = await fetch(`${API_BASE}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message }),
        });
        const data = await res.json();
        return data.response;
    },
};

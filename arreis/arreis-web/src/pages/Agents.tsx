import { useEffect, useState } from "react";
import { Plus, Bot, Wrench, Save, X } from "lucide-react";
import { type Agent, type Tool, api } from "../lib/api";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export function Agents() {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [tools, setTools] = useState<Tool[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        system_prompt: "You are a helpful assistant.",
        temperature: 0.7,
        tool_ids: [] as string[],
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [agentsData, toolsData] = await Promise.all([
                api.agents.list(),
                api.tools.list(),
            ]);
            setAgents(agentsData);
            setTools(toolsData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            const newAgent = await api.agents.create(formData);
            setIsCreating(false);
            navigate(`/agent/${newAgent.id}/builder`);
        } catch (error) {
            console.error("Failed to create agent", error);
        }
    }

    const toggleTool = (toolId: string) => {
        setFormData((prev) => ({
            ...prev,
            tool_ids: prev.tool_ids.includes(toolId)
                ? prev.tool_ids.filter((id) => id !== toolId)
                : [...prev.tool_ids, toolId],
        }));
    };

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Agents</h2>
                    <p className="text-muted-foreground">Manage your AI personas and their capabilities.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    New Agent
                </button>
            </div>

            {isCreating && (
                <div className="rounded-xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Create New Agent</h3>
                        <button onClick={() => setIsCreating(false)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="e.g. Customer Support"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Temperature ({formData.temperature})</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={formData.temperature}
                                        onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                                        className="mt-1.5 w-full"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">System Prompt</label>
                                    <textarea
                                        required
                                        value={formData.system_prompt}
                                        onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                                        className="mt-1.5 flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Define the agent's personality and rules..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium">Skills (Tools)</label>
                                <div className="grid gap-2">
                                    {tools.map((tool) => (
                                        <div
                                            key={tool.id}
                                            onClick={() => toggleTool(tool.id)}
                                            className={cn(
                                                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50",
                                                formData.tool_ids.includes(tool.id) ? "border-primary bg-primary/5" : "bg-card"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full",
                                                formData.tool_ids.includes(tool.id) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}>
                                                <Wrench className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{tool.name}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-1">{tool.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {tools.length === 0 && (
                                        <p className="text-sm text-muted-foreground italic">No tools available. Create one in the Tools page.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                <Save className="h-4 w-4" />
                                Create Agent
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                    <div
                        key={agent.id}
                        onClick={() => navigate(`/agent/${agent.id}/builder`)}
                        className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md cursor-pointer hover:border-primary/50"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{agent.name}</h3>
                                    <p className="text-xs text-muted-foreground">Created {new Date(agent.created_at * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                            {agent.system_prompt}
                        </p>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {agent.tool_ids.map((_, i) => (
                                    <div key={i} className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-medium">
                                        <Wrench className="h-3 w-3" />
                                    </div>
                                ))}
                            </div>
                            {agent.tool_ids.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {agent.tool_ids.length} skill{agent.tool_ids.length !== 1 && 's'}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

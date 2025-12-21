import { useEffect, useState } from "react";
import { Plus, Wrench, Save, X, Code } from "lucide-react";
import { type Tool, api } from "../lib/api";

export function Tools() {
    const [tools, setTools] = useState<Tool[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        parameters: JSON.stringify({
            type: "object",
            properties: {
                location: { type: "string" }
            },
            required: ["location"]
        }, null, 2),
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const data = await api.tools.list();
            setTools(data);
        } catch (error) {
            console.error("Failed to load tools", error);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            await api.tools.create({
                ...formData,
                parameters: JSON.parse(formData.parameters),
            });
            setIsCreating(false);
            setFormData({
                name: "",
                description: "",
                parameters: JSON.stringify({ type: "object" }, null, 2),
            });
            loadData();
        } catch (error) {
            console.error("Failed to create tool", error);
            alert("Invalid JSON parameters");
        }
    }

    if (isLoading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Tools</h2>
                    <p className="text-muted-foreground">Define capabilities your agents can use.</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    New Tool
                </button>
            </div>

            {isCreating && (
                <div className="rounded-xl border bg-card p-6 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Create New Tool</h3>
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
                                        placeholder="e.g. Weather"
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Description</label>
                                    <textarea
                                        required
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="mt-1.5 flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Describe what this tool does..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-medium">Parameters (JSON Schema)</label>
                                <div className="relative">
                                    <textarea
                                        required
                                        value={formData.parameters}
                                        onChange={(e) => setFormData({ ...formData, parameters: e.target.value })}
                                        className="flex min-h-[200px] w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                    <Code className="absolute top-3 right-3 h-4 w-4 text-muted-foreground" />
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
                                Create Tool
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                    <div key={tool.id} className="group relative rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Wrench className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{tool.name}</h3>
                                    <p className="text-xs text-muted-foreground">Created {new Date(tool.created_at * 1000).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                            {tool.description}
                        </p>
                        <div className="mt-4 rounded-md bg-muted p-2">
                            <pre className="text-[10px] text-muted-foreground overflow-x-auto">
                                {JSON.stringify(tool.parameters, null, 2)}
                            </pre>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

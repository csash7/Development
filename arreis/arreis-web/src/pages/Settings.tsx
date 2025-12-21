import { Save } from "lucide-react";

export function Settings() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Manage platform configuration.</p>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">General</h3>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="text-sm font-medium">Platform Name</label>
                        <input
                            type="text"
                            disabled
                            value="Arreis Agent OS"
                            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm opacity-50 cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Default Model</label>
                        <select className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            <option>GPT-4o</option>
                            <option>Claude 3.5 Sonnet</option>
                            <option>Llama 3</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">API Keys</h3>
                <div className="space-y-4 max-w-md">
                    <div>
                        <label className="text-sm font-medium">OpenAI API Key</label>
                        <input
                            type="password"
                            placeholder="sk-..."
                            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Anthropic API Key</label>
                        <input
                            type="password"
                            placeholder="sk-ant-..."
                            className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        <Save className="h-4 w-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

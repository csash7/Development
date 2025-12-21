import { useEffect, useState, useRef } from "react";
import { Send, Bot, User, Terminal } from "lucide-react";
import { type Agent, api } from "../lib/api";
import { cn } from "../lib/utils";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function Playground() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadAgents();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function loadAgents() {
        try {
            const data = await api.agents.list();
            setAgents(data);
            if (data.length > 0) {
                setSelectedAgentId(data[0].id);
            }
        } catch (error) {
            console.error("Failed to load agents", error);
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        if (!input.trim() || !selectedAgentId) return;

        const userMessage = { role: "user" as const, content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // TODO: Pass agentId to chat API once backend supports it
            const response = await api.chat(input);
            const assistantMessage = { role: "assistant" as const, content: response };
            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error("Failed to send message", error);
            setMessages((prev) => [...prev, { role: "assistant", content: "Error: Failed to get response." }]);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            <div className="flex flex-1 flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <Bot className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold">Playground</h2>
                            <p className="text-xs text-muted-foreground">Test your agents in real-time</p>
                        </div>
                    </div>
                    <select
                        value={selectedAgentId}
                        onChange={(e) => setSelectedAgentId(e.target.value)}
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name}
                            </option>
                        ))}
                        {agents.length === 0 && <option disabled>No agents found</option>}
                    </select>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                            <Bot className="h-12 w-12 mb-4 opacity-20" />
                            <p>Select an agent and start chatting to test capabilities.</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                "flex gap-3 max-w-[80%]",
                                msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                            )}
                        >
                            <div
                                className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                )}
                            >
                                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                            </div>
                            <div
                                className={cn(
                                    "rounded-lg px-4 py-2 text-sm",
                                    msg.role === "user"
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-foreground"
                                )}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3 max-w-[80%]">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                <Bot className="h-4 w-4" />
                            </div>
                            <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]"></span>
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]"></span>
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t p-4">
                    <form onSubmit={handleSend} className="flex gap-2">
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            </div>

            {/* Debug Panel (Placeholder) */}
            <div className="hidden w-80 flex-col rounded-xl border bg-card shadow-sm lg:flex">
                <div className="border-b px-6 py-4">
                    <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold">Debug Console</h2>
                    </div>
                </div>
                <div className="flex-1 p-6 text-xs font-mono text-muted-foreground">
                    <p className="mb-2 text-green-500">$ system ready</p>
                    <p className="mb-2 opacity-50">Waiting for events...</p>
                </div>
            </div>
        </div>
    );
}

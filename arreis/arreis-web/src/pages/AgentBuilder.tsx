import { useCallback, useEffect, useState, useRef } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    type Connection,
    type Edge,
    type Node,
    ReactFlowProvider,
    useReactFlow,
    Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Save, Plus, ArrowLeft, Settings, Trash2 } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, type Tool } from '../lib/api';

function BuilderContent() {
    const { agentId } = useParams();
    const navigate = useNavigate();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [agentName, setAgentName] = useState('');
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [availableTools, setAvailableTools] = useState<Tool[]>([]);

    useEffect(() => {
        if (agentId) {
            loadAgent(agentId);
        }
        loadTools();
    }, [agentId]);

    async function loadAgent(id: string) {
        try {
            const agent = await api.agents.get(id);
            setAgentName(agent.name);
            if (agent.workflow_graph) {
                setNodes(agent.workflow_graph.nodes || []);
                setEdges(agent.workflow_graph.edges || []);
            } else {
                // Default start node if empty
                setNodes([
                    { id: '1', position: { x: 250, y: 100 }, data: { label: 'Start' }, type: 'input' },
                ]);
            }
        } catch (error) {
            console.error("Failed to load agent", error);
        }
    }

    async function loadTools() {
        try {
            const tools = await api.tools.list();
            setAvailableTools(tools);
        } catch (error) {
            console.error("Failed to load tools", error);
        }
    }

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: crypto.randomUUID(),
                type: type === 'Start' ? 'input' : type === 'End' ? 'output' : 'default',
                position,
                data: { label: `${type} Node`, type },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    const onNodeClick = (_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    };

    const onPaneClick = () => {
        setSelectedNode(null);
    };

    const updateNodeData = (key: string, value: any) => {
        if (!selectedNode) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    const updatedNode = {
                        ...node,
                        data: { ...node.data, [key]: value },
                    };
                    setSelectedNode(updatedNode); // Keep selection updated
                    return updatedNode;
                }
                return node;
            })
        );
    };

    const deleteSelectedNode = () => {
        if (!selectedNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
    };

    const handleSave = async () => {
        if (!agentId) return;
        const graph = {
            nodes,
            edges,
        };

        try {
            await api.agents.update(agentId, {
                name: agentName,
                workflow_graph: graph,
            });
            alert('Agent saved!');
        } catch (error) {
            console.error('Failed to save agent', error);
            alert('Failed to save agent');
        }
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-card">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/agents')} className="p-2 hover:bg-muted rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <input
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="text-lg font-bold bg-transparent border-none focus:outline-none"
                    />
                </div>
                <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    <Save className="w-4 h-4" /> Save Flow
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 border-r bg-card p-4 flex flex-col gap-4">
                    <h3 className="font-semibold text-sm text-muted-foreground">Nodes</h3>
                    <div className="space-y-2">
                        {['LLM', 'Tool', 'Condition', 'End'].map((type) => (
                            <div
                                key={type}
                                onDragStart={(event) => event.dataTransfer.setData('application/reactflow', type)}
                                draggable
                                className="p-3 border rounded-md bg-background cursor-move hover:border-primary transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4 text-muted-foreground" />
                                {type}
                            </div>
                        ))}
                    </div>
                    <div className="mt-auto text-xs text-muted-foreground">
                        Drag nodes to the canvas
                    </div>
                </aside>

                {/* Canvas */}
                <div className="flex-1 relative" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        onDragOver={onDragOver}
                        onDrop={onDrop}
                        fitView
                    >
                        <Controls />
                        <MiniMap />
                        <Background gap={12} size={1} />
                        <Panel position="top-right">
                            <div className="bg-card/50 p-2 rounded-md text-xs text-muted-foreground backdrop-blur-sm">
                                {nodes.length} nodes • {edges.length} edges
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>

                {/* Properties Panel */}
                {selectedNode && (
                    <aside className="w-80 border-l bg-card p-4 overflow-y-auto animate-in slide-in-from-right-10">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Properties
                            </h3>
                            <button onClick={deleteSelectedNode} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Label</label>
                                <input
                                    value={selectedNode.data.label as string}
                                    onChange={(e) => updateNodeData('label', e.target.value)}
                                    className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            {selectedNode.data.type === 'LLM' && (
                                <>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">System Prompt</label>
                                        <textarea
                                            value={(selectedNode.data.system_prompt as string) || ''}
                                            onChange={(e) => updateNodeData('system_prompt', e.target.value)}
                                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[100px]"
                                            placeholder="You are a helpful assistant..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Temperature</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="1"
                                            value={(selectedNode.data.temperature as number) || 0.7}
                                            onChange={(e) => updateNodeData('temperature', parseFloat(e.target.value))}
                                            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        />
                                    </div>
                                </>
                            )}

                            {selectedNode.data.type === 'Tool' && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Select Tool</label>
                                    <select
                                        value={(selectedNode.data.tool_id as string) || ''}
                                        onChange={(e) => updateNodeData('tool_id', e.target.value)}
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="">Select a tool...</option>
                                        {availableTools.map((tool) => (
                                            <option key={tool.id} value={tool.id}>
                                                {tool.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedNode.data.type === 'Condition' && (
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Expression</label>
                                    <input
                                        value={(selectedNode.data.expression as string) || ''}
                                        onChange={(e) => updateNodeData('expression', e.target.value)}
                                        className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
                                        placeholder="e.g. result contains 'error'"
                                    />
                                </div>
                            )}

                            <div className="pt-4 border-t text-xs text-muted-foreground">
                                ID: {selectedNode.id}
                            </div>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

export function AgentBuilder() {
    return (
        <ReactFlowProvider>
            <BuilderContent />
        </ReactFlowProvider>
    );
}

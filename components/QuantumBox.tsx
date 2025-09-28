import React, { useState, useRef, useCallback, MouseEvent as ReactMouseEvent, useEffect } from 'react';
import type { Node, Connection, NodeGraph } from '../types';
import { NODE_TEMPLATES, NodeTemplate, TAG_GROUPS } from '../constants';
import { generateFromQuantumBox } from '../services/geminiService';
import { ArrowUturnLeftIcon, SparklesIcon, CubeTransparentIcon, QuestionMarkCircleIcon } from './IconComponents';


// --- Sub-components ---

const PlanetComponent = React.memo(({ node, onMouseDown, onConnectorMouseDown, isSelected, onResizeStart, weight, isWeightingEnabled }: {
    node: Node;
    onMouseDown: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => void;
    onConnectorMouseDown: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string, type: 'in' | 'out') => void;
    isSelected: boolean;
    onResizeStart: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => void;
    weight: number;
    isWeightingEnabled: boolean;
}) => {
    const glowIntensity = isWeightingEnabled ? Math.max(0, (weight - 1.0) * 15) : 0;
    const glowColor = 'rgba(129, 140, 248, 0.7)'; // indigo-400

    return (
        <div
            className={`absolute glass-card flex items-center justify-center text-center transition-all duration-150 group z-10 float ${isSelected ? 'ring-2 ring-indigo-400' : ''}`}
            style={{
                left: node.position.x,
                top: node.position.y,
                width: node.size,
                height: node.size,
                borderColor: isSelected ? '#818cf8' : '#4b5563',
                borderWidth: 1,
                boxShadow: `0 0 ${glowIntensity}px 4px ${glowColor}`,
            }}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onClick={(e) => e.stopPropagation()} // FIX: Prevent click from bubbling to canvas and deselecting
            title={`Node: ${node.name} (${node.category})`}
        >
            {/* Input Connector */}
            <div
                className="absolute bg-cyan-400 w-4 h-4 rounded-full -left-2 top-1/2 -translate-y-1/2 cursor-crosshair hover:scale-125 transition-transform"
                onMouseDown={(e) => onConnectorMouseDown(e, node.id, 'in')}
                aria-label={`Input for ${node.name}`}
                title="Input Connector"
            />
            {/* Output Connector */}
            <div
                className="absolute bg-fuchsia-400 w-4 h-4 rounded-full -right-2 top-1/2 -translate-y-1/2 cursor-crosshair hover:scale-125 transition-transform"
                onMouseDown={(e) => onConnectorMouseDown(e, node.id, 'out')}
                aria-label={`Output for ${node.name}`}
                title="Output Connector"
            />

            <div className="font-bold text-gray-100 p-2 cursor-move select-none text-gradient-accent" style={{ fontSize: Math.max(8, node.size / 8) }}>
                {node.name}
            </div>

            {/* Resize Handle */}
            <div
                className="absolute -right-1 -bottom-1 w-5 h-5 bg-gray-600 rounded-full border-2 border-gray-900 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => onResizeStart(e, node.id)}
                title="Resize Node"
            />

            {/* Tooltip on hover */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                {node.description}
            </div>
        </div>
    );
});

const ConnectionComponent = React.memo<{
    fromPos: { x: number; y: number };
    toPos: { x: number; y: number };
    type: 'harmony' | 'tension';
    id: string;
    onToggle: (id: string) => void;
}>(({ fromPos, toPos, type, id, onToggle }) => {
    const path = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + 80} ${fromPos.y}, ${toPos.x - 80} ${toPos.y}, ${toPos.x} ${toPos.y}`;
    const strokeColor = type === 'harmony' ? 'rgb(59 130 246)' : 'rgb(239 68 68)';
    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2; // Simple midpoint, not perfect for bezier
    const glowClass = type === 'harmony' ? 'glow-indigo' : 'glow-fuchsia';
    const dashArray = type === 'tension' ? '5,5' : 'none';

    return (
        <g>
            <path d={path} stroke={strokeColor} strokeWidth="3" fill="none" className={`pointer-events-none ${glowClass}`} strokeDasharray={dashArray} />
            <g transform={`translate(${midX - 10}, ${midY - 10})`} className="cursor-pointer" onClick={() => onToggle(id)}>
                <rect width="20" height="20" rx="5" fill={strokeColor} />
                <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12">{type === 'harmony' ? 'H' : 'T'}</text>
            </g>
            {/* Tooltip on hover */}
            <g transform={`translate(${midX - 20}, ${midY - 30})`} className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <rect width="40" height="20" rx="5" fill="rgba(0,0,0,0.8)" />
                <text x="20" y="14" textAnchor="middle" fill="white" fontSize="10">{type === 'harmony' ? 'Harmony' : 'Tension'}</text>
            </g>
        </g>
    );
});


const NodeLibraryPanel = ({ onDragStart, onPreview }: {
    onDragStart: (e: React.DragEvent<HTMLDivElement>, template: NodeTemplate) => void;
    onPreview: (template: NodeTemplate) => void;
}) => {
    const groupedNodes = Object.values(NODE_TEMPLATES).reduce((acc, template) => {
        const category = template.category;
        if (!acc[category]) acc[category] = [];
        acc[category].push(template);
        return acc;
    }, {} as Record<string, NodeTemplate[]>);

    return (
        <aside className="glass-card w-64 p-4 flex flex-col fixed top-14 bottom-0 left-0 overflow-y-auto custom-scrollbar z-30">
            <div className="flex items-center gap-2 px-2 mb-4">
                <CubeTransparentIcon className="w-8 h-8 text-indigo-400" />
                <h1 className="text-xl font-bold text-gray-100">Tag Library</h1>
            </div>
            <div className="space-y-4">
                {Object.entries(groupedNodes).map(([category, templates]) => (
                    <div key={category}>
                        <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-2">{category}</h3>
                        <div className="space-y-2">
                            {templates.map(template => (
                                <div
                                    key={template.type}
                                    className="glass-card p-3 cursor-grab active:cursor-grabbing hover-lift transition-all"
                                    draggable
                                    onDragStart={(e) => onDragStart(e, template)}
                                    onClick={() => onPreview(template)}
                                >
                                    <p className="font-bold text-sm text-gray-100">{template.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
};

const InspectorPanel = ({ node, previewTemplate, onValueChange, onNodeDelete, onSizeChange }: {
    node: Node | null;
    previewTemplate: NodeTemplate | null;
    onValueChange: (nodeId: string, value: string) => void;
    onNodeDelete: (nodeId: string) => void;
    onSizeChange: (nodeId: string, size: number) => void;
}) => {
    if (!node && !previewTemplate) {
        return <div className="text-center text-sm text-gray-500 mt-8 p-4">Select a planet on the canvas or an item from the library to see details.</div>;
    }

    if (previewTemplate && !node) {
        return (
             <div className="space-y-4 p-2">
                <div className="glass-card p-3">
                    <h3 className="font-bold text-gray-100">{previewTemplate.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{previewTemplate.description}</p>
                </div>
                <div className="text-center text-xs text-gray-500 p-2 glass-card">
                    Drag this item from the library onto the canvas to use it.
                </div>
            </div>
        )
    }

    if (node) {
        return (
            <div className="space-y-4 p-2">
                <div className="glass-card p-3">
                    <h3 className="font-bold text-gray-100">{node.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{node.description}</p>
                </div>

                <div className="glass-card p-3">
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Importance (Planet Size)</label>
                    <input
                        type="range"
                        min="50"
                        max="200"
                        value={node.size}
                        onChange={(e) => onSizeChange(node.id, parseInt(e.target.value, 10))}
                        className="w-full"
                    />
                </div>

                <div className="glass-card p-3">
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Value</label>
                    {node.nodeType === 'text' || node.nodeType === 'input' ? (
                        <textarea
                            value={node.value || ''}
                            onChange={(e) => onValueChange(node.id, e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={4}
                        />
                    ) : node.nodeType === 'option' && node.options ? (
                        <select
                            value={node.value || ''}
                            onChange={(e) => onValueChange(node.id, e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">-- Select --</option>
                            {node.options.map((opt: {value: string; label: string}) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                            <div className="text-sm text-gray-500 p-2 glass-card">This node's value is determined by its inputs or settings.</div>
                    )}
                </div>
                    <button
                    onClick={() => onNodeDelete(node.id)}
                    className="w-full text-center bg-rose-800/50 text-rose-300 hover:bg-rose-700/50 font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Delete Planet
                </button>
            </div>
        );
    }

    return null;
};

const WeightsPanel = ({
    isWeightingEnabled, onWeightingToggle, styleRigidity, onStyleRigidityChange, tagWeights, onTagWeightChange
}: {
    isWeightingEnabled?: boolean;
    onWeightingToggle?: (enabled: boolean) => void;
    styleRigidity?: number;
    onStyleRigidityChange?: (value: number) => void;
    tagWeights?: Record<string, number>;
    onTagWeightChange?: (tagId: string, weight: number) => void;
}) => {
    return (
        <div className="p-2">
            <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                    <label htmlFor="qb-enable-weighting" className="font-bold text-gray-100">Enable Tag Weighting</label>
                    <button
                        role="switch"
                        aria-checked={isWeightingEnabled}
                        onClick={() => onWeightingToggle?.(!isWeightingEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isWeightingEnabled ? 'bg-indigo-500' : 'bg-gray-600'}`}
                        id="qb-enable-weighting"
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isWeightingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            <div className={`transition-opacity duration-300 ${isWeightingEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                    <label htmlFor="qb-style-rigidity" className="block font-bold text-gray-100 mb-2">Style Rigidity</label>
                    <input id="qb-style-rigidity" type="range" min="0" max="100" value={styleRigidity || 50} onChange={(e) => onStyleRigidityChange?.(parseInt(e.target.value, 10))} className="w-full" disabled={!isWeightingEnabled} />
                     <div className="text-xs text-gray-400 flex justify-between">
                        <span>More AI Freedom</span>
                        <span>Strict Adherence</span>
                    </div>
                </div>

                {Object.entries(TAG_GROUPS).map(([groupName, tagIds]) => (
                    <details key={groupName} className="bg-gray-700/50 rounded-lg mb-2" open>
                        <summary className="font-bold text-gray-100 p-3 cursor-pointer">{groupName}</summary>
                        <div className="p-3 border-t border-gray-600 space-y-3">
                            {tagIds.map((tagId: string) => {
                                const tag = NODE_TEMPLATES[tagId];
                                if (!tag) return null;
                                return (
                                    <div key={tagId}>
                                        <label className="block text-sm text-gray-300 mb-1 line-clamp-1" title={tag.name}>{tag.name}</label>
                                        <input type="range" min="0" max="200" value={Math.round((tagWeights?.[tagId] ?? 1.0) * 100)} onChange={(e) => onTagWeightChange?.(tagId, parseInt(e.target.value, 10) / 100)} className="w-full" disabled={!isWeightingEnabled} />
                                    </div>
                                )
                            })}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
};


// --- Main QuantumBox Component ---

interface QuantumBoxProps {
    onGoHome: () => void;
    tagWeights: Record<string, number>;
    styleRigidity: number;
    isWeightingEnabled: boolean;
    onTagWeightChange: (tagId: string, weight: number) => void;
    onStyleRigidityChange: (value: number) => void;
    onWeightingToggle: (enabled: boolean) => void;
}


const QuantumBox = (props: QuantumBoxProps) => {
    const { onGoHome, tagWeights, styleRigidity, isWeightingEnabled } = props;
    const [graph, setGraph] = useState<NodeGraph>({ nodes: [], connections: [] });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [previewTemplate, setPreviewTemplate] = useState<NodeTemplate | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedOutput, setGeneratedOutput] = useState<string>('');
    const [outputFormat, setOutputFormat] = useState<'text' | 'batch-image'>('text');
    const [harmonyLevel, setHarmonyLevel] = useState<number>(50);
    const [activeTab, setActiveTab] = useState('inspector');
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [isSunOptionsVisible, setIsSunOptionsVisible] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const interaction = useRef<{ type: 'move' | 'resize' | 'connect', nodeId: string; offsetX: number; offsetY: number, startX: number, startY: number, originalSize?: number } | null>(null);
    const [drawingConnection, setDrawingConnection] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

const updateNodeValue = useCallback((nodeId: string, value: string) => {
     setGraph((g: NodeGraph) => ({ ...g, nodes: g.nodes.map((n: Node) => n.id === nodeId ? { ...n, value } : n) }));
}, []);

const updateNodeSize = useCallback((nodeId: string, size: number) => {
    setGraph((g: NodeGraph) => ({ ...g, nodes: g.nodes.map((n: Node) => n.id === nodeId ? { ...n, size } : n) }));
}, []);

const deleteNode = useCallback((nodeId: string) => {
    setGraph((g: NodeGraph) => ({
        nodes: g.nodes.filter((n: Node) => n.id !== nodeId),
        connections: g.connections.filter((c: Connection) => c.from !== nodeId && c.to !== nodeId)
    }));
    if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
    }
}, [selectedNodeId]);

    const handleNodeMouseDown = (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
        e.stopPropagation();
        setSelectedNodeId(nodeId);
        setPreviewTemplate(null);
        setActiveTab('inspector');
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node || !editorRef.current) return;
        const editorBounds = editorRef.current.getBoundingClientRect();
        interaction.current = {
            type: 'move',
            nodeId,
            offsetX: e.clientX - editorBounds.left - node.position.x,
            offsetY: e.clientY - editorBounds.top - node.position.y,
            startX: e.clientX,
            startY: e.clientY
        };
    };
    
    const handleResizeStart = (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
        e.stopPropagation();
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return;
        interaction.current = {
            type: 'resize',
            nodeId: nodeId,
            offsetX: 0,
            offsetY: 0,
            startX: e.clientX,
            startY: e.clientY,
            originalSize: node.size,
        };
    };

    const handleConnectorMouseDown = (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
        e.stopPropagation();
        if (!editorRef.current) return;
        const editorBounds = editorRef.current.getBoundingClientRect();
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return;

        const startPos = { 
            x: node.position.x + node.size / 2, 
            y: node.position.y + node.size / 2 
        };
        interaction.current = { type: 'connect', nodeId, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
        setDrawingConnection({ from: startPos, to: { x: e.clientX - editorBounds.left, y: e.clientY - editorBounds.top } });
    };

    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
        if (!interaction.current || !editorRef.current) return;
        const editorBounds = editorRef.current.getBoundingClientRect();
        const mousePos = { x: e.clientX - editorBounds.left, y: e.clientY - editorBounds.top };
        
        switch (interaction.current.type) {
            case 'move':
                const { nodeId, offsetX, offsetY } = interaction.current;
                setGraph((g: NodeGraph) => ({...g, nodes: g.nodes.map((n: Node) => n.id === nodeId ? { ...n, position: { x: mousePos.x - offsetX, y: mousePos.y - offsetY } } : n)}));
                break;
            case 'resize':
                const { startX, originalSize = 50 } = interaction.current;
                const dx = e.clientX - startX;
                const newSize = Math.max(50, Math.min(200, originalSize + dx));
                updateNodeSize(interaction.current.nodeId, newSize);
                break;
            case 'connect':
                setDrawingConnection(prev => prev ? { ...prev, to: mousePos } : null);
                break;
        }
    }, [updateNodeSize]);

    const handleMouseUp = (e: globalThis.MouseEvent) => {
        if (interaction.current?.type === 'connect' && editorRef.current) {
            const editorBounds = editorRef.current.getBoundingClientRect();
            const upX = e.clientX - editorBounds.left;
            const upY = e.clientY - editorBounds.top;

            const toNode = graph.nodes.find((n: Node) => 
                upX >= n.position.x && upX <= n.position.x + n.size &&
                upY >= n.position.y && upY <= n.position.y + n.size
            );

            const fromNodeId = interaction.current.nodeId;
            if (toNode && toNode.id !== fromNodeId) {
                const toNodeId = toNode.id;
                const existing = graph.connections.find((c: Connection) => (c.from === fromNodeId && c.to === toNodeId) || (c.from === toNodeId && c.to === fromNodeId));
                if (!existing) {
                     setGraph((g: NodeGraph) => ({...g, connections: [...g.connections, { id: crypto.randomUUID(), from: fromNodeId, to: toNodeId, type: 'harmony' }] }));
                }
            }
        }
        interaction.current = null;
        setDrawingConnection(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const nodeType = e.dataTransfer.getData('nodeType');
        const template = NODE_TEMPLATES[nodeType];
        if (!template || !editorRef.current) return;

        const editorBounds = editorRef.current.getBoundingClientRect();
        const newNode: Node = {
            ...template,
            id: crypto.randomUUID(),
            position: {
                x: e.clientX - editorBounds.left - 40,
                y: e.clientY - editorBounds.top - 40,
            },
            size: 80,
            value: template.nodeType === 'option' ? template.options?.[0]?.value || '' : '',
        };
        setGraph(g => ({ ...g, nodes: [...g.nodes, newNode] }));
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, template: NodeTemplate) => {
        e.dataTransfer.setData('nodeType', template.type);
        e.dataTransfer.effectAllowed = 'copy';
    };
    
    const handleToggleConnectionType = (connId: string) => {
        setGraph((g: NodeGraph) => ({
            ...g,
            connections: g.connections.map((c: Connection) =>
                c.id === connId ? { ...c, type: c.type === 'harmony' ? 'tension' : 'harmony' } : c
            )
        }));
    };

    const handlePreviewNode = (template: NodeTemplate) => {
        setPreviewTemplate(template);
        setSelectedNodeId(null);
        setActiveTab('inspector');
    };

    const handleGenerate = async () => {
        if (!editorRef.current) return;
        setIsGenerating(true);
        setGeneratedOutput('');
        setIsPromptVisible(false);

        const outputNode = graph.nodes.find(n => n.type === 'promptOutput');
        if (!outputNode) {
            setGeneratedOutput("Error: Add an 'AI Prompt Output' node to your graph.");
            setIsGenerating(false);
            return;
        }
        
        const outputType = outputNode.value || 'image';
        setOutputFormat(outputType === 'batch' ? 'batch-image' : 'text');

        const editorBounds = editorRef.current.getBoundingClientRect();
        const centerX = editorBounds.width / 2;
        const centerY = editorBounds.height / 2;
        
        const nodeContext: { id: string; name: string; value: string; size: number; distance: number }[] = [];
        graph.nodes.forEach(node => {
            if (node.value && node.type !== 'promptOutput') {
                 const distance = Math.sqrt(Math.pow(node.position.x + node.size/2 - centerX, 2) + Math.pow(node.position.y + node.size/2 - centerY, 2));
                 nodeContext.push({
                    id: node.id,
                    name: node.name,
                    value: node.value,
                    size: node.size,
                    distance: distance,
                 });
            }
        });
        
        if (nodeContext.length === 0 && outputType !== 'batch') {
            setGeneratedOutput("Error: Add some planets with values to generate a prompt.");
            setIsGenerating(false);
            return;
        }
        
        const result = await generateFromQuantumBox(nodeContext, harmonyLevel, tagWeights, styleRigidity, outputType);
        setGeneratedOutput(result);
        setIsGenerating(false);
    };
    
    const handleSunClick = () => {
        if (generatedOutput && !isGenerating) {
            setIsSunOptionsVisible(true);
        }
    };
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedOutput);
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const getNodeConnectorPos = (nodeId: string): { x: number; y: number } => {
        const node = graph.nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        return { x: node.position.x + node.size / 2, y: node.position.y + node.size / 2 };
    };
    
    const renderOutput = () => {
        if (outputFormat === 'batch-image') {
            try {
                const data = JSON.parse(generatedOutput);
                if (Array.isArray(data)) {
                    return data.map((item, index) => (
                        `<div class="prose prose-invert max-w-none mb-4">
                            <h3 class="!mb-2">Image Prompt #${index + 1}</h3>
                            <pre class="bg-gray-900/50 p-4 rounded-lg text-indigo-300 whitespace-pre-wrap break-words font-mono text-sm"><code>${item.prompt}</code></pre>
                            <h3 class="!mt-6 !mb-2">Director's Commentary</h3>
                            <p class="!mt-0">${item.explanation}</p>
                         </div>`
                    )).join('<hr class="my-6 border-gray-600" />');
                }
            } catch (e) { /* fall through to text */ }
        }
        // Default to text
        return `<textarea readonly class="w-full h-full bg-transparent p-0 text-indigo-200 font-mono text-sm custom-scrollbar resize-none border-none">${generatedOutput}</textarea>`;
    };

    return (
        <div className="h-screen flex flex-col">
            <header className="p-2 border-b border-gray-700 flex justify-between items-center flex-shrink-0 z-10 bg-gray-900">
                <div className="flex items-center gap-4">
                    <button onClick={onGoHome} className="flex items-center gap-2 text-gray-300 font-medium py-2 px-3 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200" title="Go back to home">
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                        <span>Home</span>
                    </button>
                    <div className="w-px h-6 bg-gray-700"></div>
                     <h1 className="text-xl font-bold text-gray-100">Quantum Box</h1>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowHelp(true)} className="flex items-center gap-2 text-gray-300 font-medium py-2 px-3 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200" title="Help">
                        <QuestionMarkCircleIcon className="w-5 h-5" />
                        <span>Help</span>
                    </button>
                    <button onClick={handleGenerate} disabled={isGenerating || graph.nodes.length === 0} className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed" title="Generate output from nodes">
                        <SparklesIcon className="w-5 h-5" />
                        <span>Generate</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 relative">
                {/* Library Panel - Hidden on mobile */}
                <div className="hidden md:block">
                    <NodeLibraryPanel onDragStart={handleDragStart} onPreview={handlePreviewNode} />
                </div>

                <div
                    className="fixed md:left-64 left-0 right-0 md:right-80 top-14 bottom-0 gradient-bg gradient-overlay overflow-hidden"
                    ref={editorRef}
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => {
                        setSelectedNodeId(null);
                        setPreviewTemplate(null);
                    }}
                >
                    <button
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-yellow-300 rounded-full shadow-[0_0_50px_10px_rgba(253,249,156,0.5)] transition-transform hover:scale-110 disabled:cursor-not-allowed"
                        onClick={(e) => { e.stopPropagation(); handleSunClick(); }}
                        disabled={!generatedOutput || isGenerating}
                        aria-label="Show generated prompt"
                        title="Sun: Click to view generated output. Connect nodes here for results."
                    />

                    <svg className="absolute w-full h-full pointer-events-none">
                         {[150, 300, 450].map(r => <circle key={r} cx="50%" cy="50%" r={r} stroke="#374151" strokeWidth="1" fill="none" />)}
                        {graph.connections.map((conn) => (
                            <ConnectionComponent
                                key={conn.id}
                                id={conn.id}
                                fromPos={getNodeConnectorPos(conn.from)}
                                toPos={getNodeConnectorPos(conn.to)}
                                type={conn.type}
                                onToggle={handleToggleConnectionType}
                            />
                        ))}
                         {drawingConnection && <path d={`M ${drawingConnection.from.x} ${drawingConnection.from.y} L ${drawingConnection.to.x} ${drawingConnection.to.y}`} stroke="#fuchsia" strokeWidth="2" strokeDasharray="5,5" />}
                    </svg>
                    {graph.nodes.map(node => (
                        <div key={node.id}>
                            <PlanetComponent
                                node={node}
                                onMouseDown={handleNodeMouseDown}
                                onConnectorMouseDown={handleConnectorMouseDown}
                                onResizeStart={(e) => handleResizeStart(e, node.id)}
                                isSelected={selectedNodeId === node.id}
                                weight={tagWeights[node.type] ?? 1.0}
                                isWeightingEnabled={isWeightingEnabled}
                            />
                        </div>
                    ))}
                </div>

                {/* Inspector Panel - Hidden on mobile */}
                <aside className="hidden md:flex bg-gray-800/50 w-80 flex-col fixed top-14 bottom-0 right-0 z-30">
                    <div className="flex-shrink-0 border-b border-gray-700">
                        <nav className="flex -mb-px">
                            <button onClick={() => setActiveTab('inspector')} className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'inspector' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                                Inspector
                            </button>
                            <button onClick={() => setActiveTab('weights')} className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'weights' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                                Tag Weights
                            </button>
                        </nav>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeTab === 'inspector' && (
                            <InspectorPanel
                                node={graph.nodes.find(n => n.id === selectedNodeId) || null}
                                previewTemplate={previewTemplate}
                                onValueChange={updateNodeValue}
                                onNodeDelete={deleteNode}
                                onSizeChange={updateNodeSize}
                            />
                        )}
                        {activeTab === 'weights' && <WeightsPanel {...props} />}
                    </div>
                </aside>
            </main>

            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 flex items-center gap-4 border border-gray-700">
                <span className="font-bold text-rose-400">Tension</span>
                <input type="range" min="0" max="100" value={harmonyLevel} onChange={(e) => setHarmonyLevel(parseInt(e.target.value, 10))} className="w-32 md:w-64" />
                <span className="font-bold text-blue-400">Harmony</span>
            </div>

            {isPromptVisible && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-40"
                    onClick={() => setIsPromptVisible(false)}
                >
                    <div
                        className="bg-gray-800 border border-indigo-500 rounded-xl p-6 w-full max-w-2xl shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="font-bold text-xl text-gray-100 mb-4 flex-shrink-0">Generated Output</h3>
                        <div
                            className="flex-grow h-96 overflow-y-auto custom-scrollbar bg-gray-900/50 p-4 rounded-lg"
                            dangerouslySetInnerHTML={{ __html: renderOutput() }}
                        />
                        <div className="flex justify-end gap-4 mt-4 flex-shrink-0">
                             <button
                                onClick={copyToClipboard}
                                className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-500 transition-colors"
                            >
                                Copy
                            </button>
                            <button
                                onClick={() => setIsPromptVisible(false)}
                                className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSunOptionsVisible && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center z-40"
                    onClick={() => setIsSunOptionsVisible(false)}
                >
                    <div
                        className="glass-card p-6 w-full max-w-md shadow-2xl flex flex-col slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="font-bold text-xl text-gray-100 mb-4 flex-shrink-0 text-gradient-accent">Sun Options</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => { setIsPromptVisible(true); setIsSunOptionsVisible(false); }}
                                className="btn-primary w-full text-center font-bold py-3 px-4 rounded-lg"
                            >
                                View Generated Output
                            </button>
                            <button
                                onClick={() => setIsSunOptionsVisible(false)}
                                className="btn-secondary w-full text-center font-bold py-3 px-4 rounded-lg"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Help Modal */}
            {showHelp && (
                <div
                    className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
                    onClick={() => setShowHelp(false)}
                >
                    <div
                        className="glass-card rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl md:text-3xl font-bold text-gradient">How the Node System Works</h2>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="text-gray-300 space-y-4 leading-relaxed">
                            <p>
                                The Quantum Box uses a powerful node-based system for visual concept mapping and AI prompt generation. Here's how it works:
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">1. Creating Nodes</h3>
                                    <p>Nodes represent different concepts, parameters, or ideas. Drag from the Tag Library on the left to create input nodes (like character traits, settings, or styles) and connect them to build complex relationships.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">2. Node Types</h3>
                                    <ul className="list-disc list-inside ml-4 space-y-1">
                                        <li><strong>Text Nodes:</strong> Free-form input for concepts, descriptions, or ideas</li>
                                        <li><strong>Option Nodes:</strong> Predefined choices for specific parameters like shot types or lighting styles</li>
                                        <li><strong>Output Nodes:</strong> The final destination where you generate AI prompts</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">3. Weighting System</h3>
                                    <p>Each node can be resized to adjust its importance (planet size). Use the Tag Weights panel on the right to fine-tune how strongly each tag category affects the final output.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">4. Connections</h3>
                                    <p>Click and drag from the colored connectors on nodes to create harmony (solid blue lines) or tension (dashed red lines) relationships. Toggle connection types by clicking the H/T markers.</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">5. Generating Output</h3>
                                    <p>Connect your nodes to an AI Prompt Output node, adjust the Harmony/Tension slider at the bottom, then click Generate. The yellow Sun in the center reveals your AI-generated prompts when clicked.</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 mt-6">
                                Experiment with different connections, weights, and node arrangements to discover unique creative combinations! The AI analyzes the spatial relationships and weights to create coherent prompts.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuantumBox;

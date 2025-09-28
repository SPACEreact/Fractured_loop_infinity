

import React, { useState, useRef, useCallback, MouseEvent as ReactMouseEvent, useEffect } from 'react';
import type { Node, Connection, NodeGraph } from '../types';
import { NODE_TEMPLATES, NodeTemplate, TAG_GROUPS } from '../constants';
import { generateFromQuantumBox } from '../services/geminiService';
import { ArrowUturnLeftIcon, SparklesIcon, CubeTransparentIcon } from './IconComponents';
import LoadingSpinner from './LoadingSpinner';

// --- Helper Functions & Constants ---
const CATEGORY_COLORS: Record<string, string> = {
    'Core': 'bg-indigo-500',
    'Story': 'bg-emerald-500',
    'Shot': 'bg-amber-500',
    'Video': 'bg-sky-500',
    'Edit': 'bg-rose-500',
};

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
    const color = CATEGORY_COLORS[node.category] || 'bg-gray-500';
    const glowIntensity = isWeightingEnabled ? Math.max(0, (weight - 1.0) * 15) : 0;
    const glowColor = 'rgba(129, 140, 248, 0.7)'; // indigo-400

    return (
        <div
            className={`absolute rounded-full shadow-2xl flex items-center justify-center text-center transition-all duration-150 group`}
            style={{
                left: node.position.x,
                top: node.position.y,
                width: node.size,
                height: node.size,
                borderColor: isSelected ? '#818cf8' : '#4b5563',
                borderWidth: 2,
                backgroundImage: `radial-gradient(circle, ${color} 0%, #1f2937 85%)`,
                boxShadow: `0 0 ${glowIntensity}px 4px ${glowColor}`,
            }}
            onMouseDown={(e) => onMouseDown(e, node.id)}
            onClick={(e) => e.stopPropagation()} // FIX: Prevent click from bubbling to canvas and deselecting
        >
            {/* Input Connector */}
            <div
                className="absolute bg-cyan-400 w-4 h-4 rounded-full -left-2 top-1/2 -translate-y-1/2 cursor-crosshair hover:scale-125 transition-transform"
                onMouseDown={(e) => onConnectorMouseDown(e, node.id, 'in')}
                aria-label={`Input for ${node.name}`}
            />
            {/* Output Connector */}
            <div
                className="absolute bg-fuchsia-400 w-4 h-4 rounded-full -right-2 top-1/2 -translate-y-1/2 cursor-crosshair hover:scale-125 transition-transform"
                onMouseDown={(e) => onConnectorMouseDown(e, node.id, 'out')}
                aria-label={`Output for ${node.name}`}
            />

            <div className="font-bold text-gray-100 p-2 cursor-move select-none" style={{ fontSize: Math.max(8, node.size / 8) }}>
                {node.name}
            </div>

            {/* Resize Handle */}
            <div
                className="absolute -right-1 -bottom-1 w-5 h-5 bg-gray-600 rounded-full border-2 border-gray-900 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => onResizeStart(e, node.id)}
            />
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

    return (
        <g>
            <path d={path} stroke={strokeColor} strokeWidth="3" fill="none" className="pointer-events-none" />
            <g transform={`translate(${midX - 10}, ${midY - 10})`} className="cursor-pointer" onClick={() => onToggle(id)}>
                <rect width="20" height="20" rx="5" fill={strokeColor} />
                <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12">{type === 'harmony' ? 'H' : 'T'}</text>
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
        <aside className="bg-gray-800/50 w-64 p-4 flex flex-col fixed inset-y-0 left-0 overflow-y-auto custom-scrollbar z-30">
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
                                    className="bg-gray-700 p-3 rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-600 transition-colors"
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
                <div className="bg-gray-700/50 p-3 rounded-lg">
                    <h3 className="font-bold text-gray-100">{previewTemplate.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{previewTemplate.description}</p>
                </div>
                <div className="text-center text-xs text-gray-500 p-2 bg-gray-800 rounded-md">
                    Drag this item from the library onto the canvas to use it.
                </div>
            </div>
        )
    }

    if (node) {
        return (
            <div className="space-y-4 p-2">
                <div className="bg-gray-700/50 p-3 rounded-lg">
                    <h3 className="font-bold text-gray-100">{node.name}</h3>
                    <p className="text-sm text-gray-400 mt-1">{node.description}</p>
                </div>

                <div className="bg-gray-700/50 p-3 rounded-lg">
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
                
                <div className="bg-gray-700/50 p-3 rounded-lg">
                    <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">Value</label>
                    {node.nodeType === 'text' || node.nodeType === 'input' ? (
                        <textarea
                            value={node.value}
                            onChange={(e) => onValueChange(node.id, e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={4}
                        />
                    ) : node.nodeType === 'option' && node.options ? (
                        <select
                            value={node.value}
                            onChange={(e) => onValueChange(node.id, e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">-- Select --</option>
                            {node.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                            <div className="text-sm text-gray-500 p-2 bg-gray-800 rounded-md">This node's value is determined by its inputs or settings.</div>
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

const WeightsPanel: React.FC<{
    isWeightingEnabled?: boolean;
    onWeightingToggle?: (enabled: boolean) => void;
    styleRigidity?: number;
    onStyleRigidityChange?: (value: number) => void;
    tagWeights?: Record<string, number>;
    onTagWeightChange?: (tagId: string, weight: number) => void;
}> = ({
    isWeightingEnabled, onWeightingToggle, styleRigidity, onStyleRigidityChange, tagWeights, onTagWeightChange
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
                    <input id="qb-style-rigidity" type="range" min="0" max="100" value={styleRigidity} onChange={(e) => onStyleRigidityChange?.(parseInt(e.target.value, 10))} className="w-full" disabled={!isWeightingEnabled} />
                     <div className="text-xs text-gray-400 flex justify-between">
                        <span>More AI Freedom</span>
                        <span>Strict Adherence</span>
                    </div>
                </div>

                {Object.entries(TAG_GROUPS).map(([groupName, tagIds]) => (
                    <details key={groupName} className="bg-gray-700/50 rounded-lg mb-2" open>
                        <summary className="font-bold text-gray-100 p-3 cursor-pointer">{groupName}</summary>
                        <div className="p-3 border-t border-gray-600 space-y-3">
                            {tagIds.map(tagId => {
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


const QuantumBox: React.FC<QuantumBoxProps> = (props) => {
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

    const interaction = useRef<{ type: 'move' | 'resize' | 'connect', nodeId: string; offsetX: number; offsetY: number, startX: number, startY: number, originalSize?: number } | null>(null);
    const [drawingConnection, setDrawingConnection] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const updateNodeValue = useCallback((nodeId: string, value: string) => {
         setGraph(g => ({ ...g, nodes: g.nodes.map(n => n.id === nodeId ? { ...n, value } : n) }));
    }, []);

    const updateNodeSize = useCallback((nodeId: string, size: number) => {
        setGraph(g => ({ ...g, nodes: g.nodes.map(n => n.id === nodeId ? { ...n, size } : n) }));
    }, []);

    const deleteNode = useCallback((nodeId: string) => {
        setGraph(g => ({
            nodes: g.nodes.filter(n => n.id !== nodeId),
            connections: g.connections.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId)
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
                setGraph(g => ({...g, nodes: g.nodes.map(n => n.id === nodeId ? { ...n, position: { x: mousePos.x - offsetX, y: mousePos.y - offsetY } } : n)}));
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

            const toNode = graph.nodes.find(n => 
                upX >= n.position.x && upX <= n.position.x + n.size &&
                upY >= n.position.y && upY <= n.position.y + n.size
            );

            const fromNodeId = interaction.current.nodeId;
            if (toNode && toNode.id !== fromNodeId) {
                const toNodeId = toNode.id;
                const existing = graph.connections.find(c => (c.fromNodeId === fromNodeId && c.toNodeId === toNodeId) || (c.fromNodeId === toNodeId && c.toNodeId === fromNodeId));
                if (!existing) {
                     setGraph(g => ({...g, connections: [...g.connections, { id: crypto.randomUUID(), fromNodeId, toNodeId, type: 'harmony' }] }));
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
        setGraph(g => ({...g, connections: g.connections.map(c => c.id === connId ? {...c, type: c.type === 'harmony' ? 'tension' : 'harmony'} : c)}));
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
        
        const result = await generateFromQuantumBox(graph, nodeContext, harmonyLevel, tagWeights, styleRigidity, outputType);
        setGeneratedOutput(result);
        setIsGenerating(false);
    };
    
    const handleSunClick = () => {
        if (generatedOutput && !isGenerating) {
            setIsPromptVisible(true);
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
                    <button onClick={onGoHome} className="flex items-center gap-2 text-gray-300 font-medium py-2 px-3 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200">
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                        <span>Home</span>
                    </button>
                    <div className="w-px h-6 bg-gray-700"></div>
                     <h1 className="text-xl font-bold text-gray-100">Quantum Box</h1>
                </div>
                <button onClick={handleGenerate} disabled={isGenerating || graph.nodes.length === 0} className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    <SparklesIcon className="w-5 h-5" />
                    <span>Generate</span>
                </button>
            </header>

            <main className="flex-1 relative">
                <NodeLibraryPanel onDragStart={handleDragStart} onPreview={handlePreviewNode} />
                
                <div 
                    className="fixed left-64 right-80 top-14 bottom-0 bg-gray-900 overflow-hidden"
                    style={{backgroundImage: 'radial-gradient(circle at center, #1f2937 0%, #111827 60%)'}}
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
                    />

                    <svg className="absolute w-full h-full pointer-events-none">
                         {[150, 300, 450].map(r => <circle key={r} cx="50%" cy="50%" r={r} stroke="#374151" strokeWidth="1" fill="none" />)}
                        {graph.connections.map((conn) => (
                            <ConnectionComponent 
                                key={conn.id}
                                id={conn.id}
                                fromPos={getNodeConnectorPos(conn.fromNodeId)}
                                toPos={getNodeConnectorPos(conn.toNodeId)}
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
                
                <aside className="bg-gray-800/50 w-80 flex flex-col fixed inset-y-0 right-0 z-30">
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
                <input type="range" min="0" max="100" value={harmonyLevel} onChange={(e) => setHarmonyLevel(parseInt(e.target.value, 10))} className="w-64" />
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
        </div>
    );
};

export default QuantumBox;

import React, { useState, useRef, useCallback, MouseEvent as ReactMouseEvent, useEffect } from 'react';
import { ChatRole } from '../types'; 
import type { Project, Asset, CanvasNode, CanvasConnection, Message } from '../types';
import { ASSET_TEMPLATES, FIELD_OPTIONS } from '../constants';
import { generateFromWorkspace, generateSandboxResponse } from '../services/geminiService';
import { FolderIcon, SparklesIcon, CubeTransparentIcon, ChatBubbleLeftRightIcon, Cog6ToothIcon } from './IconComponents';
import ChatAssistant from './ChatAssistant.tsx';

interface WorkspaceProps {
  project: Project;
  setProject: React.Dispatch<React.SetStateAction<Project>>;
  tagWeights: Record<string, number>;
  styleRigidity: number;
  isWeightingEnabled: boolean;
  onTagWeightChange: (tagId: string, weight: number) => void;
  onStyleRigidityChange: (value: number) => void;
  onWeightingToggle: (enabled: boolean) => void;
}

// Sub-components
const AssetLibraryPanel = ({ onCreateAsset }: { onCreateAsset: (templateType: string) => void }) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    primary: true,
    secondary: true,
    tertiary: false
  });

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const groupedTemplates = Object.values(ASSET_TEMPLATES).reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, typeof ASSET_TEMPLATES[keyof typeof ASSET_TEMPLATES][]>);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, templateType: string) => {
    e.dataTransfer.setData('text/plain', templateType);
  };

  return (
    <aside className="glass-card w-64 p-4 flex flex-col fixed top-14 bottom-0 left-0 overflow-y-auto custom-scrollbar z-30">
      <div className="flex items-center gap-2 px-2 mb-4">
        <FolderIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-xl font-bold text-gray-100">Asset Library</h1>
      </div>
      <div className="space-y-4">
        {Object.keys(groupedTemplates).map(category => (
          <div key={category}>
            <button
              onClick={() => toggleCategory(category)}
              className="w-full text-left font-bold text-gray-100 mb-2 flex items-center gap-2"
            >
              <span className={`transform transition-transform ${expandedCategories[category] ? 'rotate-90' : ''}`}>▶</span>
              {category.charAt(0).toUpperCase() + category.slice(1)} Assets
            </button>
            {expandedCategories[category] && (
              <div className="space-y-2 ml-4">
                {groupedTemplates[category].map(template => (
                  <div
                    key={template.type}
                    className="glass-card p-3 cursor-pointer hover-lift transition-all"
                    onClick={() => onCreateAsset(template.type)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, template.type)}
                  >
                    <p className="font-bold text-sm text-gray-100">{template.name}</p>
                    <p className="text-xs text-gray-400 mt-1">{template.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

const CanvasNodeComponent = React.memo(({
  node,
  asset,
  onMouseDown,
  onConnectorMouseDown,
  isSelected,
  onResizeStart
}: {
  node: CanvasNode;
  asset: Asset;
  onMouseDown: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => void;
  onConnectorMouseDown: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string, type: 'in' | 'out') => void;
  isSelected: boolean;
  onResizeStart: (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => void;
}) => {
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
      }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={(e) => e.stopPropagation()}
      title={`${asset.name} (${asset.type})`}
    >
      {/* Input Connector */}
      <div
        className="absolute bg-cyan-400 w-4 h-4 rounded-full -left-2 top-1/2 -translate-y-1/2 cursor-crosshair hover:scale-125 transition-transform"
        onMouseDown={(e) => onConnectorMouseDown(e, node.id, 'in')}
        aria-label={`Input for ${asset.name}`}
        title="Input Connector"
      />
      {/* Output Connector */}
      <div
        className="absolute bg-fuchsia-400 w-4 h-4 rounded-full -right-2 top-1/2 -translate-y-1/2 cursor-crosshair hover:scale-125 transition-transform"
        onMouseDown={(e) => onConnectorMouseDown(e, node.id, 'out')}
        aria-label={`Output for ${asset.name}`}
        title="Output Connector"
      />

      <div className="font-bold text-gray-100 p-2 cursor-move select-none text-gradient-accent" style={{ fontSize: Math.max(8, node.size / 8) }}>
        {asset.name}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute -right-1 -bottom-1 w-5 h-5 bg-gray-600 rounded-full border-2 border-gray-900 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => onResizeStart(e, node.id)}
        title="Resize Node"
      />

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {asset.summary || asset.content.substring(0, 50) + '...'}
      </div>
    </div>
  );
});

const CanvasConnectionComponent = React.memo(({
  fromPos,
  toPos,
  type,
  id,
  onToggle,
  onSelect,
  isSelected
}: {
  fromPos: { x: number; y: number };
  toPos: { x: number; y: number };
  type: 'harmony' | 'tension';
  id: string;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}) => {
  const path = `M ${fromPos.x} ${fromPos.y} C ${fromPos.x + 80} ${fromPos.y}, ${toPos.x - 80} ${toPos.y}, ${toPos.x} ${toPos.y}`;
  const strokeColor = type === 'harmony' ? 'rgb(59 130 246)' : 'rgb(239 68 68)';
  const midX = (fromPos.x + toPos.x) / 2;
  const midY = (fromPos.y + toPos.y) / 2;
  const glowClass = type === 'harmony' ? 'glow-indigo' : 'glow-fuchsia';
  const dashArray = type === 'tension' ? '5,5' : 'none';

  return (
    <g onClick={() => onSelect(id)}>
      <path d={path} stroke={strokeColor} strokeWidth={isSelected ? "5" : "3"} fill="none" className={`pointer-events-none ${glowClass}`} strokeDasharray={dashArray} />
      <g transform={`translate(${midX - 10}, ${midY - 10})`} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onToggle(id); }}>
        <rect width="20" height="20" rx="5" fill={strokeColor} stroke={isSelected ? "#fff" : "none"} strokeWidth={isSelected ? "2" : "0"} />
        <text x="10" y="14" textAnchor="middle" fill="white" fontSize="12">{type === 'harmony' ? 'H' : 'T'}</text>
      </g>
      <g transform={`translate(${midX - 20}, ${midY - 30})`} className="opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
        <rect width="40" height="20" rx="5" fill="rgba(0,0,0,0.8)" />
        <text x="20" y="14" textAnchor="middle" fill="white" fontSize="10">{type === 'harmony' ? 'Harmony' : 'Tension'}</text>
      </g>
    </g>
  );
});

const NodeDetailsPanel = ({
  selectedNodeId,
  project,
  onUpdateAsset,
  onDeleteNode,
  onClose
}: {
  selectedNodeId: string | null;
  project: Project;
  onUpdateAsset: (assetId: string, updates: Partial<Asset>) => void;
  onDeleteNode: (nodeId: string) => void;
  onClose: () => void;
}) => {
  if (!selectedNodeId) return null;

  const node = project.canvas.nodes.find(n => n.id === selectedNodeId);
  const asset = node ? project.assets.find(a => a.id === node.assetId) : null;

  if (!node || !asset) return null;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the node "${asset.name}"? This action cannot be undone.`)) {
      onDeleteNode(selectedNodeId);
      onClose();
    }
  };

  // Parse content into fields and values
  const parseContent = (content: string) => {
    const lines = content.split('\n');
    const fields: Record<string, string> = {};

    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const fieldName = line.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
        const fieldValue = line.substring(colonIndex + 1).trim();
        fields[fieldName] = fieldValue;
      }
    });

    return fields;
  };

  // Update content when a field changes
  const updateField = (fieldName: string, value: string) => {
    const fields = parseContent(asset.content);
    fields[fieldName] = value;

    // Reconstruct content
    const newContent = Object.entries(fields)
      .map(([key, val]) => `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${val}`)
      .join('\n');

    onUpdateAsset(asset.id, { content: newContent });
  };

  const parsedFields = parseContent(asset.content);
  const fieldOptions = FIELD_OPTIONS[asset.type] || {};

  return (
    <aside className="glass-card w-80 p-4 flex flex-col fixed top-14 bottom-0 right-0 overflow-y-auto custom-scrollbar z-40">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <CubeTransparentIcon className="w-6 h-6 text-indigo-400" />
          <h1 className="text-lg font-bold text-gray-100">Node Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="text-red-400 hover:text-red-300 transition-colors text-lg"
            title="Delete Node"
          >
            🗑️
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-100 mb-2">Name</label>
          <input
            type="text"
            value={asset.name}
            onChange={(e) => onUpdateAsset(asset.id, { name: e.target.value })}
            className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-100 mb-2">Type</label>
          <div className="text-sm text-gray-300 bg-gray-700 px-3 py-2 rounded">
            {asset.type.replace('_', ' ').toUpperCase()}
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-100 mb-2">Fields</label>
          <div className="space-y-3">
            {Object.entries(parsedFields).map(([fieldKey, fieldValue]) => {
              const displayName = fieldKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              const options = fieldOptions[fieldKey];

              if (options && options.length > 0) {
                // Render dropdown for fields with predefined options
                return (
                  <div key={fieldKey}>
                    <label className="block font-medium text-gray-100 mb-1 text-sm">{displayName}</label>
                    <select
                      value={fieldValue}
                      onChange={(e) => updateField(fieldKey, e.target.value)}
                      className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select {displayName.toLowerCase()}...</option>
                      {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                );
              } else {
                // Render text input for free-form fields
                return (
                  <div key={fieldKey}>
                    <label className="block font-medium text-gray-100 mb-1 text-sm">{displayName}</label>
                    <input
                      type="text"
                      value={fieldValue}
                      onChange={(e) => updateField(fieldKey, e.target.value)}
                      className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`Enter ${displayName.toLowerCase()}...`}
                    />
                  </div>
                );
              }
            })}
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-100 mb-2">Raw Content</label>
          <textarea
            value={asset.content}
            onChange={(e) => onUpdateAsset(asset.id, { content: e.target.value })}
            className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-24 resize-y text-xs"
            placeholder="Raw content..."
          />
        </div>

        <div>
          <label className="block font-bold text-gray-100 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {asset.tags?.map((tag, index) => (
              <span
                key={index}
                className="bg-indigo-600 text-white px-2 py-1 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Created: {asset.createdAt.toLocaleDateString()}
        </div>
      </div>
    </aside>
  );
};

const ConnectionDetailsPanel = ({
  selectedConnectionId,
  selectedNodeId,
  project,
  onUpdateConnection,
  onClose
}: {
  selectedConnectionId: string | null;
  selectedNodeId: string | null;
  project: Project;
  onUpdateConnection: (connectionId: string, updates: Partial<CanvasConnection>) => void;
  onClose: () => void;
}) => {
  if (!selectedConnectionId) return null;

  const connection = project.canvas.connections.find(c => c.id === selectedConnectionId);
  if (!connection) return null;

  const fromNode = project.canvas.nodes.find(n => n.id === connection.from);
  const toNode = project.canvas.nodes.find(n => n.id === connection.to);
  const fromAsset = fromNode ? project.assets.find(a => a.id === fromNode.assetId) : null;
  const toAsset = toNode ? project.assets.find(a => a.id === toNode.assetId) : null;

  return (
    <aside className="glass-card w-80 p-4 flex flex-col fixed top-14 bottom-0 overflow-y-auto custom-scrollbar z-40" style={{ right: selectedNodeId ? '80px' : '0px' }}>
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-6 h-6 text-indigo-400" />
          <h1 className="text-lg font-bold text-gray-100">Connection Details</h1>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block font-bold text-gray-100 mb-2">From</label>
          <div className="text-sm text-gray-300 bg-gray-700 px-3 py-2 rounded">
            {fromAsset?.name || 'Unknown'}
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-100 mb-2">To</label>
          <div className="text-sm text-gray-300 bg-gray-700 px-3 py-2 rounded">
            {toAsset?.name || 'Unknown'}
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-100 mb-2">Type</label>
          <select
            value={connection.type}
            onChange={(e) => onUpdateConnection(connection.id, { type: e.target.value as 'harmony' | 'tension' })}
            className="w-full bg-gray-700 text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="harmony">Harmony</option>
            <option value="tension">Tension</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-gray-100 mb-2">Harmony Level: {connection.harmonyLevel}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={connection.harmonyLevel}
            onChange={(e) => onUpdateConnection(connection.id, { harmonyLevel: parseInt(e.target.value, 10) })}
            className="w-full"
          />
          <div className="text-xs text-gray-400 flex justify-between mt-1">
            <span>Conflict</span>
            <span>Harmony</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

const ControlPanel = ({
  isWeightingEnabled,
  onWeightingToggle,
  styleRigidity,
  onStyleRigidityChange,
  tagWeights,
  onTagWeightChange,
  onGenerate,
  panelCount,
  isGenerating
}: {
  isWeightingEnabled: boolean;
  onWeightingToggle: (enabled: boolean) => void;
  styleRigidity: number;
  onStyleRigidityChange: (value: number) => void;
  tagWeights: Record<string, number>;
  onTagWeightChange: (tagId: string, weight: number) => void;
  onGenerate: () => void;
  panelCount: number;
  isGenerating: boolean;
}) => {
  return (
    <aside className="glass-card w-80 p-4 flex flex-col fixed top-14 bottom-0 overflow-y-auto custom-scrollbar z-30 transition-all duration-300" style={{ right: `${panelCount * 80}px` }}>
      <div className="flex items-center gap-2 px-2 mb-4">
        <Cog6ToothIcon className="w-8 h-8 text-indigo-400" />
        <h1 className="text-xl font-bold text-gray-100">Controls</h1>
      </div>

      <div className="space-y-4">
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-colors ${
            isGenerating
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500'
          }`}
        >
          <SparklesIcon className="w-5 h-5 inline mr-2" />
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>

        <div className="bg-gray-700/50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <label htmlFor="weighting-enabled" className="font-bold text-gray-100">Enable Tag Weighting</label>
            <button
              role="switch"
              aria-checked={isWeightingEnabled}
              onClick={() => onWeightingToggle(!isWeightingEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isWeightingEnabled ? 'bg-indigo-500' : 'bg-gray-600'}`}
              id="weighting-enabled"
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isWeightingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className={`transition-opacity duration-300 ${isWeightingEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <label htmlFor="style-rigidity" className="block font-bold text-gray-100 mb-2">Style Rigidity</label>
            <input
              id="style-rigidity"
              type="range"
              min="0"
              max="100"
              value={styleRigidity}
              onChange={(e) => onStyleRigidityChange(parseInt(e.target.value, 10))}
              className="w-full"
              disabled={!isWeightingEnabled}
            />
            <div className="text-xs text-gray-400 flex justify-between mt-1">
              <span>Creative</span>
              <span>Strict</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

// @ts-ignore - tagWeights and onTagWeightChange are used in ControlPanel and generateFromWorkspace
const Workspace: React.FC<WorkspaceProps> = ({
  project,
  setProject,
  tagWeights: _tagWeights,
  styleRigidity,
  isWeightingEnabled,
  onTagWeightChange: _onTagWeightChange,
  onStyleRigidityChange,
  onWeightingToggle
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'canvas' | 'chat'>('canvas');
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [outputType] = useState<'text' | 'image'>('text');
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const panelCount = (selectedNodeId ? 1 : 0) + (selectedConnectionId ? 1 : 0);

  const canvasRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<{ type: 'move' | 'resize' | 'connect', nodeId: string; offsetX: number; offsetY: number, startX: number, startY: number, originalSize?: number } | null>(null);
  const [drawingConnection, setDrawingConnection] = useState<{ from: { x: number; y: number }; to: { x: number; y: number } } | null>(null);

  const createAsset = useCallback((templateType: string) => {
    const template = ASSET_TEMPLATES[templateType];
    if (!template) return;

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: template.type,
      name: template.name,
      content: template.defaultContent || '',
      tags: template.tags || [],
      createdAt: new Date(),
      summary: template.description
    };

    const newNode: CanvasNode = {
      id: crypto.randomUUID(),
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      size: 80,
      assetId: newAsset.id,
      name: newAsset.name,
      description: newAsset.summary
    };

    setProject(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset],
      canvas: {
        ...prev.canvas,
        nodes: [...prev.canvas.nodes, newNode]
      },
      updatedAt: new Date()
    }));
  }, [setProject]);

  const handleNodeMouseDown = (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setActivePanel('canvas');
    const node = project.canvas.nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    interaction.current = {
      type: 'move',
      nodeId,
      offsetX: e.clientX - canvasBounds.left - node.position.x,
      offsetY: e.clientY - canvasBounds.top - node.position.y,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  const handleResizeStart = (e: ReactMouseEvent<HTMLDivElement>, nodeId: string) => {
    e.stopPropagation();
    const node = project.canvas.nodes.find(n => n.id === nodeId);
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
    if (!canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const node = project.canvas.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const startPos = {
      x: node.position.x + node.size / 2,
      y: node.position.y + node.size / 2
    };
    interaction.current = { type: 'connect', nodeId, startX: 0, startY: 0, offsetX: 0, offsetY: 0 };
    setDrawingConnection({ from: startPos, to: { x: e.clientX - canvasBounds.left, y: e.clientY - canvasBounds.top } });
  };

  const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
    if (!interaction.current || !canvasRef.current) return;
    const canvasBounds = canvasRef.current.getBoundingClientRect();
    const mousePos = { x: e.clientX - canvasBounds.left, y: e.clientY - canvasBounds.top };

    switch (interaction.current.type) {
      case 'move':
        const { nodeId, offsetX, offsetY } = interaction.current;
        setProject(prev => ({
          ...prev,
          canvas: {
            ...prev.canvas,
            nodes: prev.canvas.nodes.map((n: CanvasNode) =>
              n.id === nodeId ? { ...n, position: { x: mousePos.x - offsetX, y: mousePos.y - offsetY } } : n
            )
          }
        }));
        break;
      case 'resize':
        const { startX, originalSize = 50 } = interaction.current;
        const dx = e.clientX - startX;
        const newSize = Math.max(50, Math.min(200, originalSize + dx));
        setProject(prev => ({
          ...prev,
          canvas: {
            ...prev.canvas,
            nodes: prev.canvas.nodes.map((n: CanvasNode) =>
              n.id === nodeId ? { ...n, size: newSize } : n
            )
          }
        }));
        break;
      case 'connect':
        setDrawingConnection(prev => prev ? { ...prev, to: mousePos } : null);
        break;
    }
  }, [setProject]);

  const handleMouseUp = (e: globalThis.MouseEvent) => {
    if (interaction.current?.type === 'connect' && canvasRef.current) {
      const canvasBounds = canvasRef.current.getBoundingClientRect();
      const upX = e.clientX - canvasBounds.left;
      const upY = e.clientY - canvasBounds.top;

      const toNode = project.canvas.nodes.find((n: CanvasNode) =>
        upX >= n.position.x && upX <= n.position.x + n.size &&
        upY >= n.position.y && upY <= n.position.y + n.size
      );

      const fromNodeId = interaction.current.nodeId;
      if (toNode && toNode.id !== fromNodeId) {
        const toNodeId = toNode.id;
        const existing = project.canvas.connections.find((c: CanvasConnection) =>
          (c.from === fromNodeId && c.to === toNodeId) || (c.from === toNodeId && c.to === fromNodeId)
        );
        if (!existing) {
          setProject(prev => ({
            ...prev,
            canvas: {
              ...prev.canvas,
              connections: [...prev.canvas.connections, {
                id: crypto.randomUUID(),
                from: fromNodeId,
                to: toNodeId,
                type: 'harmony',
                harmonyLevel: 50
              }]
            }
          }));
        }
      }
    }
    interaction.current = null;
    setDrawingConnection(null);
  };

  const handleToggleConnectionType = (connId: string) => {
    setProject(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        connections: prev.canvas.connections.map((c: CanvasConnection) =>
          c.id === connId ? { ...c, type: c.type === 'harmony' ? 'tension' : 'harmony' } : c
        )
      }
    }));
  };

  const handleGenerate = async () => {
    setGeneratedOutput('');
    setActivePanel('chat');
    setIsGenerating(true);

    try {
      const result = await generateFromWorkspace(project, _tagWeights, styleRigidity, outputType);
      setGeneratedOutput(result);
    } catch (error) {
      console.error('Generation error:', error);
      setGeneratedOutput('Failed to generate content. Please check your connection and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: ChatRole.USER,
      content: message
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      // Call Gemini service for chat response
      const response = await generateSandboxResponse(
        message,
        chatMessages.map(msg => ({ role: msg.role === ChatRole.USER ? 'user' : 'assistant', content: msg.content })),
        _tagWeights,
        styleRigidity
      );

      // Add AI response
      const aiMessage: Message = {
        role: ChatRole.MODEL,
        content: response
      };
      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: ChatRole.MODEL,
        content: 'Sorry, I encountered an error while processing your message.'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
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
    const node = project.canvas.nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.position.x + node.size / 2, y: node.position.y + node.size / 2 };
  };

  const handleUpdateAsset = useCallback((assetId: string, updates: Partial<Asset>) => {
    setProject(prev => ({
      ...prev,
      assets: prev.assets.map(asset =>
        asset.id === assetId ? { ...asset, ...updates } : asset
      ),
      updatedAt: new Date()
    }));
  }, [setProject]);

  const handleUpdateConnection = useCallback((connectionId: string, updates: Partial<CanvasConnection>) => {
    setProject(prev => ({
      ...prev,
      canvas: {
        ...prev.canvas,
        connections: prev.canvas.connections.map(conn =>
          conn.id === connectionId ? { ...conn, ...updates } : conn
        )
      },
      updatedAt: new Date()
    }));
  }, [setProject]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setProject(prev => {
      const node = prev.canvas.nodes.find(n => n.id === nodeId);
      if (!node) return prev;

      // Remove the node from canvas
      const updatedNodes = prev.canvas.nodes.filter(n => n.id !== nodeId);

      // Remove the associated asset
      const updatedAssets = prev.assets.filter(a => a.id !== node.assetId);

      // Remove any connections involving this node
      const updatedConnections = prev.canvas.connections.filter(
        conn => conn.from !== nodeId && conn.to !== nodeId
      );

      return {
        ...prev,
        assets: updatedAssets,
        canvas: {
          ...prev.canvas,
          nodes: updatedNodes,
          connections: updatedConnections
        },
        updatedAt: new Date()
      };
    });
  }, [setProject]);

  const handleCanvasDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const templateType = e.dataTransfer.getData('text/plain');
    if (!templateType) return;

    const canvasBounds = canvasRef.current?.getBoundingClientRect();
    if (!canvasBounds) return;

    const dropX = e.clientX - canvasBounds.left;
    const dropY = e.clientY - canvasBounds.top;

    const template = ASSET_TEMPLATES[templateType];
    if (!template) return;

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      type: template.type,
      name: template.name,
      content: template.defaultContent || '',
      tags: template.tags || [],
      createdAt: new Date(),
      summary: template.description
    };

    const newNode: CanvasNode = {
      id: crypto.randomUUID(),
      position: { x: dropX - 40, y: dropY - 40 }, // Center the node on the drop point
      size: 80,
      assetId: newAsset.id,
      name: newAsset.name,
      description: newAsset.summary
    };

    setProject(prev => ({
      ...prev,
      assets: [...prev.assets, newAsset],
      canvas: {
        ...prev.canvas,
        nodes: [...prev.canvas.nodes, newNode]
      },
      updatedAt: new Date()
    }));
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="p-2 border-b border-gray-700 flex justify-between items-center flex-shrink-0 z-10 bg-gray-900">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-100">{project.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePanel('canvas')}
            className={`flex items-center gap-2 font-medium py-2 px-3 rounded-lg transition-colors ${activePanel === 'canvas' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <CubeTransparentIcon className="w-5 h-5" />
            Canvas
          </button>
          <button
            onClick={() => setActivePanel('chat')}
            className={`flex items-center gap-2 font-medium py-2 px-3 rounded-lg transition-colors ${activePanel === 'chat' ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Chat
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        <AssetLibraryPanel onCreateAsset={createAsset} />

        <div
          className="fixed left-0 top-14 bottom-0 gradient-bg gradient-overlay overflow-hidden md:left-64"
          style={{ right: `${panelCount * 80}px` }}
          ref={canvasRef}
          onClick={() => {
            setSelectedNodeId(null);
            setSelectedConnectionId(null);
          }}
          onDrop={handleCanvasDrop}
          onDragOver={handleCanvasDragOver}
        >
          {activePanel === 'canvas' && (
            <>
              <svg className="absolute w-full h-full pointer-events-none">
                {project.canvas.connections.map((conn) => (
                  <CanvasConnectionComponent
                    key={conn.id}
                    id={conn.id}
                    fromPos={getNodeConnectorPos(conn.from)}
                    toPos={getNodeConnectorPos(conn.to)}
                    type={conn.type}
                    onToggle={handleToggleConnectionType}
                    onSelect={setSelectedConnectionId}
                    isSelected={selectedConnectionId === conn.id}
                  />
                ))}
                {drawingConnection && (
                  <path
                    d={`M ${drawingConnection.from.x} ${drawingConnection.from.y} L ${drawingConnection.to.x} ${drawingConnection.to.y}`}
                    stroke="#fuchsia"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                )}
              </svg>
              {project.canvas.nodes.map(node => {
                const asset = project.assets.find(a => a.id === node.assetId);
                if (!asset) return null;
                return (
                  <CanvasNodeComponent
                    key={node.id}
                    node={node}
                    asset={asset}
                    onMouseDown={handleNodeMouseDown}
                    onConnectorMouseDown={handleConnectorMouseDown}
                    onResizeStart={(e) => handleResizeStart(e, node.id)}
                    isSelected={selectedNodeId === node.id}
                  />
                );
              })}
            </>
          )}

          {activePanel === 'chat' && (
            <ChatAssistant
              messages={chatMessages}
              isLoading={isChatLoading}
              generatedOutput={generatedOutput}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>

        <ControlPanel
          isWeightingEnabled={isWeightingEnabled}
          onWeightingToggle={onWeightingToggle}
          styleRigidity={styleRigidity}
          onStyleRigidityChange={onStyleRigidityChange}
          tagWeights={_tagWeights}
          onTagWeightChange={_onTagWeightChange}
          onGenerate={handleGenerate}
          panelCount={(selectedNodeId ? 1 : 0) + (selectedConnectionId ? 1 : 0)}
          isGenerating={isGenerating}
        />

        <NodeDetailsPanel
          selectedNodeId={selectedNodeId}
          project={project}
          onUpdateAsset={handleUpdateAsset}
          onDeleteNode={handleDeleteNode}
          onClose={() => setSelectedNodeId(null)}
        />

        <ConnectionDetailsPanel
          selectedConnectionId={selectedConnectionId}
          selectedNodeId={selectedNodeId}
          project={project}
          onUpdateConnection={handleUpdateConnection}
          onClose={() => setSelectedConnectionId(null)}
        />
      </main>
    </div>
  );
};

export default Workspace;

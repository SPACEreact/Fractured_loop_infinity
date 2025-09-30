export interface Question {
  id: string;
  text: string;
  type: 'text' | 'option';
  options?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  builds?: BuildType[];
}

export interface BuildType {
  id: string;
  name: string;
  description: string;
}

export interface BuildContext {
  [key: string]: {
    seeds: Seed[];
  };
}

export interface Seed {
  id: string;
  content: string;
  tags: string[];
  createdAt: Date;
  sourceBuild: string;
  summary: string;
}

export enum ChatRole {
  USER = 'USER',
  MODEL = 'MODEL'
}

export interface Message {
  role: ChatRole;
  content: string;
}

// New Project Workspace types
export interface Asset {
  id: string;
  type: 'character' | 'plot_point' | 'shot_card' | 'master_style' | 'scene' | 'variant_shot' | 'camera_settings' | 'depth_of_field' | 'lighting_setup' | 'color_grading' | 'audio_design' | 'vfx_compositing' | 'video_output' | 'image_output' | 'storyboard_output';
  name: string;
  content: string;
  tags: string[];
  createdAt: Date;
  summary: string;
  metadata?: Record<string, any>;
}

export interface CanvasNode {
  id: string;
  position: { x: number; y: number };
  size: number;
  assetId: string; // Reference to the asset this node represents
  name: string;
  description: string;
}

export interface CanvasConnection {
  id: string;
  from: string;
  to: string;
  type: 'harmony' | 'tension';
  harmonyLevel: number;
}

export interface CanvasState {
  nodes: CanvasNode[];
  connections: CanvasConnection[];
}

export interface Project {
  id: string;
  name: string;
  assets: Asset[];
  canvas: CanvasState;
  createdAt: Date;
  updatedAt: Date;
}

// Legacy QuantumBox types (for backward compatibility during transition)
export interface Node {
  id: string;
  position: { x: number; y: number };
  size: number;
  category: string;
  type: string;
  name: string;
  description: string;
  nodeType: 'input' | 'option' | 'text' | 'output';
  value?: string;
  options?: { value: string; label: string; }[];
  content?: string;
  weight?: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  type: 'harmony' | 'tension';
  harmonyLevel: number;
}

export interface NodeGraph {
  nodes: Node[];
  connections: Connection[];
}

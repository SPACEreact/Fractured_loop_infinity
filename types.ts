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

// QuantumBox types
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
}

export interface NodeGraph {
  nodes: Node[];
  connections: Connection[];
}

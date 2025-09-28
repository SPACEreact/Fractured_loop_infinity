
import React from 'react';

// --- V2 Types (Classic Build System) ---

export enum ChatRole {
    USER = 'user',
    MODEL = 'model',
    MODEL_OUTPUT = 'model-output', // Special role for final, formatted output
}

export interface Message {
    role: ChatRole;
    content: string;
}

export type BuildType = 'story' | 'shot' | 'image' | 'video' | 'edit';

export interface Question {
    id: string; // Corresponds to a tag
    text: string;
    type: 'text' | 'option';
    options?: string[];
}

export interface Build {
    id: BuildType;
    name: string;
    description: string;
    icon: React.ReactNode;
    questions: Question[];
}

export interface Workflow {
    id: string;
    name: string;
    description: string;
    builds: BuildType[];
}

export interface Seed {
    id: string;
    sourceBuild: BuildType;
    summary: string;
    data: Record<string, string>;
}

export type BuildContext = Partial<Record<BuildType, {
    seeds: Seed[];
}>>;

// --- V3 Types (Quantum Box) ---

export type NodeType = 'story' | 'shot' | 'image' | 'video' | 'edit' | 'core';

export interface NodeOption {
    value: string;
    label: string;
}

export interface Node {
    id: string;
    type: string; // Corresponds to tag ID
    name: string;
    description: string;
    category: string;
    nodeType: 'input' | 'option' | 'text' | 'output';
    options?: NodeOption[];
    position: { x: number; y: number };
    value: string;
    size: number; // Represents weight
}

export interface Connection {
    id: string;
    fromNodeId: string;
    toNodeId: string;
    type: 'harmony' | 'tension';
}

export interface NodeGraph {
    nodes: Node[];
    connections: Connection[];
}

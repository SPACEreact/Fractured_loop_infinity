

import React, { useState, useCallback } from 'react';
import type { Project, Asset, CanvasNode, CanvasConnection } from './types';
import Workspace from './components/Workspace';

const App: React.FC = () => {
  // Sample assets for initial project state
  const sampleAssets: Asset[] = [
    {
      id: 'asset-1',
      type: 'character',
      name: 'Protagonist',
      content: 'Name: Alex Rivera\nAge: 28\nAppearance: Short dark hair, athletic build, determined eyes\nPersonality: Brave, resourceful, compassionate\nBackground: Former journalist turned activist\nGoals: Expose corporate corruption',
      tags: ['character', 'protagonist'],
      createdAt: new Date(),
      summary: 'The main character, a brave activist fighting corruption'
    },
    {
      id: 'asset-2',
      type: 'plot_point',
      name: 'Inciting Incident',
      content: 'Event: Alex discovers leaked documents revealing environmental crimes\nImpact: Forces Alex to go on the run\nTiming: Act 1, 15 minutes in\nCharacters involved: Alex, Corporate Executive',
      tags: ['plot', 'inciting'],
      createdAt: new Date(),
      summary: 'The event that kicks off the main conflict'
    },
    {
      id: 'asset-3',
      type: 'shot_card',
      name: 'Opening Shot',
      content: 'Shot type: Wide establishing\nSubject: City skyline at dawn\nAngle: Low angle looking up\nLighting: Golden hour\nMood: Hopeful, determined',
      tags: ['shot', 'visual', 'opening'],
      createdAt: new Date(),
      summary: 'The first shot establishing the story world'
    },
    {
      id: 'asset-4',
      type: 'master_style',
      name: 'Neo-Noir Thriller',
      content: 'Visual style: High contrast, shadows and light\nTone: Tense, suspenseful\nColor palette: Blues, grays, occasional red accents\nNarrative approach: Non-linear storytelling with flashbacks',
      tags: ['style', 'master', 'noir'],
      createdAt: new Date(),
      summary: 'The overall aesthetic and narrative style'
    }
  ];

  const sampleNodes: CanvasNode[] = [
    {
      id: 'node-1',
      position: { x: 100, y: 100 },
      size: 80,
      assetId: 'asset-1',
      name: 'Protagonist',
      description: 'The main character, a brave activist fighting corruption'
    },
    {
      id: 'node-2',
      position: { x: 300, y: 150 },
      size: 80,
      assetId: 'asset-2',
      name: 'Inciting Incident',
      description: 'The event that kicks off the main conflict'
    },
    {
      id: 'node-3',
      position: { x: 500, y: 200 },
      size: 80,
      assetId: 'asset-3',
      name: 'Opening Shot',
      description: 'The first shot establishing the story world'
    },
    {
      id: 'node-4',
      position: { x: 250, y: 350 },
      size: 80,
      assetId: 'asset-4',
      name: 'Neo-Noir Thriller',
      description: 'The overall aesthetic and narrative style'
    }
  ];

  const sampleConnections: CanvasConnection[] = [
    {
      id: 'conn-1',
      from: 'node-1',
      to: 'node-2',
      type: 'harmony',
      harmonyLevel: 70
    },
    {
      id: 'conn-2',
      from: 'node-2',
      to: 'node-3',
      type: 'tension',
      harmonyLevel: 30
    },
    {
      id: 'conn-3',
      from: 'node-4',
      to: 'node-1',
      type: 'harmony',
      harmonyLevel: 80
    }
  ];

  // Single unified project state
  const [project, setProject] = useState<Project>({
    id: 'project-1',
    name: 'My AI Filmmaker Project',
    assets: sampleAssets,
    canvas: {
      nodes: sampleNodes,
      connections: sampleConnections
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Global state for Tag Weighting System
  const [tagWeights, setTagWeights] = useState<Record<string, number>>({});
  const [styleRigidity, setStyleRigidity] = useState<number>(50);
  const [isWeightingEnabled, setIsWeightingEnabled] = useState<boolean>(false);

  const handleTagWeightChange = useCallback((tagId: string, newWeight: number) => {
    setTagWeights(prevWeights => {
      if (!isWeightingEnabled) {
        return { ...prevWeights, [tagId]: newWeight };
      }
      // Distribute weight changes within group
      // (Implementation can be added here if needed)
      return { ...prevWeights, [tagId]: newWeight };
    });
  }, [isWeightingEnabled]);

  // Handlers to update project state (add/remove assets, nodes, connections, etc.) can be added here

  return (
    <div className="min-h-screen font-sans gradient-bg text-gray-100 overflow-y-auto">
      <div className="gradient-overlay min-h-full">
        <Workspace
          project={project}
          setProject={setProject}
          tagWeights={tagWeights}
          styleRigidity={styleRigidity}
          isWeightingEnabled={isWeightingEnabled}
          onTagWeightChange={handleTagWeightChange}
          onStyleRigidityChange={setStyleRigidity}
          onWeightingToggle={setIsWeightingEnabled}
        />
      </div>
    </div>
  );
};

export default App;



import React, { useState, useCallback } from 'react';
import type { BuildType, Workflow, BuildContext, Seed } from './types';
import { BUILDS, WORKFLOWS, TAG_GROUPS, NODE_TEMPLATES } from './constants';
import LandingPage from './components/LandingPage';
import Workspace from './components/Workspace';
import BuildScreen from './components/BuildScreen';
import QuantumBox from './components/QuantumBox';

type AppMode = 'landing' | 'sandbox' | 'build' | 'quantum_box';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('landing');
  
  // State for classic build system
  const [sandboxContext] = useState<Record<string, string>>({});
  const [buildContext, setBuildContext] = useState<BuildContext>({});
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [activeBuildType, setActiveBuildType] = useState<BuildType>(BUILDS[0].id);

  // Global state for Tag Weighting System
  const [tagWeights, setTagWeights] = useState<Record<string, number>>(() => {
    const allTagTemplates = Object.values(NODE_TEMPLATES).filter(t => t.nodeType !== 'output');
    const initialWeights: Record<string, number> = {};
    allTagTemplates.forEach(template => {
        initialWeights[template.type] = 1.0;
    });
    return initialWeights;
  });
  const [styleRigidity, setStyleRigidity] = useState<number>(50);
  const [isWeightingEnabled, setIsWeightingEnabled] = useState<boolean>(false);

  const handleTagWeightChange = useCallback((tagId: string, newWeight: number) => {
    setTagWeights(prevWeights => {
        const group = Object.entries(TAG_GROUPS).find(([_, tagIds]) => tagIds.includes(tagId));
        
        if (!group || !isWeightingEnabled) {
            return { ...prevWeights, [tagId]: newWeight };
        }

        const [, tagIdsInGroup] = group;
        const otherTagsInGroup = tagIdsInGroup.filter(id => id !== tagId);
        
        if (otherTagsInGroup.length === 0) {
            return { ...prevWeights, [tagId]: newWeight };
        }

        const oldWeight = prevWeights[tagId];
        const delta = newWeight - oldWeight;
        const distribution = -delta / otherTagsInGroup.length;
        
        const newWeights = { ...prevWeights, [tagId]: newWeight };

        otherTagsInGroup.forEach(id => {
            const proposedWeight = (prevWeights[id] || 1.0) + distribution;
            newWeights[id] = Math.max(0, Math.min(2.0, proposedWeight)); // Clamp between 0 and 2
        });

        return newWeights;
    });
  }, [isWeightingEnabled]);


  const handleStartSandbox = () => {
    setAppMode('sandbox');
  };

  const handleStartWorkflow = (workflow: Workflow) => {
    setActiveWorkflow(workflow);
    setActiveBuildType(workflow.builds?.[0] || BUILDS[0]);
    setAppMode('build');
  };
  
  const handleStartQuantumBox = () => {
    setAppMode('quantum_box');
  };


  const handleGoBackToLanding = () => {
    setActiveWorkflow(null);
    setAppMode('landing');
  };
  
  const handleSelectBuild = (buildType: BuildType) => {
    setActiveBuildType(buildType);
  };
  
  const handleCompleteBuild = useCallback((buildType: BuildType, newSeeds: Seed[]) => {
    setBuildContext(prev => {
        const existingSeeds = prev[buildType.id]?.seeds || [];
        return {
            ...prev,
            [buildType.id]: {
                seeds: [...existingSeeds, ...newSeeds]
            }
        };
    });
  }, []);

  const commonWeightProps = {
    tagWeights,
    styleRigidity,
    isWeightingEnabled,
    onTagWeightChange: handleTagWeightChange,
    onStyleRigidityChange: setStyleRigidity,
    onWeightingToggle: setIsWeightingEnabled,
  };

  const renderContent = () => {
    switch (appMode) {
      case 'landing':
        return (
          <LandingPage
            workflows={WORKFLOWS}
            onStartSandbox={handleStartSandbox}
            onStartWorkflow={handleStartWorkflow}
            onStartQuantumBox={handleStartQuantumBox}
          />
        );
      case 'sandbox':
        return (
          <Workspace
            onGoHome={handleGoBackToLanding}
            {...commonWeightProps}
          />
        );
      case 'build':
        if (!activeWorkflow) {
            // Should not happen, but as a fallback
            handleGoBackToLanding();
            return null;
        }
        return (
            <BuildScreen 
                workflow={activeWorkflow}
                selectedBuild={activeBuildType}
                onSelectBuild={handleSelectBuild}
                onGoBackToLanding={handleGoBackToLanding}
                sandboxContext={sandboxContext}
                buildContext={buildContext}
                onCompleteBuild={handleCompleteBuild}
                {...commonWeightProps}
            />
        )
      case 'quantum_box':
        return (
          <QuantumBox
            onGoHome={handleGoBackToLanding}
            {...commonWeightProps}
          />
        );
      default:
        return (
          <LandingPage
            workflows={WORKFLOWS}
            onStartSandbox={handleStartSandbox}
            onStartWorkflow={handleStartWorkflow}
            onStartQuantumBox={handleStartQuantumBox}
          />
        );
    }
  };

  return (
    <div className="min-h-screen font-sans gradient-bg text-gray-100 overflow-y-auto">
        <div className="gradient-overlay min-h-full">
            {renderContent()}
        </div>
    </div>
  );
};

export default App;
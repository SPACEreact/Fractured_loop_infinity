

import React from 'react';
import type { Build, Seed } from '../types';
import { SparklesIcon } from './IconComponents';
import BatchSelection from './BatchSelection';

interface WelcomeScreenProps {
  activeBuild: Build;
  onStartBuild: () => void;
  hasSandboxContext: boolean;
  // New props for batch processing
  buildPhase: string;
  shotSeedsForBatch?: Seed[];
  onSetBatchShots?: (shots: Seed[]) => void;
  selectedShotsForMaster?: Seed[];
  onSetMasterShot?: (masterShot: Seed) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ 
    activeBuild, 
    onStartBuild, 
    hasSandboxContext, 
    buildPhase, 
    shotSeedsForBatch, 
    onSetBatchShots,
    selectedShotsForMaster,
    onSetMasterShot,
}) => {
  // If we are in an image build and in a batch selection phase, show the selection UI
  if (activeBuild.id === 'image' && (buildPhase === 'batch-select-shots' || buildPhase === 'batch-select-master')) {
    return (
        <BatchSelection 
            phase={buildPhase as 'batch-select-shots' | 'batch-select-master'}
            shotSeeds={shotSeedsForBatch!}
            selectedShotsForMaster={selectedShotsForMaster}
            onSelectShots={onSetBatchShots!}
            onSelectMaster={onSetMasterShot!}
        />
    );
  }

  // Otherwise, show the normal welcome screen
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="bg-gray-700/50 p-6 rounded-full mb-6 border border-gray-600">
        {/* FIX: Cast `activeBuild.icon` to a `React.ReactElement` that accepts a `className` prop. This resolves a TypeScript error where `React.cloneElement` could not infer the props of the icon element, which is typed as a generic `ReactNode`. */}
        <div className="w-16 h-16 text-indigo-400">{React.isValidElement(activeBuild.icon) ? React.cloneElement(activeBuild.icon as React.ReactElement<{ className?: string }>, { className: "w-16 h-16" }) : activeBuild.icon}</div>
      </div>
      <h2 className="text-4xl font-bold text-gray-100 mb-2">
        {activeBuild.name}
      </h2>
      <p className="text-gray-400 mb-8 max-w-md">
        {activeBuild.description}
      </p>

      {hasSandboxContext && (
        <div className="bg-indigo-900/50 border border-indigo-700 rounded-lg p-4 mb-8 max-w-md text-indigo-200 flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 flex-shrink-0" />
          <p>Your context from the Sandbox has been loaded! Start this build to apply it.</p>
        </div>
      )}

       <button
        onClick={onStartBuild}
        disabled={activeBuild.questions.length === 0}
        className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-500 transition-colors duration-200 text-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {activeBuild.questions.length > 0 ? 'Start Build' : 'Coming Soon'}
      </button>
    </div>
  );
};

export default WelcomeScreen;
import React from 'react';
import { BUILDS } from '../constants';
import type { BuildType, Workflow } from '../types';
import { FracturedLoopLogo, ArrowUturnLeftIcon, CheckCircleIcon } from './IconComponents';

interface SidebarProps {
  selectedBuild: BuildType;
  onSelectBuild: (build: BuildType) => void;
  onGoBackToLanding: () => void;
  workflow: Workflow | null;
  completedBuilds: Set<BuildType>;
}

const Sidebar: React.FC<SidebarProps> = ({ selectedBuild, onSelectBuild, onGoBackToLanding, workflow, completedBuilds }) => {
  return (
    <aside className="bg-gray-800/50 w-64 p-4 flex flex-col fixed inset-y-0 left-0">
      <div className="flex items-center gap-2 px-2 mb-4">
        <FracturedLoopLogo className="w-8 h-8 text-indigo-400" />
        <h1 className="text-xl font-bold text-gray-100">Fractured Loop</h1>
      </div>
      
      <button 
        onClick={onGoBackToLanding}
        className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors duration-200 text-gray-300 hover:bg-gray-700 hover:text-white"
        aria-label="Back to Home"
      >
        <ArrowUturnLeftIcon className="w-5 h-5" />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="border-t border-gray-700 my-4"></div>

      {workflow && (
        <div className="px-3 mb-3">
          <p className="text-xs uppercase text-gray-500 font-semibold">Workflow</p>
          <h2 className="text-lg font-bold text-indigo-300">{workflow.name}</h2>
        </div>
      )}

      <nav className="flex flex-col gap-2">
        {BUILDS.map((build) => {
          const isSelected = selectedBuild === build.id;
          const isCompleted = completedBuilds.has(build.id);
          const isInWorkflow = workflow ? workflow.builds.includes(build.id) : true;
          
          if (!isInWorkflow) {
            return null;
          }

          return (
            <button
              key={build.id}
              onClick={() => onSelectBuild(build.id)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors duration-200 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {isCompleted ? <CheckCircleIcon className="w-6 h-6 text-green-400" /> : build.icon}
              <span className={`font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>{build.name}</span>
            </button>
          )
        })}
      </nav>
      <div className="mt-auto text-center text-xs text-gray-500">
        <p>Powered by Gemini</p>
      </div>
    </aside>
  );
};

export default Sidebar;
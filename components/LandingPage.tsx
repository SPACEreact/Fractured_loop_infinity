
import React from 'react';
import type { Workflow } from 'types';
import { FracturedLoopLogo, ChatBubbleLeftRightIcon, ArrowRightOnRectangleIcon, CubeTransparentIcon } from './IconComponents';

interface LandingPageProps {
  workflows: Workflow[];
  onStartSandbox: () => void;
  onStartWorkflow: (workflow: Workflow) => void;
  onStartQuantumBox: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ workflows, onStartSandbox, onStartWorkflow, onStartQuantumBox }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-4 md:p-8 overflow-y-auto gradient-bg gradient-overlay">
      <header className="text-center mb-12 md:mb-16 fade-in">
        <FracturedLoopLogo className="w-20 h-20 md:w-28 md:h-28 text-indigo-400 mx-auto mb-4 md:mb-6 float pulse-glow" />
        <h1 className="text-4xl md:text-6xl font-bold text-gradient mb-4">AI Assistant Director</h1>
        <p className="text-lg md:text-2xl text-gradient-accent">Fractured Loop</p>
      </header>

      <main className="w-full max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">

          {/* Card 1: Sandbox Mode */}
          <div className="glass-card hover-lift rounded-2xl p-6 md:p-8 flex flex-col items-start transition-all duration-500 slide-up">
            <div className="icon-container p-3 md:p-4 rounded-2xl mb-4 md:mb-6">
              <ChatBubbleLeftRightIcon className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 glow-indigo" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-3 md:mb-4">Sandbox Mode</h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8 flex-grow">
              Free-form brainstorming with AI assistance.
            </p>
            <button
              onClick={onStartSandbox}
              className="btn-primary w-full text-center font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl text-base md:text-lg"
            >
              Start Sandbox
            </button>
          </div>

          {/* Card 2: Workflows */}
          <div className="glass-card hover-lift rounded-2xl p-6 md:p-8 flex flex-col items-start transition-all duration-500 slide-up">
            <div className="icon-container p-3 md:p-4 rounded-2xl mb-4 md:mb-6">
                <ArrowRightOnRectangleIcon className="w-8 h-8 md:w-10 md:h-10 text-fuchsia-400 glow-fuchsia" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-3 md:mb-4">Guided Workflows</h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-4 md:mb-6 flex-grow">
              Follow a step-by-step process for specific outcomes like character design or shot creation.
            </p>
            <div className="space-y-3 md:space-y-4 w-full">
              {workflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => onStartWorkflow(workflow)}
                  className="btn-secondary w-full text-left p-3 md:p-4 rounded-xl group hover-lift"
                >
                  <p className="font-bold text-white mb-1 group-hover:text-fuchsia-300 transition-colors text-sm md:text-base">{workflow.name}</p>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors text-xs md:text-sm">{workflow.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Quantum Box */}
          <div className="glass-card hover-lift rounded-2xl p-6 md:p-8 flex flex-col items-start transition-all duration-500 slide-up">
            <div className="icon-container p-3 md:p-4 rounded-2xl mb-4 md:mb-6">
                <CubeTransparentIcon className="w-8 h-8 md:w-10 md:h-10 text-amber-400 glow-amber" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gradient mb-3 md:mb-4">Quantum Box</h2>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-6 md:mb-8 flex-grow">
              Visual concept mapping with weighted relationships.
            </p>
             <button
              onClick={onStartQuantumBox}
              className="btn-primary w-full text-center font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl text-base md:text-lg"
            >
              Start Quantum Box
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LandingPage;

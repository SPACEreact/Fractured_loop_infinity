
import React from 'react';
import type { Workflow } from '../types';
import { FracturedLoopLogo, ChatBubbleLeftRightIcon, ArrowRightOnRectangleIcon, CubeTransparentIcon } from './IconComponents';

interface LandingPageProps {
  workflows: Workflow[];
  onStartSandbox: () => void;
  onStartWorkflow: (workflow: Workflow) => void;
  onStartQuantumBox: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ workflows, onStartSandbox, onStartWorkflow, onStartQuantumBox }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white p-8">
      <header className="text-center mb-16 fade-in">
        <FracturedLoopLogo className="w-28 h-28 text-indigo-400 mx-auto mb-6 float pulse-glow" />
        <h1 className="text-6xl font-bold text-gradient mb-4">Fractured Loop</h1>
        <p className="text-2xl text-gradient-accent">Your AI Assistant Director</p>
      </header>
      
      <main className="w-full max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Card 1: Sandbox Mode */}
          <div className="glass-card hover-lift rounded-2xl p-8 flex flex-col items-start transition-all duration-500 slide-up">
            <div className="icon-container p-4 rounded-2xl mb-6">
              <ChatBubbleLeftRightIcon className="w-10 h-10 text-indigo-400 glow-indigo" />
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-4">Sandbox Mode</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8 flex-grow">
              Brainstorm freely. Chat about your ideas and we'll help you capture the essential creative details.
            </p>
            <button
              onClick={onStartSandbox}
              className="btn-primary w-full text-center font-bold py-4 px-8 rounded-xl text-lg"
            >
              Start Chat
            </button>
          </div>
          
          {/* Card 2: Workflows */}
          <div className="glass-card hover-lift rounded-2xl p-8 flex flex-col items-start transition-all duration-500 slide-up">
            <div className="icon-container p-4 rounded-2xl mb-6">
                <ArrowRightOnRectangleIcon className="w-10 h-10 text-fuchsia-400 glow-fuchsia" />
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-4">Guided Workflows</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-6 flex-grow">
              Follow a step-by-step process for specific outcomes like character design or shot creation.
            </p>
            <div className="space-y-4 w-full">
              {workflows.map((workflow, index) => (
                <button
                  key={workflow.id}
                  onClick={() => onStartWorkflow(workflow)}
                  className="btn-secondary w-full text-left p-4 rounded-xl group hover-lift"
                >
                  <p className="font-bold text-white mb-1 group-hover:text-fuchsia-300 transition-colors">{workflow.name}</p>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{workflow.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Card 3: Quantum Box */}
          <div className="glass-card hover-lift rounded-2xl p-8 flex flex-col items-start transition-all duration-500 slide-up">
            <div className="icon-container p-4 rounded-2xl mb-6">
                <CubeTransparentIcon className="w-10 h-10 text-amber-400 glow-amber" />
            </div>
            <h2 className="text-3xl font-bold text-gradient mb-4">Quantum Box</h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8 flex-grow">
              Build a solar system of ideas. Visually connect concepts, define their weight, and orchestrate harmony or tension.
            </p>
             <button
              onClick={onStartQuantumBox}
              className="btn-primary w-full text-center font-bold py-4 px-8 rounded-xl text-lg"
            >
              Enter Workspace
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default LandingPage;

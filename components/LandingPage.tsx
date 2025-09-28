import React from 'react';
import type { Workflow } from 'types';
import { FracturedLoopLogo, ChatBubbleLeftRightIcon, ArrowRightOnRectangleIcon, CubeTransparentIcon } from './IconComponents';

interface LandingPageProps {
  onEnterQuantumBox: () => void;
  onEnterWorkspace: () => void;
}

const LandingPage = ({ onEnterQuantumBox, onEnterWorkspace }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 flex flex-col">
      <header className="p-6 flex justify-between items-center">
        <FracturedLoopLogo className="w-12 h-12" />
        <div className="flex items-center gap-4">
          <button
            onClick={onEnterWorkspace}
            className="flex items-center gap-2 text-gray-300 font-medium py-2 px-4 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200"
            title="Enter Workspace"
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            <span>Workspace</span>
          </button>
          <button
            onClick={onEnterQuantumBox}
            className="flex items-center gap-2 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 transition-colors duration-200"
            title="Enter Quantum Box"
          >
            <CubeTransparentIcon className="w-5 h-5" />
            <span>Quantum Box</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 text-gradient">
            Fractured Loop Infinity
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            A visual AI prompt generation tool that lets you build complex concepts through interconnected nodes.
            Create, connect, and generate stunning AI content with unprecedented control.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onEnterQuantumBox}
              className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <CubeTransparentIcon className="w-6 h-6" />
              <span>Enter Quantum Box</span>
              <ArrowRightOnRectangleIcon className="w-6 h-6" />
            </button>
            <button
              onClick={onEnterWorkspace}
              className="flex items-center gap-3 bg-gray-700/50 text-gray-300 font-medium py-4 px-8 rounded-xl hover:bg-gray-600/50 hover:text-white transition-all duration-200 transform hover:scale-105 border border-gray-600"
            >
              <ChatBubbleLeftRightIcon className="w-6 h-6" />
              <span>Explore Workspace</span>
            </button>
          </div>

          <div className="mt-12 grid md:grid-cols-3 gap-6 text-left">
            <div className="glass-card p-6 rounded-xl">
              <CubeTransparentIcon className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Visual Node System</h3>
              <p className="text-gray-300">
                Build complex concepts by connecting nodes. Each node represents a different aspect of your creative vision.
              </p>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">AI-Powered Generation</h3>
              <p className="text-gray-300">
                Leverage advanced AI to transform your node networks into detailed prompts for images, videos, and more.
              </p>
            </div>
            <div className="glass-card p-6 rounded-xl">
              <ArrowRightOnRectangleIcon className="w-8 h-8 text-pink-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Infinite Possibilities</h3>
              <p className="text-gray-300">
                Explore endless creative combinations. Weight nodes, adjust connections, and discover new creative horizons.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;

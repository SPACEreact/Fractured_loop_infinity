
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Message, Workflow } from '../types';
import type { Chat } from '@google/genai';
import { ChatRole } from '../types';
import { createSandboxChatSession, generateSuggestQuestion } from '../services/geminiService';
import ChatWindow from './ChatWindow';
import ContextPanel from './ContextPanel';
import { FracturedLoopLogo, ArrowRightOnRectangleIcon, ArrowUturnLeftIcon, QuestionMarkCircleIcon } from './IconComponents';

interface SandboxProps {
  context: Record<string, string>;
  onContextChange: (context: Record<string, string>) => void;
  onExit: (context: Record<string, string>) => void;
  onGoBackToLanding: () => void;
  activeWorkflow: Workflow | null;
  tagWeights: Record<string, number>;
  styleRigidity: number;
  isWeightingEnabled: boolean;
  onTagWeightChange: (tagId: string, weight: number) => void;
  onStyleRigidityChange: (value: number) => void;
  onWeightingToggle: (enabled: boolean) => void;
}

const Sandbox: React.FC<SandboxProps> = (props) => {
    const { context, onContextChange, onExit, onGoBackToLanding, activeWorkflow, tagWeights, styleRigidity, isWeightingEnabled } = props;
    const hasExistingContext = Object.keys(context).length > 0;
    const initialMessage = hasExistingContext
    ? "Welcome back to the Sandbox! Your previous context is loaded. Let's continue building your project."
    : "Welcome to the Sandbox! I'm here to help you brainstorm. Feel free to talk about your characters, story, or any visual ideas you have.";

  const [messages, setMessages] = useState<Message[]>([
      { role: ChatRole.MODEL, content: initialMessage }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    chatSessionRef.current = createSandboxChatSession(tagWeights, styleRigidity, isWeightingEnabled);
  }, [tagWeights, styleRigidity, isWeightingEnabled]);

  const handleSendMessage = useCallback(async (prompt: string) => {
    if (!chatSessionRef.current) return;
    
    setIsLoading(true);
    setMessages(prev => [...prev, { role: ChatRole.USER, content: prompt }]);

    try {
      let response = await chatSessionRef.current.sendMessage({ message: prompt });

      if (response.functionCalls && response.functionCalls.length > 0) {
        const newContext = { ...context };
        const toolFeedback = [];
        
        for (const call of response.functionCalls) {
            if (call.name === 'setTag') {
                const { tagName, value } = call.args;
                newContext[tagName] = value;
                toolFeedback.push({
                    toolResponse: {
                        name: 'setTag',
                        response: {
                           result: `Successfully set tag '${tagName}' to '${value}'.`
                        }
                    }
                });
            }
        }
        
        onContextChange(newContext);
        
        response = await chatSessionRef.current.sendMessage({ toolResponses: toolFeedback });
      }

      setMessages(prev => [...prev, { role: ChatRole.MODEL, content: response.text }]);
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      setMessages(prev => [...prev, { role: ChatRole.MODEL, content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  }, [context, onContextChange]);

  const handleSuggest = useCallback(async () => {
    setIsSuggesting(true);
    const question = await generateSuggestQuestion(context, activeWorkflow);
    setMessages(prev => [...prev, { role: ChatRole.MODEL, content: question }]);
    setIsSuggesting(false);
  }, [context, activeWorkflow]);

  return (
    <div className="h-screen flex">
      <aside className="bg-gray-800/50 w-64 p-4 flex flex-col fixed inset-y-0 left-0">
        <div className="flex items-center gap-2 px-2 mb-4">
          <FracturedLoopLogo className="w-8 h-8 text-indigo-400" />
          <h1 className="text-xl font-bold text-gray-100">Sandbox</h1>
        </div>
         <button 
            onClick={onGoBackToLanding}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors duration-200 text-gray-300 hover:bg-gray-700 hover:text-white"
        >
            <ArrowUturnLeftIcon className="w-5 h-5" />
            <span className="font-medium">Back to Home</span>
        </button>
        <div className="border-t border-gray-700 my-4"></div>
        <button
            onClick={() => onExit(context)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left transition-colors duration-200 text-green-300 hover:bg-green-800/50 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span className="font-medium">Save & Exit</span>
        </button>
         <p className="text-xs text-gray-500 px-3 mt-2">Exit to apply this context to the guided workflows.</p>

        <div className="mt-auto">
            <button
                onClick={handleSuggest}
                disabled={isSuggesting || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600/50 text-indigo-200 font-medium py-3 px-4 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                <QuestionMarkCircleIcon className="w-5 h-5" />
                <span>Suggest Question</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 pl-64 pr-80">
        <ChatWindow 
          messages={messages}
          isLoading={isLoading}
          isInputDisabled={isLoading}
          placeholder="Start brainstorming your project..."
          error={null}
          onSendMessage={handleSendMessage}
          activeBuildType="story" // Sandbox doesn't have a specific build type
        />
      </main>
      
      <ContextPanel 
        mode="sandbox"
        sandboxContext={context}
        {...props}
      />
    </div>
  );
};

export default Sandbox;

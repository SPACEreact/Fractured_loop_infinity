import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { ChatRole } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { SendIcon, SparklesIcon, UserIcon } from './IconComponents';

interface ChatAssistantProps {
  messages: Message[];
  isLoading: boolean;
  generatedOutput: string;
  onSendMessage: (message: string) => void;
}

// Helper to escape HTML to prevent XSS from user input being reflected in prompt
const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, '&amp;')
         .replace(/</g, '<')
         .replace(/>/g, '>')
         .replace(/"/g, '"')
         .replace(/'/g, '&#039;');
}

const formatGeneratedOutput = (content: string): string => {
    try {
        const data = JSON.parse(content);
        if (data.prompt && data.explanation) {
            return `
                <div class="prose prose-invert max-w-none">
                    <h3 class="!mb-2">Generated Content</h3>
                    <pre class="bg-gray-900/50 p-4 rounded-lg text-indigo-300 whitespace-pre-wrap break-words font-mono text-sm"><code>${escapeHtml(data.prompt)}</code></pre>
                    <h3 class="!mt-6 !mb-2">AI Commentary</h3>
                    <p class="!mt-0">${escapeHtml(data.explanation)}</p>
                </div>
            `.trim();
        }
    } catch (e) {
        // Not a JSON object, or not a format we recognize, so just display as plain text
        return `<p>${escapeHtml(content)}</p>`;
    }
    return `<p>${escapeHtml(content)}</p>`;
};

const ChatAssistant: React.FC<ChatAssistantProps> = ({ messages, isLoading, generatedOutput, onSendMessage }) => {
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, generatedOutput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSendMessage(prompt);
      setPrompt('');
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.role === ChatRole.MODEL) {
      const formattedContent = formatGeneratedOutput(message.content);
      return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
    }

    const contentWithBreaks = message.content.replace(/\n/g, '<br />');
    return <div dangerouslySetInnerHTML={{ __html: contentWithBreaks }} />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="flex flex-col gap-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex gap-4 items-start ${msg.role === ChatRole.USER ? 'justify-end' : ''}`}>
              {msg.role !== ChatRole.USER && (
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`max-w-xl p-4 rounded-xl ${
                msg.role === ChatRole.USER
                  ? 'bg-gray-700 text-gray-100'
                  : msg.role === ChatRole.MODEL
                  ? 'bg-transparent border border-indigo-500/50 w-full max-w-none'
                  : 'bg-gray-800 text-gray-200'
              }`}>
                {renderMessageContent(msg)}
              </div>

              {msg.role === ChatRole.USER && (
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {generatedOutput && (
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                <SparklesIcon className="w-5 h-5 text-white" />
              </div>
              <div className="max-w-none p-4 rounded-xl bg-transparent border border-indigo-500/50 w-full">
                <div dangerouslySetInnerHTML={{ __html: formatGeneratedOutput(generatedOutput) }} />
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0">
                  <SparklesIcon className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div className="max-w-xl p-4 rounded-xl bg-gray-800 text-gray-200">
                <LoadingSpinner />
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask the AI assistant..."
            disabled={isLoading}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 pl-4 pr-12 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-indigo-400 transition-colors duration-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;

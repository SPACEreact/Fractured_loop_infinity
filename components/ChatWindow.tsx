import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { ChatRole } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { SendIcon, SparklesIcon, UserIcon } from './IconComponents';

const ImagePromptBlock = ({ prompt, imageData }: { prompt: string; imageData: string }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-900/50 p-4 rounded-lg">
        <h4 className="text-indigo-300 font-semibold mb-2">Generated Image Prompt</h4>
        <p className="text-gray-200 text-sm">{prompt}</p>
      </div>
      <div className="bg-gray-900/50 p-4 rounded-lg">
        <img src={`data:image/png;base64,${imageData}`} alt="Generated image" className="max-w-full h-auto rounded-lg" />
      </div>
    </div>
  );
};

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  isInputDisabled: boolean;
  placeholder: string;
  error: string | null;
  onSendMessage: (message: string) => void;
  activeBuildType: string;
}

// Helper to escape HTML to prevent XSS from user input being reflected in prompt
const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

const formatSingleImageOutput = (data: any, index: number, total: number) => {
    if (data.prompt && data.explanation) {
        return `
            <div class="prose prose-invert max-w-none">
                <h3 class="!mb-2">Image Prompt ${total > 1 ? `#${index + 1}` : ''}</h3>
                <pre class="bg-gray-900/50 p-4 rounded-lg text-indigo-300 whitespace-pre-wrap break-words font-mono text-sm"><code>${escapeHtml(data.prompt)}</code></pre>
                <h3 class="!mt-6 !mb-2">Director's Commentary</h3>
                <p class="!mt-0">${escapeHtml(data.explanation)}</p>
            </div>
        `.trim();
    }
    return '';
};


// Helper to format the final build outputs for display
const formatBuildOutput = (content: string, buildType: string): string => {
    try {
        // Handle batch image output first
        if (buildType === 'image' && content.trim().startsWith('[')) {
            const batchData = JSON.parse(content);
            if (Array.isArray(batchData)) {
                return batchData.map((item, index) => formatSingleImageOutput(item, index, batchData.length)).join('<hr class="my-8 border-gray-700" />');
            }
        }

        const data = JSON.parse(content);
        if (buildType === 'story' && data.characterProfile && data.potentialArc) {
            return `
                <div class="prose prose-invert max-w-none">
                    <h3>${escapeHtml(data.characterProfile.name)} - Character Profile</h3>
                    <p>${escapeHtml(data.characterProfile.summary)}</p>
                    <h3>Potential Character Arc</h3>
                    <p>${escapeHtml(data.potentialArc)}</p>
                </div>
            `.trim();
        }
        if (buildType === 'shot' && data.shotCard) {
            const { title, camera, lighting, composition, look } = data.shotCard;
            return `
                <div class="prose prose-invert max-w-none">
                    <h3>Shot Card: ${escapeHtml(title)}</h3>
                    <ul class="list-none p-0">
                        <li><strong>Camera:</strong> ${escapeHtml(camera)}</li>
                        <li><strong>Lighting:</strong> ${escapeHtml(lighting)}</li>
                        <li><strong>Composition:</strong> ${escapeHtml(composition)}</li>
                        <li><strong>Look & Feel:</strong> ${escapeHtml(look)}</li>
                    </ul>
                </div>
            `.trim();
        }
        if (buildType === 'image') {
            return formatSingleImageOutput(data, 0, 1);
        }
        if (buildType === 'video' && data.videoSceneCard) {
            const { title, sequenceDescription, cinematography, audioVisualNotes } = data.videoSceneCard;
            return `
                 <div class="prose prose-invert max-w-none">
                    <h3>Video Scene: ${escapeHtml(title)}</h3>
                    <p><strong>Sequence Description:</strong> ${escapeHtml(sequenceDescription)}</p>
                    <p><strong>Cinematography:</strong> ${escapeHtml(cinematography)}</p>
                    <p><strong>Audio/Visual Notes:</strong> ${escapeHtml(audioVisualNotes)}</p>
                </div>
            `.trim();
        }
        if (buildType === 'edit' && data.editReport) {
            const { title, overallFeedback, pacingAndRhythm, visualSuggestions, audioSuggestions } = data.editReport;
            return `
                 <div class="prose prose-invert max-w-none">
                    <h3>Edit Report: ${escapeHtml(title)}</h3>
                    <p><strong>Overall Feedback:</strong> ${escapeHtml(overallFeedback)}</p>
                    <h4>Pacing & Rhythm</h4>
                    <p>${escapeHtml(pacingAndRhythm)}</p>
                    <h4>Visual Suggestions</h4>
                    <p>${escapeHtml(visualSuggestions)}</p>
                    <h4>Audio Suggestions</h4>
                    <p>${escapeHtml(audioSuggestions)}</p>
                </div>
            `.trim();
        }

    } catch (e) {
        // Not a JSON object, or not a format we recognize, so just display as plain text
        return `<p>${escapeHtml(content)}</p>`;
    }
    return `<p>${escapeHtml(content)}</p>`;
};

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading, isInputDisabled, placeholder, error, onSendMessage, activeBuildType }) => {
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isInputDisabled) {
      onSendMessage(prompt);
      setPrompt('');
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.role === ChatRole.MODEL) {
      const formattedContent = formatBuildOutput(message.content, activeBuildType);
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
        {error && <div className="text-red-400 text-sm mb-2 text-center">{error}</div>}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={placeholder}
            disabled={isInputDisabled}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg py-3 pl-4 pr-12 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
            aria-label="Chat input"
          />
          <button
            type="submit"
            disabled={isInputDisabled || !prompt.trim()}
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

export default ChatWindow;

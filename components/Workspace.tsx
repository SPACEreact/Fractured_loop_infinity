import React, { useState, useRef, useEffect } from 'react';
import { ArrowUturnLeftIcon, PaperAirplaneIcon, SparklesIcon } from './IconComponents';
import { generateSandboxResponse } from '../services/geminiService';

interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

interface WorkspaceProps {
    onGoHome: () => void;
    tagWeights: Record<string, number>;
    styleRigidity: number;
    isWeightingEnabled: boolean;
    onTagWeightChange: (tagId: string, weight: number) => void;
    onStyleRigidityChange: (value: number) => void;
    onWeightingToggle: (enabled: boolean) => void;
}

const Workspace: React.FC<WorkspaceProps> = ({
    onGoHome,
    tagWeights,
    styleRigidity,
    isWeightingEnabled,
    onTagWeightChange,
    onStyleRigidityChange,
    onWeightingToggle
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isGenerating) return;

        const userMessage: Message = {
            id: crypto.randomUUID(),
            content: inputValue.trim(),
            role: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsGenerating(true);

        try {
            const response = await generateSandboxResponse(userMessage.content, messages, tagWeights, styleRigidity);
            const assistantMessage: Message = {
                id: crypto.randomUUID(),
                content: response,
                role: 'assistant',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: crypto.randomUUID(),
                content: 'Sorry, I encountered an error. Please try again.',
                role: 'assistant',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="h-screen flex flex-col">
            <header className="p-2 border-b border-gray-700 flex justify-between items-center flex-shrink-0 z-10 bg-gray-900">
                <div className="flex items-center gap-4">
                    <button onClick={onGoHome} className="flex items-center gap-2 text-gray-300 font-medium py-2 px-3 rounded-lg hover:bg-gray-700 hover:text-white transition-colors duration-200" title="Go back to home">
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                        <span>Home</span>
                    </button>
                    <div className="w-px h-6 bg-gray-700"></div>
                    <h1 className="text-xl font-bold text-gray-100">Sandbox Mode</h1>
                </div>
            </header>

            <main className="flex-1 flex relative">
                {/* Chat Area */}
                <div className="flex-1 flex flex-col">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 mt-12">
                                <SparklesIcon className="w-12 h-12 mx-auto mb-4 text-indigo-400" />
                                <p className="text-lg">Start a conversation with your AI assistant</p>
                                <p className="text-sm">Ask questions, brainstorm ideas, or get creative help</p>
                            </div>
                        )}
                        {messages.map((message) => (
                            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] glass-card p-4 rounded-2xl ${message.role === 'user' ? 'bg-indigo-600/20 border-indigo-500/30' : 'bg-gray-700/50'}`}>
                                    <p className="text-gray-100 whitespace-pre-wrap">{message.content}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {message.timestamp.toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {isGenerating && (
                            <div className="flex justify-start">
                                <div className="glass-card p-4 rounded-2xl bg-gray-700/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                        <div className="flex gap-3">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message here..."
                                className="flex-1 glass-card p-3 rounded-xl bg-gray-800/50 border border-gray-600 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                rows={3}
                                disabled={isGenerating}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isGenerating}
                                className="btn-primary p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Send message"
                            >
                                <PaperAirplaneIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Weighting Sidebar */}
                <aside className="hidden md:flex glass-card w-80 flex-col fixed inset-y-0 right-0 z-30 top-14">
                    <div className="p-4 border-b border-gray-700">
                        <h2 className="text-lg font-bold text-gray-100">AI Preferences</h2>
                        <p className="text-sm text-gray-400">Adjust how the AI responds</p>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                        <div className="space-y-6">
                            <div className="glass-card p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="font-bold text-gray-100">Enable Tag Weighting</label>
                                    <button
                                        role="switch"
                                        aria-checked={isWeightingEnabled}
                                        onClick={() => onWeightingToggle(!isWeightingEnabled)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isWeightingEnabled ? 'bg-indigo-500' : 'bg-gray-600'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isWeightingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400">Weight different creative elements in responses</p>
                            </div>

                            <div className={`glass-card p-4 transition-opacity ${isWeightingEnabled ? 'opacity-100' : 'opacity-50'}`}>
                                <label className="block font-bold text-gray-100 mb-3">Style Rigidity</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={styleRigidity}
                                    onChange={(e) => onStyleRigidityChange(parseInt(e.target.value))}
                                    className="w-full"
                                    disabled={!isWeightingEnabled}
                                />
                                <div className="text-xs text-gray-400 flex justify-between mt-2">
                                    <span>Creative Freedom</span>
                                    <span>Strict Guidelines</span>
                                </div>
                            </div>

                            <div className={`space-y-3 transition-opacity ${isWeightingEnabled ? 'opacity-100' : 'opacity-50'}`}>
                                <h3 className="font-bold text-gray-100">Tag Weights</h3>
                                {Object.entries(tagWeights).map(([tagId, weight]) => (
                                    <div key={tagId} className="glass-card p-3">
                                        <label className="block text-sm text-gray-300 mb-2 capitalize">{tagId.replace('_', ' ')}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="200"
                                            value={Math.round(weight * 100)}
                                            onChange={(e) => onTagWeightChange(tagId, parseInt(e.target.value) / 100)}
                                            className="w-full"
                                            disabled={!isWeightingEnabled}
                                        />
                                        <div className="text-xs text-gray-400 mt-1">{Math.round(weight * 100)}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
};

export default Workspace;

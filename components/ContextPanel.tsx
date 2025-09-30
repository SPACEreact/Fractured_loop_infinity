

import React, { useState } from 'react';
import type { BuildContext, Seed, Question } from '../types';
import { ALL_TAGS, TAG_GROUPS, NODE_TEMPLATES } from '../constants';
import { DocumentTextIcon, FilmIcon, PhotoIcon, ScissorsIcon, VideoCameraIcon, SparklesIcon, QuestionMarkCircleIcon } from './IconComponents';

interface ContextPanelProps {
  mode: 'build' | 'sandbox';
  buildContext?: BuildContext;
  sandboxContext?: Record<string, string>;
  isWeightingEnabled?: boolean;
  onWeightingToggle?: (enabled: boolean) => void;
  styleRigidity?: number;
  onStyleRigidityChange?: (value: number) => void;
  tagWeights?: Record<string, number>;
  onTagWeightChange?: (tagId: string, weight: number) => void;
}

const buildTypeToIcon: Record<string, React.ReactNode> = {
    story: <FilmIcon className="w-5 h-5 text-indigo-400" />,
    shot: <DocumentTextIcon className="w-5 h-5 text-indigo-400" />,
    image: <PhotoIcon className="w-5 h-5 text-indigo-400" />,
    video: <VideoCameraIcon className="w-5 h-5 text-indigo-400" />,
    edit: <ScissorsIcon className="w-5 h-5 text-indigo-400" />,
};

const SeedCard: React.FC<{ seed: Seed }> = ({ seed }) => {
    return (
        <div className="bg-gray-700/50 p-3 rounded-lg">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    {buildTypeToIcon[seed.sourceBuild] || <DocumentTextIcon className="w-5 h-5 text-indigo-400" />}
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-100">{seed.id}</p>
                    <p className="text-xs text-gray-400">{seed.summary}</p>
                </div>
            </div>
        </div>
    )
}

const SeedsView: React.FC<{ buildContext: BuildContext }> = ({ buildContext }) => {
    const allSeeds = Object.keys(buildContext).flatMap(key => buildContext[key]?.seeds || []);

    return (
        <div className="p-2">
            {allSeeds.length === 0 ? (
                <div className="text-center text-sm text-gray-500 mt-8 p-4">
                    <p>No seeds generated yet.</p>
                    <p>Complete a build to create a seed.</p>
                </div>
            ) : (
                <div className="space-y-4">
                {Object.keys(buildContext).map((buildType) => {
                    const buildData = buildContext[buildType];
                    if (!buildData || buildData.seeds.length === 0) return null;
                    const buildTypeTitle = buildType.charAt(0).toUpperCase() + buildType.slice(1);
                    return (
                        <div key={buildType}>
                            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-2">{buildTypeTitle} Seeds</h3>
                            <div className="space-y-2">
                               {buildData.seeds.map((seed: Seed) => <SeedCard key={seed.id} seed={seed} />)}
                            </div>
                        </div>
                    )
                })}
                </div>
            )}
        </div>
    );
};

const TagsView: React.FC<{ sandboxContext: Record<string, string> }> = ({ sandboxContext }) => {
    const filledTags = Object.keys(sandboxContext);
    
    return (
         <div className="p-2">
            {filledTags.length === 0 ? (
                <div className="text-center text-sm text-gray-500 mt-8 p-4">
                    <SparklesIcon className="w-8 h-8 mx-auto text-indigo-500 mb-2" />
                    <p>Your context will appear here.</p>
                    <p>Start chatting to build your project.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.keys(ALL_TAGS).map(buildType => {
                        const tagsForBuild = ALL_TAGS[buildType as keyof typeof ALL_TAGS];
                        const filledTagsForBuild = (tagsForBuild as Question[]).filter(tag => filledTags.includes(tag.id));
                        
                        if (filledTagsForBuild.length === 0) return null;

                        const buildTypeTitle = buildType.charAt(0).toUpperCase() + buildType.slice(1);

                        return (
                            <div key={buildType}>
                                <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2 px-2">{buildTypeTitle} Tags</h3>
                                <div className="space-y-2">
                                    {filledTagsForBuild.map((tag: Question) => (
                                        <div key={tag.id} className="text-sm bg-gray-700/50 p-3 rounded-lg">
                                            <p className="font-semibold text-gray-300 truncate">{tag.text}</p>
                                            <p className="text-indigo-300 mt-1 pl-2 border-l-2 border-indigo-500">{sandboxContext[tag.id]}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

const WeightsView: React.FC<Omit<ContextPanelProps, 'mode' | 'buildContext' | 'sandboxContext'>> = ({
    isWeightingEnabled, onWeightingToggle, styleRigidity, onStyleRigidityChange, tagWeights, onTagWeightChange
}) => {
    return (
        <div className="p-2">
            <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <label htmlFor="enable-weighting" className="font-bold text-gray-100">Enable Tag Weighting</label>
                        <QuestionMarkCircleIcon className="w-4 h-4 text-gray-400" title="Toggle to enable or disable tag weighting for AI responses" />
                    </div>
                    <button
                        role="switch"
                        aria-checked={isWeightingEnabled}
                        onClick={() => onWeightingToggle?.(!isWeightingEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            isWeightingEnabled ? 'bg-indigo-500' : 'bg-gray-600'
                        }`}
                        id="enable-weighting"
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isWeightingEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                    </button>
                </div>
            </div>

            <div className={`transition-opacity duration-300 ${isWeightingEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
                    <label htmlFor="style-rigidity" className="block font-bold text-gray-100 mb-2">Style Rigidity</label>
                    <input
                        id="style-rigidity"
                        type="range"
                        min="0"
                        max="100"
                        value={styleRigidity}
                        onChange={(e) => onStyleRigidityChange?.(parseInt(e.target.value, 10))}
                        className="w-full"
                        disabled={!isWeightingEnabled}
                    />
                     <div className="text-xs text-gray-400 flex justify-between">
                        <span>More AI Freedom</span>
                        <span>Strict Adherence</span>
                    </div>
                </div>

                {Object.entries(TAG_GROUPS).map(([groupName, tagIds]) => (
                    <details key={groupName} className="bg-gray-700/50 rounded-lg mb-2" open>
                        <summary className="font-bold text-gray-100 p-3 cursor-pointer">{groupName}</summary>
                        <div className="p-3 border-t border-gray-600 space-y-3">
                            {tagIds.map((tagId: string) => {
                                const tag = NODE_TEMPLATES[tagId];
                                if (!tag) return null;
                                return (
                                    <div key={tagId}>
                                        <label className="block text-sm text-gray-300 mb-1 line-clamp-1" title={tag.name}>{tag.name}</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="200"
                                            value={Math.round((tagWeights?.[tagId] ?? 1.0) * 100)}
                                            onChange={(e) => onTagWeightChange?.(tagId, parseInt(e.target.value, 10) / 100)}
                                            className="w-full"
                                            disabled={!isWeightingEnabled}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </details>
                ))}
            </div>
        </div>
    );
};


const ContextPanel: React.FC<ContextPanelProps> = (props) => {
  const { mode, buildContext, sandboxContext } = props;
  const initialTab = mode === 'build' ? 'seeds' : 'tags';
  const [activeTab, setActiveTab] = useState(initialTab);

  const TABS = {
      build: [
          {id: 'seeds', label: 'Project Seeds'}, 
          {id: 'weights', label: 'Tag Weights'}
      ],
      sandbox: [
          {id: 'tags', label: 'Sandbox Context'}, 
          {id: 'weights', label: 'Tag Weights'}
      ]
  };
  
  const currentTabs = TABS[mode];

  // If the active tab is not in the current mode's tabs, reset it.
  React.useEffect(() => {
      if (!currentTabs.find(t => t.id === activeTab)) {
          setActiveTab(initialTab);
      }
  }, [mode, activeTab, initialTab, currentTabs]);

  return (
    <aside className="bg-gray-800/50 w-80 flex flex-col fixed inset-y-0 right-0">
        <div className="flex-shrink-0 border-b border-gray-700">
            <nav className="flex -mb-px">
                {currentTabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)} 
                        className={`flex-1 py-3 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                            activeTab === tab.id 
                            ? 'border-indigo-500 text-indigo-400' 
                            : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`
                        }
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
       <div className="flex-1 overflow-y-auto custom-scrollbar">
            {activeTab === 'seeds' && <SeedsView buildContext={buildContext || {}} />}
            {activeTab === 'tags' && <TagsView sandboxContext={sandboxContext || {}} />}
            {activeTab === 'weights' && <WeightsView {...props} />}
       </div>
    </aside>
  );
};

export default ContextPanel;
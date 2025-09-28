
import React, { useState, useEffect, useCallback } from 'react';
import type { BuildType, Workflow, Message, BuildContext, Seed } from '../types';
import { ChatRole } from '../types';
import { BUILDS } from '../constants';
import { runBuild } from '../services/geminiService';
import Sidebar from './Sidebar';
import WelcomeScreen from './WelcomeScreen';
import ChatWindow from './ChatWindow';
import ContextPanel from './ContextPanel';

interface BuildScreenProps {
    workflow: Workflow;
    selectedBuild: BuildType;
    onSelectBuild: (buildType: BuildType) => void;
    onGoBackToLanding: () => void;
    sandboxContext: Record<string, string>;
    buildContext: BuildContext;
    onCompleteBuild: (buildType: BuildType, newSeeds: Seed[]) => void;
    tagWeights: Record<string, number>;
    styleRigidity: number;
    isWeightingEnabled: boolean;
    onTagWeightChange: (tagId: string, weight: number) => void;
    onStyleRigidityChange: (value: number) => void;
    onWeightingToggle: (enabled: boolean) => void;
}

type BuildPhase = 'welcome' | 'chat' | 'batch-select-shots' | 'batch-select-master';

const BuildScreen: React.FC<BuildScreenProps> = (props) => {
    const { 
        workflow, selectedBuild, onSelectBuild, onGoBackToLanding, 
        sandboxContext, buildContext, onCompleteBuild,
        tagWeights, styleRigidity, isWeightingEnabled, onTagWeightChange,
        onStyleRigidityChange, onWeightingToggle
    } = props;

    const activeBuild = BUILDS.find(b => b.id === selectedBuild)!;

    const [buildPhase, setBuildPhase] = useState<BuildPhase>('welcome');
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [completedBuilds, setCompletedBuilds] = useState<Set<BuildType>>(new Set());
    
    // State for Image Build batching
    const [shotSeedsForBatch, setShotSeedsForBatch] = useState<Seed[]>([]);
    const [selectedShotsForBatch, setSelectedShotsForBatch] = useState<Seed[]>([]);
    const [selectedMasterShot, setSelectedMasterShot] = useState<Seed | null>(null);

    // Reset state when the selected build changes
    useEffect(() => {
        setBuildPhase('welcome');
        setMessages([]);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setIsLoading(false);
        // Special logic for Image Build
        if (activeBuild.id === 'image') {
            const shots = buildContext.shot?.seeds || [];
            if (shots.length > 1) {
                setShotSeedsForBatch(shots);
                setBuildPhase('batch-select-shots');
            }
        }
    }, [selectedBuild, buildContext.shot, activeBuild.id]);

    const handleStartBuild = () => {
        // Special logic for Image Build
        if (activeBuild.id === 'image') {
            const shots = buildContext.shot?.seeds || [];
            if (shots.length === 0) {
                 setMessages([{ role: ChatRole.MODEL, content: "You need to complete a 'Shotbuild' first to generate seeds for image generation." }]);
                 setBuildPhase('chat');
                 return;
            }
            if (shots.length === 1) {
                // Only one shot, so process it directly
                processImageBuild(shots, null);
                return;
            }
            // If more than one, the 'welcome' screen already moved to batch selection
            return;
        }
        
        setBuildPhase('chat');
        setMessages([{ role: ChatRole.MODEL, content: `Let's begin the ${activeBuild.name}. First question:` }]);
        // Using a timeout to allow the initial message to render before the question
        setTimeout(() => {
            setMessages(prev => [...prev, { role: ChatRole.MODEL, content: activeBuild.questions[0].text }]);
        }, 100);
    };
    
    const processImageBuild = useCallback(async (shotsToProcess: Seed[], masterShot: Seed | null) => {
        setIsLoading(true);
        setBuildPhase('chat');
        setMessages([{ role: ChatRole.MODEL, content: "Generating your image prompts based on the shot seeds..." }]);

        const imageAnswers: Record<string, string> = {};
        if (masterShot) { // Batch mode
            imageAnswers.masterShot = JSON.stringify(masterShot.data);
            imageAnswers.batchShots = JSON.stringify(shotsToProcess.filter(s => s.id !== masterShot.id).map(s => s.data));
        } else { // Single shot mode
            Object.assign(imageAnswers, shotsToProcess[0].data);
        }
        
        const result = await runBuild('image', imageAnswers, sandboxContext, tagWeights, styleRigidity);
        
        setMessages(prev => [...prev, { role: ChatRole.MODEL_OUTPUT, content: result }]);
        setIsLoading(false);
        setCompletedBuilds(prev => new Set(prev).add('image'));
        // NOTE: ImgBuild doesn't create new seeds, it's a final output.
    }, [sandboxContext, tagWeights, styleRigidity]);
    
    const handleSetBatchShots = (shots: Seed[]) => {
        setSelectedShotsForBatch(shots);
        setBuildPhase('batch-select-master');
    };

    const handleSetMasterShot = (master: Seed) => {
        setSelectedMasterShot(master);
        processImageBuild(selectedShotsForBatch, master);
    };

    const handleSendMessage = useCallback(async (message: string) => {
        if (currentQuestionIndex >= activeBuild.questions.length) return;

        const currentQuestion = activeBuild.questions[currentQuestionIndex];
        const newAnswers = { ...answers, [currentQuestion.id]: message };
        setAnswers(newAnswers);
        setMessages(prev => [...prev, { role: ChatRole.USER, content: message }]);

        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);

        if (nextIndex < activeBuild.questions.length) {
            setMessages(prev => [...prev, { role: ChatRole.MODEL, content: activeBuild.questions[nextIndex].text }]);
        } else {
            setIsLoading(true);
            setMessages(prev => [...prev, { role: ChatRole.MODEL, content: "Great! I have all the information. Synthesizing the results..." }]);
            
            const result = await runBuild(activeBuild.id, newAnswers, sandboxContext, tagWeights, styleRigidity);

            setMessages(prev => [...prev, { role: ChatRole.MODEL_OUTPUT, content: result }]);
            setIsLoading(false);
            setCompletedBuilds(prev => new Set(prev).add(activeBuild.id));

            // Create a new seed from the result
            const newSeed: Seed = {
                id: `${activeBuild.id}-${(buildContext[activeBuild.id]?.seeds.length || 0) + 1}`,
                sourceBuild: activeBuild.id,
                summary: newAnswers[activeBuild.questions[0].id] || `Result of ${activeBuild.name}`,
                data: newAnswers,
            };
            onCompleteBuild(activeBuild.id, [newSeed]);
        }
    }, [currentQuestionIndex, answers, activeBuild, sandboxContext, buildContext, onCompleteBuild, tagWeights, styleRigidity]);
    
    const isChatInputDisabled = isLoading || currentQuestionIndex >= activeBuild.questions.length;
    const placeholder = isChatInputDisabled ? '...' : 'Type your answer...';

    return (
        <div className="h-screen flex">
            <Sidebar 
                selectedBuild={selectedBuild}
                onSelectBuild={onSelectBuild}
                onGoBackToLanding={onGoBackToLanding}
                workflow={workflow}
                completedBuilds={completedBuilds}
            />
            <main className="flex-1 pl-64 pr-80">
                {buildPhase === 'welcome' || buildPhase.startsWith('batch-') ? (
                    <WelcomeScreen 
                        activeBuild={activeBuild} 
                        onStartBuild={handleStartBuild}
                        hasSandboxContext={Object.keys(sandboxContext).length > 0}
                        buildPhase={buildPhase}
                        shotSeedsForBatch={shotSeedsForBatch}
                        onSetBatchShots={handleSetBatchShots}
                        selectedShotsForMaster={selectedShotsForBatch}
                        onSetMasterShot={handleSetMasterShot}
                    />
                ) : (
                    <ChatWindow 
                        messages={messages}
                        isLoading={isLoading}
                        isInputDisabled={isChatInputDisabled}
                        placeholder={placeholder}
                        error={null}
                        onSendMessage={handleSendMessage}
                        activeBuildType={activeBuild.id}
                    />
                )}
            </main>
            <ContextPanel 
                mode="build" 
                buildContext={buildContext}
                isWeightingEnabled={isWeightingEnabled}
                onWeightingToggle={onWeightingToggle}
                styleRigidity={styleRigidity}
                onStyleRigidityChange={onStyleRigidityChange}
                tagWeights={tagWeights}
                onTagWeightChange={onTagWeightChange}
            />
        </div>
    );
};

export default BuildScreen;

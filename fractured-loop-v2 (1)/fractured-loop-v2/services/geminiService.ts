import { GoogleGenerativeAI, FunctionDeclaration, SchemaType } from "@google/generative-ai";
import type { BuildType, NodeGraph, Workflow } from '../types';
import { ALL_TAGS } from '../constants';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenerativeAI(apiKey);

// --- V2 Services (Classic Build System) ---

const setTagFunctionDeclaration: FunctionDeclaration = {
  name: 'setTag',
  parameters: {
    type: SchemaType.OBJECT,
    description: 'Sets a specific creative tag with a value. Use this to capture user decisions and build a creative context.',
    properties: {
      tagName: {
        type: SchemaType.STRING,
        description: `The name of the tag to set. Must be one of: ${Object.values(ALL_TAGS).flat().map(t => t.id).join(', ')}`
      },
      value: {
        type: SchemaType.STRING,
        description: 'The value to assign to the tag.'
      }
    },
    required: ['tagName', 'value']
  }
};

export const createSandboxChatSession = (weights: Record<string, number>, rigidity: number, isWeightingEnabled: boolean) => {
  const weightContext = isWeightingEnabled
    ? `The user has also provided creative weights for various tags (1.0 is neutral, >1.0 is more important, <1.0 is less important) and a Style Rigidity score of ${rigidity}/100 (high means stick to tags, low means more freedom). You should let these weights subtly guide your questions and suggestions. Prioritize asking about tags with higher weights. Here are the current weights: ${JSON.stringify(weights, null, 2)}`
    : 'All creative tags are currently weighted equally.';

  return ai.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: `You are an AI assistant director named 'Loop'. Your goal is to help users develop their film or video projects. Guide them by asking clarifying questions and using the 'setTag' function to store their answers as creative 'tags'. Be conversational, encouraging, and focus on one topic at a time (e.g., character, then setting, then plot). Don't ask for multiple tags at once. When the user provides a concrete detail, immediately call \`setTag\` with the corresponding tag name and value. ${weightContext}`,
    tools: [{ functionDeclarations: [setTagFunctionDeclaration] }]
  }).startChat();
};

export const generateSuggestQuestion = async (context: Record<string, string>, workflow: Workflow | null): Promise<string> => {
    const filledTags = Object.keys(context);
    const allWorkflowTags = (workflow?.builds.flatMap(b => ALL_TAGS[b] || []) || Object.values(ALL_TAGS).flat()).map(t => t.id);
    const unfilledTags = allWorkflowTags.filter(t => !filledTags.includes(t));

    const prompt = `You are an AI assistant director. Based on the following project context, suggest a single, smart, and creative question to ask the user to help them flesh out their idea.
    
    Current Project Context:
    ${JSON.stringify(context, null, 2)}
    
    Unfilled creative tags: ${unfilledTags.join(', ')}
    
    Your goal is to ask a question that will help fill one of the unfilled tags, but phrase it naturally. Don't mention the tag names. Just ask a good, inspiring question. For example, instead of asking for 'characterFlaw', ask "What is the one personal failing that always seems to get in your hero's way?".
    
    Generate one question.`;

    try {
        const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const response = await model.generateContent(prompt);
        return response.response.text();
    } catch (error) {
        console.error("Error generating suggested question:", error);
        return "What's the most important visual element you're imagining right now?";
    }
};

const getBuildPrompt = (
    buildType: BuildType, 
    answers: Record<string, string>, 
    context: Record<string, string>,
    weights: Record<string, number>,
    rigidity: number
): string => {
    const combinedContext = { ...context, ...answers };
    
    const contextString = Object.entries(combinedContext)
        .map(([key, value]) => {
            const weight = weights[key] ?? 1.0;
            return `- ${key} (Weight: ${weight.toFixed(2)}): ${value}`;
        })
        .join('\n');
    
    const baseInstruction = `You are an expert AI assistant director. Your task is to generate a creative document based on a set of weighted creative tags.

**INSTRUCTIONS:**
1.  **Tag Weighting:** Each tag has a "Weight" from 0.0 to 2.0. A weight of 1.0 is neutral. A higher weight (e.g., 1.8) means the tag is critically important and should be heavily emphasized in the output. A lower weight (e.g., 0.3) means it's a minor detail.
2.  **Style Rigidity:** The user has set a "Style Rigidity" of ${rigidity}/100. A high score means you must adhere very strictly to the provided tags and their weights. A low score gives you more creative freedom to interpret and blend the ideas.
3.  **Output Format:** You must generate a JSON object based on the specific request for this build type.

**Creative Context with Weights:**
${contextString}

---
`;

    switch (buildType) {
        case 'story':
            return `${baseInstruction}Generate a character profile and potential character arc based on these details. Return a JSON object with two keys: "characterProfile" (containing "name" and "summary") and "potentialArc".`;
        case 'shot':
            return `${baseInstruction}Generate a detailed "Shot Card" for a cinematic shot. Return a JSON object with a single key "shotCard" containing "title", "camera", "lighting", "composition", and "look".`;
        case 'image':
             const isBatch = 'batchShots' in combinedContext;
            if (isBatch) {
                return `${baseInstruction}You are an expert prompt engineer. The user has provided a "Master Style" shot and a list of "Variant Shots". Generate an array of JSON objects, one for each variant shot. Each object must have two keys: "prompt" and "explanation".
                - The "prompt" should be a highly detailed, cinematic AI image prompt.
                - It must COMBINE the specific action/subject from the VARIANT shot with the weighted aesthetic (lighting, color, lens etc.) of the MASTER style shot.
                - Adhere to the Tag Weighting and Style Rigidity rules. The weights from the Master Style shot are dominant.
                - The "explanation" should be a brief "Director's Commentary" on why the prompt choices were made.

                Master Style Shot Details (for aesthetics):
                ${combinedContext.masterShot}

                Variant Shots (for subject/action):
                ${combinedContext.batchShots}

                Return a single JSON array. Do not include the master shot in the output array.`;
            }
            return `${baseInstruction}Generate a highly detailed, cinematic AI image prompt and a brief "Director's Commentary" explaining the creative choices, paying close attention to the provided Tag Weights and Style Rigidity. Return a JSON object with two keys: "prompt" and "explanation".`;
        case 'video':
            return `${baseInstruction}Generate a "Video Scene Card" with a plan for a short video sequence. Return a JSON object with a single key "videoSceneCard" containing "title", "sequenceDescription", "cinematography", and "audioVisualNotes".`;
        case 'edit':
            return `${baseInstruction}Generate an "Edit Report" providing feedback on a video edit. Return a JSON object with a single key "editReport" containing "title", "overallFeedback", "pacingAndRhythm", "visualSuggestions", and "audioSuggestions".`;
        default:
            return `${baseInstruction}Synthesize the provided information into a creative summary.`;
    }
};

export const runBuild = async (
    buildType: BuildType, 
    answers: Record<string, string>, 
    context: Record<string, string>,
    weights: Record<string, number>,
    rigidity: number
): Promise<string> => {
    const prompt = getBuildPrompt(buildType, answers, context, weights, rigidity);
    try {
        const model = ai.getGenerativeModel({ 
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: 'application/json'
            }
        });
        const response = await model.generateContent(prompt);
        return response.response.text();
    } catch (error) {
        console.error(`Error running ${buildType} build:`, error);
        return JSON.stringify({ error: `An error occurred during the build: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
};

// --- V3 Services (Quantum Box) ---

export const generateFromQuantumBox = async (
    graph: NodeGraph,
    context: { id: string; name: string; value: string; size: number; distance: number }[],
    harmonyLevel: number,
    weights: Record<string, number>,
    rigidity: number,
    outputType: string
): Promise<string> => {
    const contextString = context.map(c => `- ${c.name}: ${c.value} (Planet Size/Weight: ${c.size}, Distance from Sun: ${c.distance.toFixed(0)})`).join('\n');
    const connectionsString = graph.connections.map(c => {
        const from = graph.nodes.find(n => n.id === c.fromNodeId)?.name;
        const to = graph.nodes.find(n => n.id === c.toNodeId)?.name;
        return `- ${from} <-> ${to} (${c.type.toUpperCase()})`;
    }).join('\n');

    const baseInstruction = `You are an expert AI assistant director. The user has designed a "solar system" of creative ideas to generate a final, synthesized output.

**INTERPRETATION RULES:**
1.  **Solar System & Planets:** The user has arranged creative concepts as "planets". Each planet has a value, a size, and a distance from the center.
2.  **Planet Size:** Represents the concept's **importance** or **weight**. Larger planets are more dominant.
3.  **Orbit (Distance):** Represents how **central** the idea is. Planets closer to the sun are core concepts.
4.  **Connections (Harmony/Tension):** HARMONY means concepts should blend; TENSION means they should deliberately clash.
5.  **Global Dial:** A global bias of ${harmonyLevel}% Harmony vs ${100 - harmonyLevel}% Tension influences the overall interpretation.
6.  **Slider Weights:** The user has provided numerical weights for each tag type (0.0-2.0). Treat these as a primary override. A high slider weight MUST be heavily emphasized.
7.  **Style Rigidity:** The user has set a "Style Rigidity" of ${rigidity}/100. High score means strict adherence to all rules; low score allows for more creative freedom.

**THE USER'S SOLAR SYSTEM:**

**Planets (Concept, Value, Size, Orbit Distance):**
${contextString}

**Connections:**
${connectionsString || 'No connections made.'}

**Slider Tag Weights (Primary Importance):**
${JSON.stringify(weights, null, 2)}

---
`;

    let taskInstruction = '';
    let responseMimeType: 'text/plain' | 'application/json' = 'text/plain';

    switch (outputType) {
        case 'story':
            taskInstruction = "TASK: Synthesize all this information into a cohesive story summary. Generate a JSON object with two keys: \"characterProfile\" (containing \"name\" and \"summary\") and \"potentialArc\".";
            responseMimeType = 'application/json';
            break;
        case 'video':
            taskInstruction = "TASK: Synthesize all this information into a plan for a short video sequence. Generate a JSON object with a single key \"videoSceneCard\" containing \"title\", \"sequenceDescription\", \"cinematography\", and \"audioVisualNotes\".";
            responseMimeType = 'application/json';
            break;
        case 'batch':
            const masterStyleNode = graph.nodes.find(n => n.type === 'masterStyle');
            const variantShotNodes = graph.nodes.filter(n => n.type === 'variantShot' && graph.connections.some(c => c.fromNodeId === n.id && c.toNodeId === masterStyleNode?.id));
            
            if (!masterStyleNode || variantShotNodes.length === 0) {
                 return Promise.resolve("Error: For batch generation, you must have one 'Master Style' node connected to the 'AI Prompt Output', and one or more 'Variant Shot' nodes connected to the 'Master Style' node.");
            }
            
            taskInstruction = `TASK: You are an expert prompt engineer. The user has provided a "Master Style" and several "Variant Shots". Generate an array of JSON objects, one for each variant shot. Each object must have two keys: "prompt" and "explanation".
- The "prompt" must be a highly detailed, cinematic AI image prompt that COMBINES the specific action/subject from the VARIANT shot with the weighted aesthetic from the MASTER style.
- Adhere to all interpretation rules.
- The "explanation" should be a brief "Director's Commentary" on the creative choices.

Master Style Details (for aesthetics):
${masterStyleNode.value}

Variant Shots (for subject/action):
${variantShotNodes.map(v => `- ${v.value}`).join('\n')}

Return a single JSON array.`;
            responseMimeType = 'application/json';
            break;
        case 'image':
        default:
            taskInstruction = "TASK: Synthesize all of this information into a single, rich, and creative paragraph. This will be used as a prompt for an image generator, so make it descriptive and evocative.";
            responseMimeType = 'text/plain';
            break;
    }

    const prompt = `${baseInstruction}\n${taskInstruction}`;

    try {
        const model = ai.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType
            }
        });
        
        const response = await model.generateContent(prompt);
        
        if (outputType === 'batch' || outputType === 'story' || outputType === 'video') {
             // For batch mode, we need to format the JSON array into something readable, like the classic build system does.
            try {
                const data = JSON.parse(response.response.text());
                if (outputType === 'batch' && Array.isArray(data)) {
                    return JSON.stringify(data); // Return raw JSON for the ChatWindow to format
                }
                return response.response.text(); // Return raw JSON for story/video
            } catch (e) {
                return `Error parsing JSON response: ${response.response.text()}`;
            }
        }
        
        return response.response.text();
    } catch (error) {
        console.error("Error generating from Quantum Box:", error);
        return `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
};
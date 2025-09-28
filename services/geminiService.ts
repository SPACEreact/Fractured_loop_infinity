// API key provided by user
const GEMINI_API_KEY = 'AIzaSyBD5wS3hwL4zRiAs5tAaxfH8YNZ3efqT3U';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Types
export interface GenerationRequest {
  contents: Array<{
    parts: Array<{ text: string }>;
  }>;
}

export interface GenerationResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

// Mock function for sandbox chat responses
export const generateSandboxResponse = async (
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  tagWeights: Record<string, number>,
  styleRigidity: number
): Promise<string> => {
  // In a real implementation, make an API call to Gemini
  // For now, return a mock response based on the input

  // Build prompt incorporating weights and rigidity
  let systemPrompt = `You are a creative AI assistant for film production. `;
  if (tagWeights) {
    const weightedTags = Object.entries(tagWeights)
      .filter(([_, weight]) => weight > 1)
      .map(([tag, weight]) => `${tag} (importance: ${Math.round(weight * 100)}%)`)
      .join(', ');
    if (weightedTags) {
      systemPrompt += `Focus on these elements: ${weightedTags}. `;
    }
  }
  if (styleRigidity > 50) {
    systemPrompt += `Be precise and adhere strictly to guidelines. `;
  } else {
    systemPrompt += `Be creative and flexible in your responses. `;
  }

  // Build conversation context
  const historyText = conversationHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const fullPrompt = `${systemPrompt}\n\nConversation History:\n${historyText}\n\nUser: ${userMessage}\nAssistant:`;

  // Real API call
  try {
    const request: GenerationRequest = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: GenerationResponse = await response.json();
    return data.candidates[0]?.content.parts[0]?.text || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate response from AI service');
  }
};

// Existing function for QuantumBox (assuming it exists or needs to be implemented)
export const generateFromQuantumBox = async (
  nodeContext: Array<{ id: string; name: string; value: string; size: number; distance: number }>,
  harmonyLevel: number,
  tagWeights: Record<string, number>,
  styleRigidity: number,
  outputType: string
): Promise<string> => {
  // Real API call implementation
  let systemPrompt = `You are a creative AI assistant for film production. Generate ${outputType} prompts based on the provided graph structure. `;
  if (tagWeights) {
    const weightedTags = Object.entries(tagWeights)
      .filter(([_, weight]) => weight > 1)
      .map(([tag, weight]) => `${tag} (importance: ${Math.round(weight * 100)}%)`)
      .join(', ');
    if (weightedTags) {
      systemPrompt += `Focus on these elements: ${weightedTags}. `;
    }
  }
  if (styleRigidity > 50) {
    systemPrompt += `Be precise and adhere strictly to guidelines. `;
  } else {
    systemPrompt += `Be creative and flexible in your responses. `;
  }

  const graphText = `Graph nodes: ${nodeContext.map(n => `${n.name} (size: ${n.size}, value: ${n.value})`).join('; ')}. Harmony level: ${harmonyLevel}%.`;

  const fullPrompt = `${systemPrompt}\n\nGraph Context:\n${graphText}\n\nGenerate ${outputType} output:`;

  try {
    const request: GenerationRequest = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: GenerationResponse = await response.json();
    return data.candidates[0]?.content.parts[0]?.text || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate response from AI service');
  }
};

// Function for running builds in guided workflows
export const runBuild = async (
  buildType: string,
  answers: Record<string, string>,
  sandboxContext: Record<string, string>,
  tagWeights: Record<string, number>,
  styleRigidity: number
): Promise<string> => {
  let systemPrompt = `You are a creative AI assistant for film production. Process the ${buildType} build with the provided answers. `;
  if (tagWeights) {
    const weightedTags = Object.entries(tagWeights)
      .filter(([_, weight]) => weight > 1)
      .map(([tag, weight]) => `${tag} (importance: ${Math.round(weight * 100)}%)`)
      .join(', ');
    if (weightedTags) {
      systemPrompt += `Focus on these elements: ${weightedTags}. `;
    }
  }
  if (styleRigidity > 50) {
    systemPrompt += `Be precise and adhere strictly to guidelines. `;
  } else {
    systemPrompt += `Be creative and flexible in your responses. `;
  }

  const answersText = Object.entries(answers).map(([key, value]) => `${key}: ${value}`).join('\n');
  const sandboxText = Object.entries(sandboxContext).map(([key, value]) => `${key}: ${value}`).join('\n');

  const fullPrompt = `${systemPrompt}\n\nAnswers:\n${answersText}\n\nSandbox Context:\n${sandboxText}\n\nGenerate ${buildType} output:`;

  try {
    const request: GenerationRequest = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }]
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: GenerationResponse = await response.json();
    return data.candidates[0]?.content.parts[0]?.text || 'Sorry, I could not generate a response.';
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('Failed to generate response from AI service');
  }
};

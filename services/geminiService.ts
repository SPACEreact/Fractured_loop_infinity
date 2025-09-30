const GEMINI_API_KEY = 'AIzaSyBD5wS3hwL4zRiAs5tAaxfH8YNZ3efqT3U';
const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_API_URL = `${GEMINI_API_BASE_URL}/models/gemini-2.5-flash:generateContent`;

// Retry utility function
async function retryApiCall<T>(fn: () => Promise<T>, retries = 3, baseDelay = 1000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;
      if (i < retries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.warn(`API call failed, retrying in ${delay}ms... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError!;
}

import { MASTER_PROMPT } from '../constants';

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
export const listModels = async (): Promise<any> => {
  try {
    const response = await fetch(`${GEMINI_API_BASE_URL}/models?key=${GEMINI_API_KEY}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ListModels API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: unknown) {
    console.error('ListModels API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to list models from AI service: ${error.message}`);
    } else {
      throw new Error('Failed to list models from AI service: Unknown error');
    }
  }
};

export const generateSandboxResponse = async (
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  tagWeights: Record<string, number>,
  styleRigidity: number
): Promise<string> => {
  // In a real implementation, make an API call to Gemini
  // For now, return a mock response based on the input

  // Build prompt incorporating weights and rigidity
  let systemPrompt = `${MASTER_PROMPT} `;
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

  // Real API call with retry
  try {
    return await retryApiCall(async () => {
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
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GenerationResponse = await response.json();
      return data.candidates[0]?.content.parts[0]?.text || 'Sorry, I could not generate a response.';
    });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate response from AI service: ${error.message}`);
    } else {
      throw new Error('Failed to generate response from AI service: Unknown error');
    }
  }
};

export const generateFromWorkspace = async (
  project: {
    assets: Array<{ id: string; type: string; name: string; content: string; tags: string[] }>;
    canvas: {
      nodes: Array<{ id: string; assetId: string; position: { x: number; y: number }; size: number }>;
      connections: Array<{ from: string; to: string; type: 'harmony' | 'tension'; harmonyLevel: number }>;
    };
  },
  tagWeights: Record<string, number>,
  styleRigidity: number,
  outputType: string
): Promise<string> => {
  // Real API call implementation for unified workspace
  let systemPrompt = MASTER_PROMPT + ` Generate ${outputType} content based on the provided project workspace. `;
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

  // Build context from project assets and canvas
  const assetsText = project.assets.map(asset =>
    `${asset.type}: ${asset.name} - ${asset.content} (tags: ${asset.tags.join(', ')})`
  ).join('\n');

  const canvasText = `Canvas connections: ${project.canvas.connections.map(conn =>
    `${conn.type} connection from ${project.canvas.nodes.find(n => n.id === conn.from)?.assetId} to ${project.canvas.nodes.find(n => n.id === conn.to)?.assetId} (harmony: ${conn.harmonyLevel}%)`
  ).join('; ')}`;

  const fullPrompt = `${systemPrompt}\n\nProject Assets:\n${assetsText}\n\nCanvas Structure:\n${canvasText}\n\nGenerate ${outputType} output:`;

  try {
    return await retryApiCall(async () => {
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
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GenerationResponse = await response.json();
      return data.candidates[0]?.content.parts[0]?.text || 'Sorry, I could not generate a response.';
    });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate response from AI service: ${error.message}`);
    } else {
      throw new Error('Failed to generate response from AI service: Unknown error');
    }
  }
};

export const runBuild = async (
  buildType: string,
  answers: Record<string, string>,
  sandboxContext: Record<string, string>,
  tagWeights: Record<string, number>,
  styleRigidity: number
): Promise<string> => {
  let systemPrompt = `${MASTER_PROMPT} Process the ${buildType} build with the provided answers. `;
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
    return await retryApiCall(async () => {
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
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data: GenerationResponse = await response.json();
      return data.candidates[0]?.content.parts[0]?.text || 'Sorry, I could not generate a response.';
    });
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate response from AI service: ${error.message}`);
    } else {
      throw new Error('Failed to generate response from AI service: Unknown error');
    }
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string> => {
  const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict';

  try {
    return await retryApiCall(async () => {
      const request = {
        prompt: {
          text: prompt
        },
        sampleCount: 1,
        outputOptions: {
          mimeType: 'image/png'
        }
      };

      const response = await fetch(`${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image API request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      if (data.predictions && data.predictions.length > 0) {
        return data.predictions[0].bytesBase64Encoded; // base64 encoded image
      }
      throw new Error('No image returned from model');
    });
  } catch (error: unknown) {
    console.error('Image Generation Error:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image from AI service: ${error.message}`);
    } else {
      throw new Error('Failed to generate image from AI service: Unknown error');
    }
  }
};

import axios from 'axios';

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:70b';

// Quality-focused AI settings
const AI_TEMPERATURE = parseFloat(process.env.AI_TEMPERATURE || '0.82');
const AI_TOP_P = parseFloat(process.env.AI_TOP_P || '0.92');
const AI_TOP_K = parseInt(process.env.AI_TOP_K || '50');
const AI_MAX_TOKENS = parseInt(process.env.AI_MAX_TOKENS || '1500');
const AI_REPEAT_PENALTY = parseFloat(process.env.AI_REPEAT_PENALTY || '1.1');
const AI_NUM_CTX = parseInt(process.env.AI_NUM_CTX || '8192');

interface OllamaGenerateOptions {
  model?: string;
  prompt: string;
  system?: string;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  num_predict?: number;
  repeat_penalty?: number;
  num_ctx?: number;
  format?: 'json' | '';
}

export async function generateText(options: OllamaGenerateOptions): Promise<string> {
  try {
    const response = await axios.post(
      `${OLLAMA_API_URL}/api/generate`,
      {
        model: options.model || OLLAMA_MODEL,
        prompt: options.prompt,
        system: options.system,
        temperature: options.temperature ?? AI_TEMPERATURE,
        top_p: options.top_p ?? AI_TOP_P,
        top_k: options.top_k ?? AI_TOP_K,
        num_predict: options.num_predict ?? AI_MAX_TOKENS,
        repeat_penalty: options.repeat_penalty ?? AI_REPEAT_PENALTY,
        num_ctx: options.num_ctx ?? AI_NUM_CTX,
        format: options.format,
        stream: false,
      },
      {
        timeout: 180000, // 3 minutes timeout for quality model
      }
    );

    return response.data.response;
  } catch (error: any) {
    console.error('Ollama API error:', error.message);
    throw new Error(`Failed to generate text: ${error.message}`);
  }
}

export async function extractEntities(text: string): Promise<any> {
  const system = `You are an AI that extracts structured information from story text. 
Extract all characters, locations, events, and relationships. 
Return your response as valid JSON with the following structure:
{
  "characters": [{"name": "", "role": "", "description": "", "personality": [], "physical_traits": []}],
  "locations": [{"name": "", "description": "", "type": ""}],
  "events": [{"description": "", "event_type": "", "characters": [], "location": ""}],
  "relationships": [{"character_1": "", "character_2": "", "relationship_type": "", "description": ""}],
  "summary": ""
}`;

  const prompt = `Extract entities from this story text:\n\n${text}`;

  try {
    const response = await generateText({
      prompt,
      system,
      format: 'json',
    });

    // Parse JSON response
    const parsed = JSON.parse(response);
    return parsed;
  } catch (error: any) {
    console.error('Entity extraction error:', error.message);
    // Return empty structure on error
    return {
      characters: [],
      locations: [],
      events: [],
      relationships: [],
      summary: '',
    };
  }
}

export async function continueStory(context: string, userPrompt: string): Promise<string> {
  const system = `You are a creative story writer. Continue the story naturally based on the provided context.
Maintain character consistency, respect established relationships, and keep the narrative engaging.
Write in a natural, flowing style that matches the tone of the existing story.`;

  const prompt = `STORY CONTEXT:\n${context}\n\nUSER REQUEST:\n${userPrompt}\n\nContinue the story:`;

  try {
    const response = await generateText({
      prompt,
      system,
    });

    return response;
  } catch (error: any) {
    console.error('Story continuation error:', error.message);
    throw error;
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_API_URL}/api/tags`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

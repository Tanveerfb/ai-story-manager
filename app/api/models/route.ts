import { NextRequest, NextResponse } from 'next/server';
import { Ollama } from 'ollama';

/**
 * API endpoint to list available Ollama models
 * GET /api/models - Returns list of installed models on the Ollama server
 */

const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
});

export async function GET(request: NextRequest) {
  try {
    // Fetch list of models from Ollama
    const response = await ollama.list();
    
    // Extract model names from response
    const models = response.models.map((model: any) => model.name);
    
    return NextResponse.json({
      models,
      count: models.length,
    });
  } catch (error: any) {
    console.error('Failed to fetch models from Ollama:', error);
    
    // Return empty list on error - UI will assume all models are available
    return NextResponse.json({
      models: [],
      count: 0,
      error: 'Failed to connect to Ollama server',
    }, { status: 500 });
  }
}

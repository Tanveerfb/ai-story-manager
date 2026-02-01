/**
 * Application Configuration Constants
 * Centralized constants for AI-First Authoring Suite
 */

/**
 * Default AI model for story generation
 * This model is used when no specific model is selected by the user
 */
export const DEFAULT_AI_MODEL = 'llama3.1:70b';

/**
 * Available AI models for story generation
 * Keep this list in sync with ModelSelector component
 */
export const AVAILABLE_MODELS = [
  'llama3.1:70b',
  'llama3.1:8b',
  'wizardlm-uncensored:latest',
  'dolphin-llama3:latest',
  'llama3-uncensored:latest',
];

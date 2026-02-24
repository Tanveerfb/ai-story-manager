/**
 * Application Configuration Constants
 * Centralized constants for AI-First Authoring Suite
 */

/**
 * Default AI model for story generation
 * This model is used when no specific model is selected by the user
 */
export const DEFAULT_AI_MODEL = "wizardlm-uncensored:latest";

/**
 * Available AI models for story generation
 * Keep this list in sync with ModelSelector component
 */
export const AVAILABLE_MODELS = [
  "wizardlm-uncensored:latest",
  "llama3.1:70b",
  "llama3.1:8b",
  "dolphin-llama3:latest",
  "llama3-uncensored:latest",
];

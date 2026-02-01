'use client';

import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

/**
 * Model Selector Component for AI-First Authoring Suite
 * Allows users to select from available uncensored models for story generation
 */

interface Model {
  id: string;
  name: string;
  size?: string;
  description?: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

/**
 * Available uncensored models for creative fiction writing
 * These models are optimized for unrestricted content generation
 */
const AVAILABLE_MODELS: Model[] = [
  {
    id: 'llama3.1:70b',
    name: 'Llama 3.1 (70B)',
    size: '70B',
    description: 'Large, high-quality model - best for detailed narratives',
  },
  {
    id: 'llama3.1:8b',
    name: 'Llama 3.1 (8B)',
    size: '8B',
    description: 'Fast, efficient model - good for quick iterations',
  },
  {
    id: 'wizardlm-uncensored:latest',
    name: 'WizardLM Uncensored',
    size: '13B',
    description: 'Optimized for creative fiction without content filters',
  },
  {
    id: 'dolphin-llama3:latest',
    name: 'Dolphin Llama 3',
    size: '8B',
    description: 'Uncensored Llama 3 variant - balanced and versatile',
  },
  {
    id: 'llama3-uncensored:latest',
    name: 'Llama 3 Uncensored',
    size: '8B',
    description: 'Community uncensored model - no content restrictions',
  },
];

export default function ModelSelector({
  selectedModel,
  onModelChange,
  disabled = false,
}: ModelSelectorProps) {
  const [installedModels, setInstalledModels] = useState<string[]>([]);

  // Check which models are installed on the system
  useEffect(() => {
    checkInstalledModels();
  }, []);

  const checkInstalledModels = async () => {
    try {
      // Try to fetch list of installed models from API
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setInstalledModels(data.models || []);
      } else {
        // If API doesn't exist yet, assume all models are available
        setInstalledModels(AVAILABLE_MODELS.map((m) => m.id));
      }
    } catch (error) {
      console.error('Failed to fetch installed models:', error);
      // Fallback: assume all models are available
      setInstalledModels(AVAILABLE_MODELS.map((m) => m.id));
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <FormControl fullWidth>
        <InputLabel id="model-selector-label">AI Model</InputLabel>
        <Select
          labelId="model-selector-label"
          id="model-selector"
          value={selectedModel}
          label="AI Model"
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          startAdornment={
            <SmartToyIcon sx={{ mr: 1, color: 'action.active' }} />
          }
        >
          {AVAILABLE_MODELS.map((model) => {
            const isInstalled = installedModels.includes(model.id);
            return (
              <MenuItem key={model.id} value={model.id}>
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1">{model.name}</Typography>
                    {model.size && (
                      <Chip
                        label={model.size}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {!isInstalled && (
                      <Chip
                        label="Not Installed"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  {model.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block' }}
                    >
                      {model.description}
                    </Typography>
                  )}
                </Box>
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Select your preferred AI model for story generation. Larger models provide better quality but are slower.
      </Typography>
    </Box>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Select, Tag, Typography } from "antd";
import { RobotOutlined } from "@ant-design/icons";

const { Text } = Typography;

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
 *
 * NOTE: Keep this list updated as new models become available in Ollama.
 * Check https://ollama.ai/library for the latest models.
 * Consider installing models before adding them to this list.
 */
const AVAILABLE_MODELS: Model[] = [
  {
    id: "wizardlm-uncensored:latest",
    name: "WizardLM Uncensored",
    size: "13B",
    description: "Optimized for creative fiction without content filters",
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
      const response = await fetch("/api/models");
      if (response.ok) {
        const data = await response.json();
        setInstalledModels(data.models || []);
      } else {
        // If API doesn't exist yet, assume all models are available
        setInstalledModels(AVAILABLE_MODELS.map((m) => m.id));
      }
    } catch (error) {
      console.error("Failed to fetch installed models:", error);
      // Fallback: assume all models are available
      setInstalledModels(AVAILABLE_MODELS.map((m) => m.id));
    }
  };

  const options = AVAILABLE_MODELS.map((model) => {
    const isInstalled = installedModels.includes(model.id);
    return {
      value: model.id,
      label: (
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>{model.name}</span>
            {model.size && (
              <Tag color="blue" bordered>
                {model.size}
              </Tag>
            )}
            {!isInstalled && (
              <Tag color="warning" bordered>
                Not Installed
              </Tag>
            )}
          </div>
          {model.description && (
            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {model.description}
            </Text>
          )}
        </div>
      ),
    };
  });

  return (
    <div style={{ marginBottom: 16 }}>
      <Select
        id="model-selector"
        value={selectedModel}
        onChange={onModelChange}
        disabled={disabled}
        options={options}
        placeholder="AI Model"
        suffixIcon={<RobotOutlined />}
        style={{ width: "100%" }}
        optionLabelProp="label"
      />

      <Text
        type="secondary"
        style={{ marginTop: 8, display: "block", fontSize: 12 }}
      >
        Select your preferred AI model for story generation. Larger models
        provide better quality but are slower.
      </Text>
    </div>
  );
}

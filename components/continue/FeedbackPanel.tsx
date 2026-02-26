import { useState } from "react";
import { Card, Typography, Input, Button, Divider, Alert } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface FeedbackPanelProps {
  onSubmitFeedback: (instructions: string) => void;
  isLoading: boolean;
}

export default function FeedbackPanel({
  onSubmitFeedback,
  isLoading,
}: FeedbackPanelProps) {
  const [feedbackText, setFeedbackText] = useState("");

  const suggestionTemplates = [
    "Make the dialogue more natural",
    "Add more descriptive details",
    "Increase the tension in this scene",
    "Make the character sound angrier",
    "Add more emotional depth",
    "Shorten this section",
    "Expand on this moment",
  ];

  const handleSubmit = () => {
    if (feedbackText.trim()) {
      onSubmitFeedback(feedbackText);
      setFeedbackText("");
    }
  };

  const handleTemplateClick = (template: string) => {
    setFeedbackText(template);
  };

  return (
    <Card style={{ padding: 24, marginTop: 24 }}>
      <Title level={5}>Revision Instructions</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Provide feedback to guide the AI in rewriting the generated content.
      </Text>

      <Alert
        type="info"
        title={
          <>
            <strong>Tip:</strong> Be specific about what you want changed. The
            AI will respect your instructions and never water down scenes.
          </>
        }
        style={{ marginBottom: 16 }}
      />

      <TextArea
        rows={4}
        placeholder="E.g., 'Make Duke sound more determined', 'Add more tension to the confrontation', 'Include more description of the setting'"
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        disabled={isLoading}
        style={{ marginBottom: 16 }}
      />

      <Button
        type="primary"
        icon={<SendOutlined />}
        onClick={handleSubmit}
        disabled={isLoading || !feedbackText.trim()}
        block
        style={{ marginBottom: 16 }}
      >
        Generate Revision
      </Button>

      <Divider style={{ margin: "16px 0" }} />

      <Text strong style={{ display: "block", marginBottom: 8 }}>
        Quick Templates:
      </Text>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {suggestionTemplates.map((template, idx) => (
          <Button
            key={idx}
            size="small"
            onClick={() => handleTemplateClick(template)}
            disabled={isLoading}
          >
            {template}
          </Button>
        ))}
      </div>
    </Card>
  );
}

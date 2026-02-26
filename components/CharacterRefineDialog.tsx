"use client";

import { useState } from "react";
import {
  Modal,
  Input,
  Button,
  Typography,
  Tag,
  Alert,
  Divider,
  Card,
  Space,
} from "antd";
import {
  ToolOutlined,
  CheckOutlined,
  CloseOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";

const { Text, Title } = Typography;
const { TextArea } = Input;

const FIELD_LABELS: Record<string, string> = {
  personality: "Personality",
  description: "Appearance / Description",
  background: "Background",
  behavior_notes: "Behavior & Reactions",
  speech_patterns: "Speech Style",
  fears: "Fears",
  motivations: "Motivations",
  relationships_summary: "Relationships Summary",
  arc_notes: "Story Arc Notes",
};

// Suggestion chips to get the user started
const QUICK_PROMPTS = [
  "She's sarcastic and hides vulnerability behind jokes",
  "He speaks formally, never uses contractions",
  "She's terrified of abandonment and loud arguments",
  "He's driven by a need to prove himself to his father",
  "She reacts to stress by shutting down and going silent",
  "He's reckless under pressure but calculating when calm",
];

interface CharacterRefineDialogProps {
  open: boolean;
  character: any;
  onClose: () => void;
  onSaved: (updates: Record<string, string>) => void;
}

export default function CharacterRefineDialog({
  open,
  character,
  onClose,
  onSaved,
}: CharacterRefineDialogProps) {
  const { token } = antdTheme.useToken();
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Record<
    string,
    string
  > | null>(null);
  const [saved, setSaved] = useState(false);

  const handleRefine = async () => {
    if (!instruction.trim()) return;
    setLoading(true);
    setError(null);
    setPendingUpdates(null);
    setSaved(false);

    try {
      const res = await fetch("/api/characters/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          character,
          userInstruction: instruction,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refine failed");
      setPendingUpdates(data.updates);
      setSaved(true);
      onSaved(data.updates);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setInstruction("");
    setPendingUpdates(null);
    setError(null);
    setSaved(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      width={600}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ToolOutlined style={{ color: token.colorPrimary }} />
          <div>
            <Title level={5} style={{ margin: 0 }}>
              AI Character Builder
            </Title>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {character?.name}
            </Text>
          </div>
        </div>
      }
      footer={
        <Space>
          <Button icon={<CloseOutlined />} onClick={handleClose}>
            {saved ? "Close" : "Cancel"}
          </Button>
          <Button
            type="primary"
            onClick={handleRefine}
            disabled={loading || !instruction.trim()}
            icon={loading ? <LoadingOutlined /> : <ToolOutlined />}
          >
            {loading ? "Refining..." : "Refine with AI"}
          </Button>
        </Space>
      }
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        Tell the AI one specific thing about this character. It will update only
        the relevant profile fields — nothing else.
      </Text>

      {/* Quick prompt suggestions */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 16,
        }}
      >
        {QUICK_PROMPTS.map((p) => (
          <Tag
            key={p}
            style={{ cursor: "pointer", fontSize: "0.7rem" }}
            onClick={() => setInstruction(p)}
          >
            {p}
          </Tag>
        ))}
      </div>

      <TextArea
        rows={3}
        placeholder={`e.g. "Rhea speaks softly but her words are sharp and precise. She never raises her voice even when angry."`}
        value={instruction}
        onChange={(e) => {
          setInstruction(e.target.value);
          setPendingUpdates(null);
          setSaved(false);
          setError(null);
        }}
        disabled={loading}
        autoFocus
      />

      {error && (
        <Alert
          type="error"
          title={error}
          closable
          onClose={() => setError(null)}
          style={{ marginTop: 16 }}
        />
      )}

      {/* Show what was updated */}
      {pendingUpdates && Object.keys(pendingUpdates).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Divider style={{ marginBottom: 16 }} />
          <Text
            strong
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 8,
            }}
          >
            <CheckOutlined style={{ color: "#52c41a", fontSize: 14 }} />
            Updated fields (saved automatically):
          </Text>
          {Object.entries(pendingUpdates).map(([field, value]) => (
            <Card
              key={field}
              size="small"
              style={{ marginBottom: 8 }}
              styles={{ body: { padding: 12 } }}
            >
              <Text
                type="secondary"
                strong
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 12,
                  color: token.colorPrimary,
                }}
              >
                {FIELD_LABELS[field] || field}
              </Text>
              <Text>{value}</Text>
            </Card>
          ))}
        </div>
      )}
    </Modal>
  );
}

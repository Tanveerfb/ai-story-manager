"use client";

import { useState } from "react";
import { Typography, Card, Input, Button, Alert, Switch, Row, Col } from "antd";
import { useThemeMode } from "@/components/ThemeProvider";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const { mode, toggleTheme } = useThemeMode();
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.1:70b");
  const [temperature, setTemperature] = useState("0.82");
  const [topP, setTopP] = useState("0.92");
  const [topK, setTopK] = useState("50");
  const [maxTokens, setMaxTokens] = useState("1500");
  const [numCtx, setNumCtx] = useState("8192");
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  const testConnection = async () => {
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("disconnected");
      }
    } catch (error) {
      setConnectionStatus("disconnected");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Title level={3}>Settings</Title>

        <Card style={{ marginBottom: 24 }}>
          <Title level={5}>Appearance</Title>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch checked={mode === "dark"} onChange={toggleTheme} />
            <Text>Dark Mode</Text>
          </div>
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <Title level={5}>Ollama Configuration</Title>

          <div style={{ marginBottom: 16 }}>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Ollama API URL
            </Text>
            <Input
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Model
            </Text>
            <Input
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              e.g., llama3.1:70b, llama2, mistral
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <Button type="primary" onClick={testConnection}>
              Test Connection
            </Button>
            {connectionStatus !== "unknown" && (
              <Alert
                type={connectionStatus === "connected" ? "success" : "error"}
                title={
                  connectionStatus === "connected"
                    ? "Connected"
                    : "Disconnected"
                }
                showIcon
                style={{ padding: "4px 12px" }}
              />
            )}
          </div>
        </Card>

        <Card>
          <Title level={5}>AI Generation Parameters</Title>
          <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
            These settings control the quality and creativity of AI-generated
            content.
          </Text>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4 }}
              >
                Temperature
              </Text>
              <Input
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                step={0.01}
                min={0}
                max={2}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Creativity (0.0-2.0)
              </Text>
            </Col>

            <Col xs={24} sm={12}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4 }}
              >
                Top P
              </Text>
              <Input
                type="number"
                value={topP}
                onChange={(e) => setTopP(e.target.value)}
                step={0.01}
                min={0}
                max={1}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Nucleus sampling (0.0-1.0)
              </Text>
            </Col>

            <Col xs={24} sm={12}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4 }}
              >
                Top K
              </Text>
              <Input
                type="number"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
                step={1}
                min={1}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Token selection pool
              </Text>
            </Col>

            <Col xs={24} sm={12}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4 }}
              >
                Max Tokens
              </Text>
              <Input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                step={100}
                min={100}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Maximum response length
              </Text>
            </Col>

            <Col xs={24}>
              <Text
                type="secondary"
                style={{ display: "block", marginBottom: 4 }}
              >
                Context Window (num_ctx)
              </Text>
              <Input
                type="number"
                value={numCtx}
                onChange={(e) => setNumCtx(e.target.value)}
                step={512}
                min={512}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Context window size for the model
              </Text>
            </Col>
          </Row>

          <Alert
            type="info"
            showIcon
            title="Note: These settings are informational only. To change them, update your .env file and restart the application."
            style={{ marginTop: 24 }}
          />
        </Card>
      </div>
    </div>
  );
}

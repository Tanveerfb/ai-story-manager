"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Alert,
  Spin,
  Modal,
  Card,
  Tag,
  Select,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  DeleteOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";

const { Title, Text } = Typography;

interface UnlinkedName {
  name: string;
  usageCount: number;
  contexts: string[];
  suggestedMatches: Array<{ id: string; name: string; score: number }>;
}

export default function UnlinkedCharactersPage() {
  const { token } = antdTheme.useToken();
  const [unlinkedNames, setUnlinkedNames] = useState<UnlinkedName[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<UnlinkedName | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unlinkedRes, charactersRes] = await Promise.all([
        fetch("/api/characters/unlinked"),
        fetch("/api/characters"),
      ]);

      if (unlinkedRes.ok) {
        const unlinkedData = await unlinkedRes.json();
        setUnlinkedNames(unlinkedData);
      }

      if (charactersRes.ok) {
        const charactersData = await charactersRes.json();
        setCharacters(charactersData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load unlinked characters");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (name: UnlinkedName) => {
    setSelectedName(name);
    setSelectedCharacterId(
      name.suggestedMatches.length > 0 ? name.suggestedMatches[0].id : "",
    );
    setLinkDialogOpen(true);
  };

  const handleConfirmLink = async () => {
    if (!selectedName || !selectedCharacterId) return;

    setLinkDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/characters/link-nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: selectedCharacterId,
          alias: selectedName.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to link nickname");
      }

      setSuccess(`Successfully linked "${selectedName.name}" to character`);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteName = async (name: string) => {
    if (!confirm(`Are you sure you want to ignore "${name}"?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/characters/unlinked", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete name");
      }

      setSuccess(`Successfully ignored "${name}"`);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 32, marginBottom: 32 }}>
        <Title level={2}>Missing Character Names</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          These names appear in events or relationships but are not linked to
          any canonical character. Link them to existing characters or ignore
          them.
        </Text>

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "32px 0",
            }}
          >
            <Spin size="large" />
          </div>
        )}

        {error && (
          <Alert
            type="error"
            title={error}
            style={{ marginBottom: 24 }}
            showIcon
          />
        )}

        {success && (
          <Alert
            type="success"
            title={success}
            style={{ marginBottom: 24 }}
            showIcon
          />
        )}

        {!loading && unlinkedNames.length === 0 ? (
          <Alert
            type="success"
            icon={<CheckCircleOutlined />}
            title="All character names are properly linked!"
            showIcon
          />
        ) : (
          <Row gutter={[24, 24]}>
            {unlinkedNames.map((unlinkedName) => (
              <Col xs={24} key={unlinkedName.name}>
                <Card>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <Text strong style={{ fontSize: 16, display: "block" }}>
                        {unlinkedName.name}
                      </Text>
                      <Tag color="blue" style={{ marginTop: 8 }}>
                        {unlinkedName.usageCount} occurrence
                        {unlinkedName.usageCount > 1 ? "s" : ""}
                      </Tag>
                    </div>
                    <div>
                      <Tooltip title="Link to Character">
                        <Button
                          type="text"
                          icon={<LinkOutlined />}
                          style={{ color: token.colorPrimary }}
                          onClick={() => handleLinkClick(unlinkedName)}
                          disabled={loading}
                        />
                      </Tooltip>
                      <Tooltip title="Ignore">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteName(unlinkedName.name)}
                          disabled={loading}
                        />
                      </Tooltip>
                    </div>
                  </div>

                  {unlinkedName.contexts.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Text
                        type="secondary"
                        strong
                        style={{ display: "block", marginBottom: 4 }}
                      >
                        Context Preview:
                      </Text>
                      <Text type="secondary" italic>
                        {unlinkedName.contexts[0].slice(0, 150)}...
                      </Text>
                    </div>
                  )}

                  {unlinkedName.suggestedMatches.length > 0 && (
                    <div>
                      <Text
                        type="secondary"
                        strong
                        style={{ display: "block", marginBottom: 4 }}
                      >
                        Suggested Matches:
                      </Text>
                      <div
                        style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
                      >
                        {unlinkedName.suggestedMatches.map((match) => (
                          <Tag key={match.id} color="purple">
                            {match.name} ({(match.score * 100).toFixed(0)}%)
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Link Dialog */}
      <Modal
        title="Link Name to Character"
        open={linkDialogOpen}
        onCancel={() => setLinkDialogOpen(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setLinkDialogOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="link"
            type="primary"
            onClick={handleConfirmLink}
            disabled={!selectedCharacterId}
          >
            Link
          </Button>,
        ]}
      >
        <div style={{ marginTop: 16 }}>
          <Text style={{ display: "block", marginBottom: 8 }}>
            Link &quot;{selectedName?.name}&quot; to:
          </Text>
          <Select
            style={{ width: "100%", marginTop: 16 }}
            placeholder="Select Character"
            value={selectedCharacterId || undefined}
            onChange={(value) => setSelectedCharacterId(value)}
            options={characters.map((char) => ({
              value: char.id,
              label: `${char.name} (${char.role})`,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
}

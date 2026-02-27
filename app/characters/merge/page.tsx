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
  Input,
  Checkbox,
  Avatar,
  Row,
  Col,
  theme as antdTheme,
} from "antd";
import { useRouter } from "next/navigation";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";

const { Title, Text } = Typography;

interface Character {
  id: string;
  name: string;
  role: string;
  description?: string;
  personality?: string;
  avatar_url?: string;
}

export default function MergeCharactersPage() {
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    let filtered = characters;

    if (searchTerm) {
      filtered = filtered.filter((char) =>
        char.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredCharacters(filtered);
  }, [characters, searchTerm]);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
        setFilteredCharacters(data);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // If deselecting the primary, clear primary
        if (id === primaryId) {
          setPrimaryId(null);
        }
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        const next = [...prev, id];
        // Auto-set as primary if it's the first selection
        if (next.length === 1) {
          setPrimaryId(id);
        }
        return next;
      }
    });
  };

  const handleSetPrimary = (id: string) => {
    if (selectedIds.includes(id)) {
      setPrimaryId(id);
    }
  };

  const handleMergeClick = () => {
    if (selectedIds.length < 2) {
      setError("Please select at least 2 characters to merge");
      return;
    }

    if (!primaryId) {
      setError("Please set a primary character");
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirmMerge = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const duplicateIds = selectedIds.filter((id) => id !== primaryId);

      const response = await fetch("/api/characters/merge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          primaryCharacterId: primaryId,
          duplicateCharacterIds: duplicateIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Merge failed");
      }

      const result = await response.json();
      setSuccess(result.message);
      setSelectedIds([]);
      setPrimaryId(null);

      // Refresh character list
      await fetchCharacters();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMerge = () => {
    setConfirmDialogOpen(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "main":
        return "blue";
      case "side":
        return "purple";
      default:
        return "default";
    }
  };

  const primaryCharacter = characters.find((c) => c.id === primaryId);
  const duplicateCharacters = characters.filter(
    (c) => selectedIds.includes(c.id) && c.id !== primaryId,
  );

  const canMerge = selectedIds.length >= 2 && primaryId !== null;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 32, marginBottom: 32 }}>
        <Title level={2}>Merge Characters</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Select duplicate characters to merge. Choose one as the primary
          character to keep, and the others will be merged into it and deleted.
        </Text>

        <div style={{ marginBottom: 24 }}>
          <Input
            placeholder="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          {selectedIds.length > 0 && (
            <Card style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 8 }}>
                Selected Characters ({selectedIds.length})
              </Title>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {selectedIds.map((id) => {
                  const char = characters.find((c) => c.id === id);
                  return char ? (
                    <Tag
                      key={id}
                      closable
                      onClose={() => toggleSelection(id)}
                      color={id === primaryId ? "blue" : "default"}
                    >
                      {char.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </Card>
          )}

          <Button
            type="primary"
            size="large"
            block
            onClick={handleMergeClick}
            disabled={!canMerge || loading}
            loading={loading}
            style={{ marginBottom: 16 }}
          >
            {loading ? "Merging..." : "Merge Selected Characters"}
          </Button>
        </div>

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

        {filteredCharacters.length === 0 ? (
          <Text type="secondary">
            No characters found. Import a story to extract characters.
          </Text>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredCharacters.map((character) => {
              const isSelected = selectedIds.includes(character.id);
              const isPrimary = character.id === primaryId;

              return (
                <Col xs={24} sm={12} md={8} key={character.id}>
                  <Card
                    hoverable
                    onClick={() => toggleSelection(character.id)}
                    style={{
                      cursor: "pointer",
                      border: isPrimary
                        ? `3px solid ${token.colorPrimary}`
                        : isSelected
                          ? `2px solid ${token.colorPrimary}`
                          : `1px solid ${sc.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(character.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ marginRight: 8 }}
                      />
                      <Avatar
                        src={character.avatar_url}
                        alt={character.name}
                        size={56}
                        style={{ marginRight: 16 }}
                      >
                        {character.name[0]}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: 16, display: "block" }}>
                          {character.name}
                        </Text>
                        <Tag color={getRoleColor(character.role)}>
                          {character.role}
                        </Tag>
                        {isPrimary && (
                          <Tag color="blue" style={{ marginLeft: 4 }}>
                            PRIMARY
                          </Tag>
                        )}
                      </div>
                    </div>

                    {character.description && (
                      <Text
                        type="secondary"
                        style={{ display: "block", marginBottom: 8 }}
                      >
                        {character.description.slice(0, 100)}
                        {character.description.length > 100 ? "..." : ""}
                      </Text>
                    )}

                    {isSelected && !isPrimary && (
                      <Button
                        size="small"
                        block
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimary(character.id);
                        }}
                      >
                        Set as Primary
                      </Button>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Modal
        title="Confirm Character Merge"
        open={confirmDialogOpen}
        onCancel={handleCancelMerge}
        width={600}
        footer={[
          <Button key="cancel" onClick={handleCancelMerge}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmMerge}>
            Confirm Merge
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          title="This action cannot be undone. The duplicate characters will be permanently deleted."
          style={{ marginBottom: 16 }}
          showIcon
        />

        {primaryCharacter && (
          <Card
            style={{
              marginBottom: 16,
              backgroundColor: sc.successBg,
              borderColor: sc.successBorder,
            }}
          >
            <Text strong style={{ display: "block" }}>
              Primary Character (KEEP)
            </Text>
            <Title level={5} style={{ margin: "4px 0" }}>
              {primaryCharacter.name}
            </Title>
            <Text type="secondary">Role: {primaryCharacter.role}</Text>
          </Card>
        )}

        <Card
          style={{ backgroundColor: sc.errorBg, borderColor: sc.errorBorder }}
        >
          <Text strong style={{ display: "block" }}>
            Characters to Delete ({duplicateCharacters.length})
          </Text>
          {duplicateCharacters.map((char) => (
            <Text key={char.id} style={{ display: "block" }}>
              • {char.name}
            </Text>
          ))}
        </Card>

        <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
          All data from duplicate characters will be merged into the primary
          character, and all relationships will be updated to point to the
          primary character.
        </Text>
      </Modal>
    </div>
  );
}

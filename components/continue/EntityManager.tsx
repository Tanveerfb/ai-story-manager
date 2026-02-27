"use client";

import { useState } from "react";
import {
  Card,
  Typography,
  Input,
  Button,
  Tag,
  Modal,
  Tooltip,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * Entity Manager Component - Character Management
 * Allows live creation, editing, and deletion of characters
 * Supports auto-suggestions from existing characters
 */

interface Character {
  id: string;
  name: string;
  role?: string;
  personality?: string;
  traits?: string[];
  description?: string;
}

interface EntityManagerProps {
  characters: Character[];
  onCharactersChange: () => void;
}

export default function EntityManager({
  characters,
  onCharactersChange,
}: EntityManagerProps) {
  const { token } = antdTheme.useToken();
  const { mode } = useThemeMode();
  const sc = getSemanticColors(mode === "dark");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null,
  );
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    role: "side",
    personality: "",
    traits: [] as string[],
    description: "",
  });
  const [traitsInput, setTraitsInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Opens dialog for creating a new character
   */
  const handleOpenCreate = () => {
    setEditingCharacter(null);
    setNewCharacter({
      name: "",
      role: "side",
      personality: "",
      traits: [],
      description: "",
    });
    setTraitsInput("");
    setDialogOpen(true);
  };

  /**
   * Opens dialog for editing an existing character
   */
  const handleOpenEdit = (character: Character) => {
    setEditingCharacter(character);
    setNewCharacter({
      name: character.name,
      role: character.role || "side",
      personality: character.personality || "",
      traits: character.traits || [],
      description: character.description || "",
    });
    setTraitsInput((character.traits || []).join(", "));
    setDialogOpen(true);
  };

  /**
   * Closes the create/edit dialog
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCharacter(null);
    setError(null);
  };

  /**
   * Saves a new character or updates an existing one
   */
  const handleSaveCharacter = async () => {
    if (!newCharacter.name.trim()) {
      setError("Character name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse traits from comma-separated string
      const traits = traitsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const characterData = {
        ...newCharacter,
        traits,
      };

      const url = editingCharacter
        ? `/api/characters/${editingCharacter.id}`
        : "/api/characters";

      const method = editingCharacter ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        throw new Error("Failed to save character");
      }

      handleCloseDialog();
      onCharactersChange();
    } catch (err: any) {
      setError(err.message || "Failed to save character");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a character
   */
  const handleDeleteCharacter = async (characterId: string) => {
    if (!confirm("Are you sure you want to delete this character?")) {
      return;
    }

    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete character");
      }

      onCharactersChange();
    } catch (err: any) {
      console.error("Failed to delete character:", err);
    }
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <UserOutlined style={{ color: "#1890ff", fontSize: 18 }} />
          <Title level={5} style={{ margin: 0 }}>
            Characters
          </Title>
        </div>
        <Tooltip title="Create new character">
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Add
          </Button>
        </Tooltip>
      </div>

      {characters.length === 0 ? (
        <Text
          type="secondary"
          style={{ display: "block", padding: "16px 0", textAlign: "center" }}
        >
          No characters yet. Create your first character to get started!
        </Text>
      ) : (
        <div>
          {characters.slice(0, 5).map((character) => (
            <div
              key={character.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 0",
                borderBottom: `1px solid ${sc.border}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Text strong style={{ fontSize: 14 }}>
                    {character.name}
                  </Text>
                  {character.role && <Tag>{character.role}</Tag>}
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {character.personality || "No description"}
                </Text>
              </div>
              <Tooltip title="Edit character">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEdit(character)}
                />
              </Tooltip>
              <Tooltip title="Delete character">
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteCharacter(character.id)}
                />
              </Tooltip>
            </div>
          ))}
        </div>
      )}

      {characters.length > 5 && (
        <Text
          type="secondary"
          style={{
            marginTop: 8,
            display: "block",
            textAlign: "center",
            fontSize: 12,
          }}
        >
          Showing 5 of {characters.length} characters
        </Text>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={dialogOpen}
        onCancel={handleCloseDialog}
        title={editingCharacter ? "Edit Character" : "Create New Character"}
        width={560}
        footer={[
          <Button key="cancel" onClick={handleCloseDialog}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveCharacter}
            disabled={loading || !newCharacter.name.trim()}
            loading={loading}
          >
            Save
          </Button>,
        ]}
      >
        {error && (
          <Text type="danger" style={{ display: "block", marginBottom: 16 }}>
            {error}
          </Text>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Character Name *
          </label>
          <Input
            value={newCharacter.name}
            onChange={(e) =>
              setNewCharacter({ ...newCharacter, name: e.target.value })
            }
            placeholder="Character Name"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Role</label>
          <Select
            style={{ width: "100%" }}
            value={newCharacter.role}
            onChange={(value) =>
              setNewCharacter({ ...newCharacter, role: value })
            }
            options={[
              { value: "main", label: "Main Character" },
              { value: "side", label: "Side Character" },
              { value: "minor", label: "Minor Character" },
            ]}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Personality
          </label>
          <TextArea
            value={newCharacter.personality}
            onChange={(e) =>
              setNewCharacter({ ...newCharacter, personality: e.target.value })
            }
            rows={2}
            placeholder="Brief personality description..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Traits (comma-separated)
          </label>
          <Input
            value={traitsInput}
            onChange={(e) => setTraitsInput(e.target.value)}
            placeholder="brave, intelligent, stubborn"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Enter character traits separated by commas
          </Text>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Physical Description
          </label>
          <TextArea
            value={newCharacter.description}
            onChange={(e) =>
              setNewCharacter({ ...newCharacter, description: e.target.value })
            }
            rows={2}
            placeholder="Physical appearance..."
          />
        </div>
      </Modal>
    </Card>
  );
}

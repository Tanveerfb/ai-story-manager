"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Select,
  Button,
  Modal,
  Input,
  Typography,
  Tag,
  Tooltip,
  Skeleton,
} from "antd";
import {
  PlusOutlined,
  GlobalOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";

const { Text } = Typography;
const { TextArea } = Input;

interface World {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  created_at?: string;
}

interface WorldSwitcherProps {
  currentWorldId: string | null;
  onWorldChange: (worldId: string, worldName: string) => void;
}

const WORLD_STORAGE_KEY = "ai_story_manager_world_id";

export default function WorldSwitcher({
  currentWorldId,
  onWorldChange,
}: WorldSwitcherProps) {
  const { token } = antdTheme.useToken();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchWorlds = useCallback(async () => {
    const res = await fetch("/api/worlds");
    if (res.ok) {
      const data: World[] = await res.json();
      setWorlds(data);
      return data;
    }
    return [];
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchWorlds();
      // Auto-select: use stored preference, or first world
      if (!currentWorldId && data.length > 0) {
        const stored = localStorage.getItem(WORLD_STORAGE_KEY);
        const match = data.find((w) => w.id === stored) || data[0];
        onWorldChange(match.id, match.name);
      }
      setLoading(false);
    })();
  }, []);

  const handleSelect = (id: string) => {
    const world = worlds.find((w) => w.id === id);
    if (world) {
      localStorage.setItem(WORLD_STORAGE_KEY, id);
      onWorldChange(id, world.name);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/worlds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        description: newDescription,
        genre: newGenre,
      }),
    });
    if (res.ok) {
      const world: World = await res.json();
      const updated = await fetchWorlds();
      localStorage.setItem(WORLD_STORAGE_KEY, world.id);
      onWorldChange(world.id, world.name);
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      setNewGenre("");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/worlds?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      const updated = await fetchWorlds();
      setDeleteConfirmId(null);
      // If deleted world was selected, switch to first available
      if (currentWorldId === id && updated.length > 0) {
        localStorage.setItem(WORLD_STORAGE_KEY, updated[0].id);
        onWorldChange(updated[0].id, updated[0].name);
      }
    }
  };

  const currentWorld = worlds.find((w) => w.id === currentWorldId);

  if (loading) {
    return <Skeleton.Input active style={{ width: 260, height: 40 }} />;
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <GlobalOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />

      {worlds.length === 0 ? (
        <Text type="secondary">No worlds yet</Text>
      ) : (
        <Select
          value={currentWorldId || undefined}
          placeholder="Story World"
          onChange={handleSelect}
          style={{ minWidth: 200 }}
          size="small"
          options={worlds.map((w) => ({
            value: w.id,
            label: (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                }}
              >
                <span style={{ flexGrow: 1 }}>{w.name}</span>
                {w.genre && <Tag style={{ marginRight: 0 }}>{w.genre}</Tag>}
              </div>
            ),
          }))}
        />
      )}

      <Tooltip title="Create new story world">
        <Button
          size="small"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          New World
        </Button>
      </Tooltip>

      {currentWorldId && worlds.length > 1 && (
        <Tooltip title="Delete current world">
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => setDeleteConfirmId(currentWorldId)}
          />
        </Tooltip>
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        title="Create Story World"
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="create"
            type="primary"
            onClick={handleCreate}
            disabled={!newName.trim() || saving}
            loading={saving}
          >
            {saving ? "Creating..." : "Create World"}
          </Button>,
        ]}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 16,
          }}
        >
          <div>
            <Text strong>World Name *</Text>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. The Shattered Realm, Neo-Tokyo 2087"
              autoFocus
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text strong>Genre</Text>
            <Input
              value={newGenre}
              onChange={(e) => setNewGenre(e.target.value)}
              placeholder="e.g. Dark Fantasy, Sci-Fi Noir, Historical Fiction"
              style={{ marginTop: 4 }}
            />
          </div>
          <div>
            <Text strong>Description</Text>
            <TextArea
              rows={3}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Describe the tone, setting, rules, and core premise of this world..."
              style={{ marginTop: 4 }}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteConfirmId}
        onCancel={() => setDeleteConfirmId(null)}
        title="Delete World?"
        width={400}
        footer={[
          <Button key="cancel" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete
          </Button>,
        ]}
      >
        <Text>
          This will permanently delete <strong>{currentWorld?.name}</strong> and
          cannot be undone. All story data linked to this world will be
          orphaned.
        </Text>
      </Modal>
    </div>
  );
}

export { WORLD_STORAGE_KEY };

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Button,
  Tag,
  Modal,
  Select,
  Alert,
  Card,
  Tooltip,
  Input,
  InputNumber,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useWorld } from "@/components/WorldProvider";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ScenePlan {
  id: string;
  world_id: string;
  title: string;
  description: string;
  characters: string[];
  location: string;
  objectives: string;
  mood: string;
  status: string;
  sort_order: number;
  target_part: number | null;
  target_chapter: number | null;
  notes: string;
}

const COLUMNS = [
  { key: "planned", label: "Planned", color: "#1976d2" },
  { key: "in-progress", label: "In Progress", color: "#ed6c02" },
  { key: "written", label: "Written", color: "#2e7d32" },
  { key: "cut", label: "Cut", color: "#9e9e9e" },
];

const MOODS = [
  "dark",
  "lighthearted",
  "tense",
  "romantic",
  "action",
  "mysterious",
  "melancholic",
  "comedic",
  "dramatic",
  "peaceful",
];

const emptyScene: Partial<ScenePlan> = {
  title: "",
  description: "",
  characters: [],
  location: "",
  objectives: "",
  mood: "",
  status: "planned",
  target_part: null,
  target_chapter: null,
  notes: "",
};

export default function ScenesPage() {
  const { worldId } = useWorld();
  const [scenes, setScenes] = useState<ScenePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editScene, setEditScene] = useState<Partial<ScenePlan>>(emptyScene);
  const [charInput, setCharInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchScenes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (worldId) params.set("world_id", worldId);
      const res = await fetch(`/api/scenes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch scenes");
      const data = await res.json();
      setScenes(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [worldId]);

  useEffect(() => {
    fetchScenes();
  }, [fetchScenes]);

  const handleSave = async () => {
    try {
      const body = { ...editScene };
      if (!body.id) body.world_id = worldId || undefined;

      const method = body.id ? "PUT" : "POST";
      const res = await fetch("/api/scenes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to save scene");
      setDialogOpen(false);
      setEditScene(emptyScene);
      setSuccess(body.id ? "Scene updated" : "Scene created");
      fetchScenes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scene plan?")) return;
    try {
      const res = await fetch(`/api/scenes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchScenes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const moveScene = async (scene: ScenePlan, direction: "forward" | "back") => {
    const colIdx = COLUMNS.findIndex((c) => c.key === scene.status);
    const newIdx = direction === "forward" ? colIdx + 1 : colIdx - 1;
    if (newIdx < 0 || newIdx >= COLUMNS.length) return;
    try {
      const res = await fetch("/api/scenes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scene.id, status: COLUMNS[newIdx].key }),
      });
      if (!res.ok) throw new Error("Failed to move scene");
      fetchScenes();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEdit = (scene?: ScenePlan) => {
    setEditScene(scene ? { ...scene } : { ...emptyScene });
    setCharInput("");
    setDialogOpen(true);
  };

  const addCharToScene = () => {
    const name = charInput.trim();
    if (!name) return;
    const current = editScene.characters || [];
    if (!current.includes(name)) {
      setEditScene({ ...editScene, characters: [...current, name] });
    }
    setCharInput("");
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Scene Planner
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openEdit()}
        >
          New Scene
        </Button>
      </div>

      {error && (
        <Alert
          type="error"
          title={error}
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 16 }}
        />
      )}
      {success && (
        <Alert
          type="success"
          title={success}
          closable
          onClose={() => setSuccess(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 16,
            minHeight: 400,
          }}
        >
          {COLUMNS.map((col) => {
            const colScenes = scenes.filter((s) => s.status === col.key);
            return (
              <Card
                key={col.key}
                style={{
                  flex: "1 0 260px",
                  minWidth: 260,
                  maxWidth: 360,
                  display: "flex",
                  flexDirection: "column",
                }}
                styles={{
                  body: {
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  },
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: col.color,
                    }}
                  />
                  <Title level={5} style={{ flex: 1, margin: 0 }}>
                    {col.label}
                  </Title>
                  <Tag>{colScenes.length}</Tag>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flex: 1,
                    overflowY: "auto",
                  }}
                >
                  {colScenes.map((scene) => (
                    <Card
                      key={scene.id}
                      size="small"
                      hoverable
                      style={{ borderColor: undefined }}
                      styles={{
                        body: { paddingBottom: 8 },
                      }}
                      actions={[
                        <div
                          key="actions"
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "0 8px",
                          }}
                        >
                          <div>
                            <Tooltip title="Move back">
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => moveScene(scene, "back")}
                                disabled={col.key === COLUMNS[0].key}
                              />
                            </Tooltip>
                            <Tooltip title="Move forward">
                              <Button
                                type="text"
                                size="small"
                                icon={<ArrowRightOutlined />}
                                onClick={() => moveScene(scene, "forward")}
                                disabled={
                                  col.key === COLUMNS[COLUMNS.length - 1].key
                                }
                              />
                            </Tooltip>
                          </div>
                          <div>
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => openEdit(scene)}
                            />
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDelete(scene.id)}
                            />
                          </div>
                        </div>,
                      ]}
                    >
                      <Text
                        strong
                        style={{ display: "block", marginBottom: 4 }}
                      >
                        {scene.title}
                      </Text>
                      {scene.description && (
                        <Text
                          type="secondary"
                          style={{
                            display: "block",
                            fontSize: 13,
                            marginBottom: 8,
                          }}
                        >
                          {scene.description.length > 120
                            ? scene.description.slice(0, 120) + "..."
                            : scene.description}
                        </Text>
                      )}
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
                      >
                        {scene.mood && <Tag>{scene.mood}</Tag>}
                        {scene.location && (
                          <Tag color="blue">{scene.location}</Tag>
                        )}
                        {(scene.characters || []).map((c) => (
                          <Tag key={c} color="purple">
                            {c}
                          </Tag>
                        ))}
                      </div>
                      {scene.target_part && (
                        <Text
                          type="secondary"
                          style={{
                            display: "block",
                            fontSize: 12,
                            marginTop: 4,
                          }}
                        >
                          Target: Part {scene.target_part}
                          {scene.target_chapter
                            ? `, Ch. ${scene.target_chapter}`
                            : ""}
                        </Text>
                      )}
                    </Card>
                  ))}
                  {colScenes.length === 0 && (
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        textAlign: "center",
                        marginTop: 32,
                        opacity: 0.5,
                      }}
                    >
                      No scenes
                    </Text>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Scene Dialog */}
      <Modal
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        title={editScene.id ? "Edit Scene" : "New Scene Plan"}
        width={600}
        okText={editScene.id ? "Update" : "Create"}
        onOk={handleSave}
        okButtonProps={{ disabled: !editScene.title?.trim() }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            paddingTop: 8,
          }}
        >
          <div>
            <Text style={{ display: "block", marginBottom: 4 }}>Title</Text>
            <Input
              value={editScene.title || ""}
              onChange={(e) =>
                setEditScene({ ...editScene, title: e.target.value })
              }
            />
          </div>
          <div>
            <Text style={{ display: "block", marginBottom: 4 }}>
              Description
            </Text>
            <TextArea
              rows={2}
              value={editScene.description || ""}
              onChange={(e) =>
                setEditScene({ ...editScene, description: e.target.value })
              }
            />
          </div>
          <div>
            <Text style={{ display: "block", marginBottom: 4 }}>
              Scene Objectives
            </Text>
            <TextArea
              rows={2}
              value={editScene.objectives || ""}
              onChange={(e) =>
                setEditScene({ ...editScene, objectives: e.target.value })
              }
              placeholder="What should happen in this scene? Key plot points, reveals, etc."
            />
          </div>
          <div>
            <Text style={{ display: "block", marginBottom: 4 }}>Location</Text>
            <Input
              value={editScene.location || ""}
              onChange={(e) =>
                setEditScene({ ...editScene, location: e.target.value })
              }
            />
          </div>
          <div>
            <Text style={{ display: "block", marginBottom: 4 }}>Mood</Text>
            <Select
              style={{ width: "100%" }}
              value={editScene.mood || undefined}
              onChange={(value) =>
                setEditScene({ ...editScene, mood: value || "" })
              }
              allowClear
              placeholder="Select mood"
              options={MOODS.map((m) => ({ label: m, value: m }))}
            />
          </div>

          {/* Characters */}
          <div>
            <Text style={{ display: "block", marginBottom: 4 }}>
              Characters in Scene
            </Text>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 8,
              }}
            >
              {(editScene.characters || []).map((c, i) => (
                <Tag
                  key={i}
                  closable
                  onClose={() =>
                    setEditScene({
                      ...editScene,
                      characters: (editScene.characters || []).filter(
                        (_, idx) => idx !== i,
                      ),
                    })
                  }
                >
                  {c}
                </Tag>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                size="small"
                value={charInput}
                onChange={(e) => setCharInput(e.target.value)}
                placeholder="Character name"
                onKeyDown={(e) => e.key === "Enter" && addCharToScene()}
                style={{ flex: 1 }}
              />
              <Button size="small" onClick={addCharToScene}>
                Add
              </Button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Text style={{ display: "block", marginBottom: 4 }}>
                Target Part
              </Text>
              <InputNumber
                style={{ width: "100%" }}
                value={editScene.target_part}
                onChange={(value) =>
                  setEditScene({
                    ...editScene,
                    target_part: value ?? null,
                  })
                }
              />
            </div>
            <div style={{ flex: 1 }}>
              <Text style={{ display: "block", marginBottom: 4 }}>
                Target Chapter
              </Text>
              <InputNumber
                style={{ width: "100%" }}
                value={editScene.target_chapter}
                onChange={(value) =>
                  setEditScene({
                    ...editScene,
                    target_chapter: value ?? null,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Text style={{ display: "block", marginBottom: 4 }}>Notes</Text>
            <TextArea
              rows={2}
              value={editScene.notes || ""}
              onChange={(e) =>
                setEditScene({ ...editScene, notes: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

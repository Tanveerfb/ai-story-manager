"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Alert,
  Card,
  CardContent,
  CardActions,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useWorld } from "@/components/WorldProvider";

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Scene Planner</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openEdit()}
        >
          New Scene
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(null)}
        >
          {success}
        </Alert>
      )}

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 2,
            minHeight: 400,
          }}
        >
          {COLUMNS.map((col) => {
            const colScenes = scenes.filter((s) => s.status === col.key);
            return (
              <Paper
                key={col.key}
                sx={{
                  flex: "1 0 260px",
                  minWidth: 260,
                  maxWidth: 360,
                  p: 2,
                  bgcolor: "background.default",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      bgcolor: col.color,
                    }}
                  />
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    {col.label}
                  </Typography>
                  <Chip label={colScenes.length} size="small" />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1.5,
                    flex: 1,
                    overflowY: "auto",
                  }}
                >
                  {colScenes.map((scene) => (
                    <Card
                      key={scene.id}
                      variant="outlined"
                      sx={{ "&:hover": { borderColor: col.color } }}
                    >
                      <CardContent sx={{ pb: 1 }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="bold"
                          gutterBottom
                        >
                          {scene.title}
                        </Typography>
                        {scene.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {scene.description.length > 120
                              ? scene.description.slice(0, 120) + "..."
                              : scene.description}
                          </Typography>
                        )}
                        {scene.mood && (
                          <Chip
                            label={scene.mood}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )}
                        {scene.location && (
                          <Chip
                            label={scene.location}
                            size="small"
                            color="info"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        )}
                        {(scene.characters || []).map((c) => (
                          <Chip
                            key={c}
                            label={c}
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                        {scene.target_part && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Target: Part {scene.target_part}
                            {scene.target_chapter
                              ? `, Ch. ${scene.target_chapter}`
                              : ""}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions
                        sx={{ justifyContent: "space-between", px: 1, pt: 0 }}
                      >
                        <Box>
                          <Tooltip title="Move back">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveScene(scene, "back")}
                                disabled={col.key === COLUMNS[0].key}
                              >
                                <ArrowBackIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Move forward">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => moveScene(scene, "forward")}
                                disabled={
                                  col.key === COLUMNS[COLUMNS.length - 1].key
                                }
                              >
                                <ArrowForwardIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => openEdit(scene)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(scene.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardActions>
                    </Card>
                  ))}
                  {colScenes.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      textAlign="center"
                      sx={{ mt: 4, opacity: 0.5 }}
                    >
                      No scenes
                    </Typography>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {/* Scene Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editScene.id ? "Edit Scene" : "New Scene Plan"}
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: "16px !important",
          }}
        >
          <TextField
            label="Title"
            fullWidth
            value={editScene.title || ""}
            onChange={(e) =>
              setEditScene({ ...editScene, title: e.target.value })
            }
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            minRows={2}
            value={editScene.description || ""}
            onChange={(e) =>
              setEditScene({ ...editScene, description: e.target.value })
            }
          />
          <TextField
            label="Scene Objectives"
            fullWidth
            multiline
            minRows={2}
            value={editScene.objectives || ""}
            onChange={(e) =>
              setEditScene({ ...editScene, objectives: e.target.value })
            }
            placeholder="What should happen in this scene? Key plot points, reveals, etc."
          />
          <TextField
            label="Location"
            fullWidth
            value={editScene.location || ""}
            onChange={(e) =>
              setEditScene({ ...editScene, location: e.target.value })
            }
          />
          <FormControl fullWidth>
            <InputLabel>Mood</InputLabel>
            <Select
              value={editScene.mood || ""}
              label="Mood"
              onChange={(e) =>
                setEditScene({ ...editScene, mood: e.target.value })
              }
            >
              <MenuItem value="">None</MenuItem>
              {MOODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Characters */}
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              Characters in Scene
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
              {(editScene.characters || []).map((c, i) => (
                <Chip
                  key={i}
                  label={c}
                  size="small"
                  onDelete={() =>
                    setEditScene({
                      ...editScene,
                      characters: (editScene.characters || []).filter(
                        (_, idx) => idx !== i,
                      ),
                    })
                  }
                />
              ))}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                value={charInput}
                onChange={(e) => setCharInput(e.target.value)}
                placeholder="Character name"
                onKeyDown={(e) => e.key === "Enter" && addCharToScene()}
                sx={{ flex: 1 }}
              />
              <Button size="small" variant="outlined" onClick={addCharToScene}>
                Add
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Target Part"
              type="number"
              value={editScene.target_part ?? ""}
              onChange={(e) =>
                setEditScene({
                  ...editScene,
                  target_part: e.target.value ? Number(e.target.value) : null,
                })
              }
              sx={{ flex: 1 }}
            />
            <TextField
              label="Target Chapter"
              type="number"
              value={editScene.target_chapter ?? ""}
              onChange={(e) =>
                setEditScene({
                  ...editScene,
                  target_chapter: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              sx={{ flex: 1 }}
            />
          </Box>

          <TextField
            label="Notes"
            fullWidth
            multiline
            minRows={2}
            value={editScene.notes || ""}
            onChange={(e) =>
              setEditScene({ ...editScene, notes: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!editScene.title?.trim()}
          >
            {editScene.id ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

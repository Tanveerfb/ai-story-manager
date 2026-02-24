"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PublicIcon from "@mui/icons-material/Public";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

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
    return <Skeleton variant="rounded" width={260} height={40} />;
  }

  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}
    >
      <PublicIcon color="primary" fontSize="small" />

      {worlds.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No worlds yet
        </Typography>
      ) : (
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Story World</InputLabel>
          <Select
            value={currentWorldId || ""}
            label="Story World"
            onChange={(e) => handleSelect(e.target.value)}
          >
            {worlds.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                  }}
                >
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {w.name}
                  </Typography>
                  {w.genre && (
                    <Chip label={w.genre} size="small" variant="outlined" />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Tooltip title="Create new story world">
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
          variant="outlined"
        >
          New World
        </Button>
      </Tooltip>

      {currentWorldId && worlds.length > 1 && (
        <Tooltip title="Delete current world">
          <IconButton
            size="small"
            color="error"
            onClick={() => setDeleteConfirmId(currentWorldId)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Story World</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="World Name *"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
            placeholder="e.g. The Shattered Realm, Neo-Tokyo 2087"
            autoFocus
          />
          <TextField
            fullWidth
            label="Genre"
            value={newGenre}
            onChange={(e) => setNewGenre(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="e.g. Dark Fantasy, Sci-Fi Noir, Historical Fiction"
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Describe the tone, setting, rules, and core premise of this world..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newName.trim() || saving}
          >
            {saving ? "Creating..." : "Create World"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete World?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete <strong>{currentWorld?.name}</strong>{" "}
            and cannot be undone. All story data linked to this world will be
            orphaned.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export { WORLD_STORAGE_KEY };

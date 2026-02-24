"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { m: { xs: 1, sm: 2 } } }}
    >
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoFixHighIcon color="primary" />
          <Box>
            <Typography variant="h6">AI Character Builder</Typography>
            <Typography variant="caption" color="text.secondary">
              {character?.name}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Tell the AI one specific thing about this character. It will update
          only the relevant profile fields — nothing else.
        </Typography>

        {/* Quick prompt suggestions */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
          {QUICK_PROMPTS.map((p) => (
            <Chip
              key={p}
              label={p}
              size="small"
              variant="outlined"
              clickable
              onClick={() => setInstruction(p)}
              sx={{ fontSize: "0.7rem" }}
            />
          ))}
        </Box>

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Your instruction"
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
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Show what was updated */}
        {pendingUpdates && Object.keys(pendingUpdates).length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <CheckIcon fontSize="small" color="success" />
              Updated fields (saved automatically):
            </Typography>
            {Object.entries(pendingUpdates).map(([field, value]) => (
              <Paper
                key={field}
                variant="outlined"
                sx={{ p: 1.5, mb: 1, bgcolor: "action.hover" }}
              >
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ fontWeight: 600, display: "block", mb: 0.5 }}
                >
                  {FIELD_LABELS[field] || field}
                </Typography>
                <Typography variant="body2">{value}</Typography>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          {saved ? "Close" : "Cancel"}
        </Button>
        <Button
          variant="contained"
          onClick={handleRefine}
          disabled={loading || !instruction.trim()}
          startIcon={
            loading ? <CircularProgress size={16} /> : <AutoFixHighIcon />
          }
        >
          {loading ? "Refining..." : "Refine with AI"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

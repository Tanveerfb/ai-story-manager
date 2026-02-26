"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import { useRouter } from "next/navigation";
import { useWorld } from "@/components/WorldProvider";

export default function StoryPage() {
  const { worldId } = useWorld();
  const [storyParts, setStoryParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    part_number: number;
    chapter_number?: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStoryParts();
  }, [worldId]);

  const fetchStoryParts = async () => {
    try {
      const response = await fetch(
        `/api/story-parts${worldId ? `?world_id=${worldId}` : ""}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStoryParts(data);
      }
    } catch (error) {
      console.error("Failed to fetch story parts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/story-parts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setStoryParts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error("Failed to delete story part:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const startEditing = (chapter: any) => {
    setEditingId(chapter.id);
    setEditTitle(chapter.title || "");
    setEditContent(chapter.content || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/story-parts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (response.ok) {
        const updated = await response.json();
        setStoryParts((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p)),
        );
        setSuccess("Chapter saved.");
        cancelEditing();
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const filteredParts = storyParts.filter(
    (part) =>
      part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const groupedParts = useMemo(() => {
    const groups: Record<number, any[]> = {};
    for (const part of filteredParts) {
      const pn = part.part_number;
      if (!groups[pn]) groups[pn] = [];
      groups[pn].push(part);
    }
    for (const pn of Object.keys(groups)) {
      groups[Number(pn)].sort(
        (a: any, b: any) => (a.chapter_number || 1) - (b.chapter_number || 1),
      );
    }
    return groups;
  }, [filteredParts]);

  const sortedPartNumbers = useMemo(
    () =>
      Object.keys(groupedParts)
        .map(Number)
        .sort((a, b) => a - b),
    [groupedParts],
  );

  const totalWords = storyParts.reduce(
    (sum, p) => sum + (p.word_count || 0),
    0,
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: { xs: 2, sm: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
            >
              Story Viewer
            </Typography>
            {storyParts.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {sortedPartNumbers.length} part
                {sortedPartNumbers.length !== 1 ? "s" : ""} &middot;{" "}
                {storyParts.length} chapter
                {storyParts.length !== 1 ? "s" : ""} &middot;{" "}
                {totalWords.toLocaleString()} words
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const params = new URLSearchParams({ format: "markdown" });
                if (worldId) params.set("world_id", worldId);
                window.open(`/api/export?${params}`, "_blank");
              }}
            >
              Export MD
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const params = new URLSearchParams({ format: "text" });
                if (worldId) params.set("world_id", worldId);
                window.open(`/api/export?${params}`, "_blank");
              }}
            >
              Export TXT
            </Button>
            <Button
              variant="contained"
              onClick={() => router.push("/continue")}
            >
              Continue Story
            </Button>
          </Box>
        </Box>

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Typography>Loading...</Typography>
        ) : sortedPartNumbers.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              No story parts found. Go to Continue Story to start writing.
            </Typography>
          </Paper>
        ) : (
          sortedPartNumbers.map((partNum) => {
            const chapters = groupedParts[partNum];
            const partWordCount = chapters.reduce(
              (sum: number, ch: any) => sum + (ch.word_count || 0),
              0,
            );

            return (
              <Paper key={partNum} sx={{ mb: 3, overflow: "hidden" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 3,
                    py: 2,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  }}
                >
                  <MenuBookIcon />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Part {partNum}
                  </Typography>
                  <Chip
                    label={`${chapters.length} ch.`}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "inherit",
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{ ml: "auto", opacity: 0.85 }}
                  >
                    {partWordCount.toLocaleString()} words
                  </Typography>
                </Box>

                {chapters.map((chapter: any, idx: number) => {
                  const isEditing = editingId === chapter.id;

                  return (
                    <Accordion
                      key={chapter.id}
                      disableGutters
                      elevation={0}
                      sx={{
                        "&:before": { display: "none" },
                        borderTop: idx > 0 ? "1px solid" : "none",
                        borderColor: "divider",
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                            width: "100%",
                            pr: 1,
                          }}
                        >
                          <Chip
                            label={`Ch. ${chapter.chapter_number || 1}`}
                            color="secondary"
                            size="small"
                            variant="outlined"
                          />
                          <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 600 }}
                          >
                            {chapter.title || "Untitled"}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: { xs: 0, sm: "auto" } }}
                          >
                            {chapter.word_count || 0} words
                          </Typography>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(chapter);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({
                                  id: chapter.id,
                                  title: chapter.title,
                                  part_number: chapter.part_number,
                                  chapter_number: chapter.chapter_number || 1,
                                });
                              }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {isEditing ? (
                          <Box>
                            <TextField
                              fullWidth
                              size="small"
                              label="Title"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              sx={{ mb: 2 }}
                            />
                            <TextField
                              fullWidth
                              multiline
                              minRows={10}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              sx={{
                                mb: 2,
                                "& .MuiInputBase-root": {
                                  fontFamily: "Georgia, serif",
                                  fontSize: "1rem",
                                  lineHeight: 1.8,
                                },
                              }}
                            />
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<SaveIcon />}
                                onClick={handleSave}
                                disabled={saving}
                              >
                                {saving ? "Saving..." : "Save"}
                              </Button>
                              <Button
                                size="small"
                                startIcon={<CloseIcon />}
                                onClick={cancelEditing}
                                disabled={saving}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Box>
                        ) : (
                          <>
                            {chapter.summary && (
                              <Paper
                                sx={{ p: 2, mb: 2, bgcolor: "action.hover" }}
                              >
                                <Typography variant="subtitle2" gutterBottom>
                                  Summary:
                                </Typography>
                                <Typography variant="body2">
                                  {chapter.summary}
                                </Typography>
                              </Paper>
                            )}
                            <Typography
                              variant="body1"
                              sx={{
                                whiteSpace: "pre-wrap",
                                fontFamily: "Georgia, serif",
                                lineHeight: 1.8,
                              }}
                            >
                              {chapter.content}
                            </Typography>
                          </>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  );
                })}
              </Paper>
            );
          })
        )}
      </Box>

      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Chapter?</DialogTitle>
        <DialogContent>
          <Typography>
            Permanently delete{" "}
            <strong>
              Part {deleteTarget?.part_number}, Chapter{" "}
              {deleteTarget?.chapter_number || 1}
              {deleteTarget?.title ? ` — ${deleteTarget.title}` : ""}
            </strong>
            ? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

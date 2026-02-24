"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useRouter } from "next/navigation";

export default function StoryPage() {
  const [storyParts, setStoryParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    part_number: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchStoryParts();
  }, []);

  const fetchStoryParts = async () => {
    try {
      const response = await fetch("/api/story-parts");
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

  const filteredParts = storyParts.filter(
    (part) =>
      part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.content.toLowerCase().includes(searchTerm.toLowerCase()),
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
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
          >
            Story Viewer
          </Typography>
          <Button variant="contained" onClick={() => router.push("/continue")}>
            Continue Story
          </Button>
        </Box>

        <TextField
          fullWidth
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Typography>Loading...</Typography>
        ) : filteredParts.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography color="text.secondary">
              No story parts found. Import a story to get started.
            </Typography>
          </Paper>
        ) : (
          filteredParts.map((part) => (
            <Accordion key={part.id} sx={{ mb: 2 }}>
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
                    label={`Part ${part.part_number}`}
                    color="primary"
                    size="small"
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {part.title || "Untitled"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: { xs: 0, sm: "auto" } }}
                  >
                    {part.word_count} words
                  </Typography>
                  <Tooltip title="Delete this part">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({
                          id: part.id,
                          title: part.title,
                          part_number: part.part_number,
                        });
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {part.summary && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: "action.hover" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Summary:
                    </Typography>
                    <Typography variant="body2">{part.summary}</Typography>
                  </Paper>
                )}
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: "pre-wrap", fontFamily: "Georgia, serif" }}
                >
                  {part.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Story Part?</DialogTitle>
        <DialogContent>
          <Typography>
            Permanently delete{" "}
            <strong>
              Part {deleteTarget?.part_number}
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

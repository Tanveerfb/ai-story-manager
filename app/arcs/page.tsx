"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PersonIcon from "@mui/icons-material/Person";
import { useWorld } from "@/components/WorldProvider";
import { useRouter } from "next/navigation";

interface Appearance {
  part_number: number;
  chapter_number: number;
  title: string;
  mention_count: number;
  snippets: string[];
}

interface ArcData {
  character: {
    id: string;
    name: string;
    role: string;
    arc_notes: string;
    goals: string;
    fears: string;
    motivations: string;
  };
  appearances: Appearance[];
  total_mentions: number;
  chapters_present: number;
  chapters_total: number;
}

export default function ArcsPage() {
  const { worldId } = useWorld();
  const router = useRouter();
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArcs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (worldId) params.set("world_id", worldId);
        const res = await fetch(`/api/character-arcs?${params}`);
        if (!res.ok) throw new Error("Failed to load arcs");
        const data = await res.json();
        setArcs(data.arcs || []);
        setTotalChapters(data.total_chapters || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArcs();
  }, [worldId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Analyzing character arcs...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const roleColor = (role: string) => {
    switch (role) {
      case "protagonist":
        return "primary";
      case "antagonist":
        return "error";
      case "supporting":
        return "secondary";
      case "bg":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Character Arcs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track how each character appears and develops across the story. Click a
        character name to view their full profile.
      </Typography>

      {arcs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography color="text.secondary">
            No characters or chapters found yet. Start writing to see character
            arcs develop.
          </Typography>
        </Paper>
      ) : (
        arcs.map((arc) => {
          const presencePercent =
            totalChapters > 0
              ? Math.round((arc.chapters_present / totalChapters) * 100)
              : 0;

          return (
            <Accordion
              key={arc.character.id}
              defaultExpanded={arc.total_mentions > 0}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    width: "100%",
                  }}
                >
                  <PersonIcon color="action" />
                  <Typography
                    variant="h6"
                    sx={{
                      cursor: "pointer",
                      "&:hover": { textDecoration: "underline" },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/characters/${arc.character.id}`);
                    }}
                  >
                    {arc.character.name}
                  </Typography>
                  <Chip
                    label={arc.character.role || "unassigned"}
                    size="small"
                    color={roleColor(arc.character.role) as any}
                    variant="outlined"
                  />
                  <Box sx={{ flex: 1 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mr: 2 }}
                  >
                    {arc.total_mentions} mentions &middot;{" "}
                    {arc.chapters_present}/{totalChapters} chapters (
                    {presencePercent}%)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {/* Arc Notes & Goals */}
                {(arc.character.arc_notes ||
                  arc.character.goals ||
                  arc.character.motivations) && (
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    {arc.character.arc_notes && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Arc Notes
                        </Typography>
                        <Typography variant="body2">
                          {arc.character.arc_notes}
                        </Typography>
                      </Box>
                    )}
                    {arc.character.goals && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Goals
                        </Typography>
                        <Typography variant="body2">
                          {arc.character.goals}
                        </Typography>
                      </Box>
                    )}
                    {arc.character.motivations && (
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Motivations
                        </Typography>
                        <Typography variant="body2">
                          {arc.character.motivations}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                )}

                {/* Visual Timeline Bar */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                    Presence Timeline
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    {Array.from({ length: totalChapters }, (_, i) => {
                      // Find appearance at this chapter index
                      // Chapters are sorted, map index to part/chapter
                      const appearance = arc.appearances[0]
                        ? arc.appearances.find((a, idx) => {
                            // Use index-based matching since we have sorted data
                            // We need to match against all chapters
                            return false; // placeholder
                          })
                        : null;
                      return null;
                    })}
                  </Box>
                  {/* Simple bar representation */}
                  <Box sx={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
                    {arc.appearances.map((app, i) => (
                      <Tooltip
                        key={i}
                        title={`${app.title}: ${app.mention_count} mentions`}
                      >
                        <Box
                          sx={{
                            height: 24,
                            minWidth: 24,
                            px: 0.5,
                            bgcolor:
                              app.mention_count > 5
                                ? "primary.main"
                                : app.mention_count > 2
                                  ? "primary.light"
                                  : "primary.100",
                            color:
                              app.mention_count > 2 ? "white" : "text.primary",
                            borderRadius: 0.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                          }}
                        >
                          {app.chapter_number}
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                  {arc.appearances.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Chapters where {arc.character.name} appears (darker = more
                      mentions)
                    </Typography>
                  )}
                </Box>

                {/* Appearance List */}
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Chapter Appearances
                </Typography>
                {arc.appearances.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    This character hasn&apos;t appeared in any chapters yet.
                  </Typography>
                ) : (
                  arc.appearances.map((app, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="subtitle2">{app.title}</Typography>
                        <Chip
                          label={`${app.mention_count}x`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                      {app.snippets.slice(0, 2).map((s, j) => (
                        <Typography
                          key={j}
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: 12, mb: 0.5 }}
                        >
                          &ldquo;...{s}...&rdquo;
                        </Typography>
                      ))}
                    </Paper>
                  ))
                )}
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Container>
  );
}

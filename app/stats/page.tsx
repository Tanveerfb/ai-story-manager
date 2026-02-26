"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
  Divider,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import PlaceIcon from "@mui/icons-material/Place";
import CreateIcon from "@mui/icons-material/Create";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useWorld } from "@/components/WorldProvider";

interface Stats {
  overview: {
    totalWords: number;
    totalChapters: number;
    totalParts: number;
    totalCharacters: number;
    totalLocations: number;
    avgWordsPerChapter: number;
  };
  wordsPerPart: { part: number; words: number; chapters: number }[];
  timeline: { date: string; words: number }[];
  characterMentions: { name: string; role: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
  longestChapter: {
    title: string;
    part: number;
    chapter: number;
    words: number;
  } | null;
  shortestChapter: {
    title: string;
    part: number;
    chapter: number;
    words: number;
  } | null;
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Paper sx={{ p: 3, textAlign: "center", height: "100%" }}>
      <Box sx={{ color: color || "primary.main", mb: 1 }}>{icon}</Box>
      <Typography variant="h4" fontWeight="bold">
        {typeof value === "number" ? value.toLocaleString() : value}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

export default function StatsPage() {
  const { worldId } = useWorld();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (worldId) params.set("world_id", worldId);
        const res = await fetch(`/api/stats?${params}`);
        if (!res.ok) throw new Error("Failed to load statistics");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [worldId]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Crunching numbers...</Typography>
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

  if (!stats) return null;

  const {
    overview,
    wordsPerPart,
    timeline,
    characterMentions,
    roleDistribution,
    longestChapter,
    shortestChapter,
  } = stats;
  const maxMentions =
    characterMentions.length > 0 ? characterMentions[0].count : 1;

  // Estimate pages (250 words per page)
  const estimatedPages = Math.round(overview.totalWords / 250);

  // Novel length classification
  const novelClass =
    overview.totalWords < 7500
      ? "Short Story"
      : overview.totalWords < 20000
        ? "Novelette"
        : overview.totalWords < 40000
          ? "Novella"
          : overview.totalWords < 80000
            ? "Novel"
            : "Epic Novel";

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Story Statistics
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<CreateIcon fontSize="large" />}
            label="Total Words"
            value={overview.totalWords}
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<MenuBookIcon fontSize="large" />}
            label="Chapters"
            value={overview.totalChapters}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<BarChartIcon fontSize="large" />}
            label="Parts"
            value={overview.totalParts}
            color="success.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<PersonIcon fontSize="large" />}
            label="Characters"
            value={overview.totalCharacters}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<PlaceIcon fontSize="large" />}
            label="Locations"
            value={overview.totalLocations}
            color="info.main"
          />
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <StatCard
            icon={<CreateIcon fontSize="large" />}
            label="Avg Words/Ch"
            value={overview.avgWordsPerChapter}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Novel classification */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Story Classification
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Chip label={novelClass} color="primary" size="medium" />
          <Typography variant="body2" color="text.secondary">
            ~{estimatedPages} pages (at 250 words/page)
          </Typography>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Words per Part */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Words per Part
            </Typography>
            {wordsPerPart.length === 0 ? (
              <Typography color="text.secondary">No data yet</Typography>
            ) : (
              wordsPerPart.map((p) => {
                const maxWords = Math.max(
                  ...wordsPerPart.map((x) => x.words),
                  1,
                );
                return (
                  <Box key={p.part} sx={{ mb: 2 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        Part {p.part}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {p.words.toLocaleString()} words &middot; {p.chapters}{" "}
                        ch.
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(p.words / maxWords) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                );
              })
            )}
          </Paper>
        </Grid>

        {/* Character Mentions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Character Mentions
            </Typography>
            {characterMentions.length === 0 ? (
              <Typography color="text.secondary">No characters yet</Typography>
            ) : (
              characterMentions.slice(0, 12).map((c) => (
                <Box key={c.name} sx={{ mb: 1.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {c.name}
                      </Typography>
                      <Chip label={c.role} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {c.count} mentions
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(c.count / maxMentions) * 100}
                    color="secondary"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        {/* Role Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Character Roles
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {roleDistribution.map((r) => (
                <Chip
                  key={r.role}
                  label={`${r.role}: ${r.count}`}
                  variant="outlined"
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Chapter Extremes */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Chapter Records
            </Typography>
            {longestChapter && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Longest Chapter
                </Typography>
                <Typography fontWeight="bold">
                  {longestChapter.title ||
                    `Part ${longestChapter.part}, Ch. ${longestChapter.chapter}`}
                </Typography>
                <Typography variant="body2">
                  {longestChapter.words?.toLocaleString()} words
                </Typography>
              </Box>
            )}
            {shortestChapter && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Shortest Chapter
                </Typography>
                <Typography fontWeight="bold">
                  {shortestChapter.title ||
                    `Part ${shortestChapter.part}, Ch. ${shortestChapter.chapter}`}
                </Typography>
                <Typography variant="body2">
                  {shortestChapter.words?.toLocaleString()} words
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Writing Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Writing Timeline
            </Typography>
            {timeline.length === 0 ? (
              <Typography color="text.secondary">No data yet</Typography>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 0.5,
                  height: 120,
                  overflow: "auto",
                }}
              >
                {timeline.map((t) => {
                  const maxW = Math.max(...timeline.map((x) => x.words), 1);
                  const height = Math.max(4, (t.words / maxW) * 100);
                  return (
                    <Box
                      key={t.date}
                      title={`${t.date}: ${t.words.toLocaleString()} words`}
                      sx={{
                        flex: "1 0 20px",
                        maxWidth: 40,
                        height: `${height}%`,
                        bgcolor: "primary.main",
                        borderRadius: "4px 4px 0 0",
                        minWidth: 8,
                        "&:hover": { bgcolor: "primary.dark" },
                      }}
                    />
                  );
                })}
              </Box>
            )}
            {timeline.length > 0 && (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  {timeline[0].date}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {timeline[timeline.length - 1].date}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

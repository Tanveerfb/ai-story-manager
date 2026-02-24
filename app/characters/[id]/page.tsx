"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Grid,
  Button,
  CircularProgress,
  TextField,
  Collapse,
  Alert,
} from "@mui/material";
import BrushIcon from "@mui/icons-material/Brush";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CharacterDetailPage() {
  const params = useParams();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // Portrait generation
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  const handleGeneratePortrait = async () => {
    if (!character) return;
    setPortraitLoading(true);
    setPortraitError(null);
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCharacter((prev: any) => ({ ...prev, avatar_url: data.portrait }));
    } catch (err: any) {
      setPortraitError(err.message || "Failed to generate portrait");
    } finally {
      setPortraitLoading(false);
    }
  };

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchCharacter(id);
    }
  }, [params]);

  const fetchCharacter = async (id: string) => {
    try {
      const response = await fetch(`/api/characters/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCharacter(data);
      }
    } catch (error) {
      console.error("Failed to fetch character:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!character) {
    return <Typography>Character not found</Typography>;
  }

  const personality = character.personality
    ? typeof character.personality === "string"
      ? character.personality
      : character.personality
    : null;

  const physicalTraits = character.physical_traits
    ? typeof character.physical_traits === "string"
      ? JSON.parse(character.physical_traits)
      : character.physical_traits
    : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: { xs: 2, sm: 4 } }}>
        <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs="auto">
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={character.avatar_url}
                  alt={character.name}
                  sx={{
                    width: { xs: 100, sm: 160 },
                    height: { xs: 100, sm: 160 },
                  }}
                >
                  {character.name[0]}
                </Avatar>
              </Box>
            </Grid>
            <Grid item xs>
              <Typography
                variant="h4"
                gutterBottom
                sx={{ fontSize: { xs: "1.4rem", sm: "2.125rem" } }}
              >
                {character.name}
              </Typography>
              <Chip label={character.role} color="primary" sx={{ mb: 2 }} />
              {character.description && (
                <Typography variant="body1" paragraph>
                  {character.description}
                </Typography>
              )}

              {/* Portrait generation */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  alignItems: "center",
                  mt: 1,
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={
                    portraitLoading ? (
                      <CircularProgress size={14} />
                    ) : (
                      <BrushIcon />
                    )
                  }
                  onClick={handleGeneratePortrait}
                  disabled={portraitLoading}
                >
                  {portraitLoading
                    ? "Generating portrait…"
                    : character.avatar_url
                      ? "Regenerate Portrait"
                      : "Generate Portrait"}
                </Button>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowCustomPrompt((v) => !v)}
                >
                  {showCustomPrompt ? "Hide custom prompt" : "Custom prompt"}
                </Button>
              </Box>
              <Collapse in={showCustomPrompt}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="e.g. long silver hair, red eyes, school uniform, confident pose"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  sx={{ mt: 1, maxWidth: 480 }}
                  helperText="Override the auto-generated prompt with your own SD description"
                />
              </Collapse>
              {portraitError && (
                <Alert
                  severity="error"
                  sx={{ mt: 1 }}
                  onClose={() => setPortraitError(null)}
                >
                  {portraitError}
                </Alert>
              )}
            </Grid>
          </Grid>
        </Paper>

        <Paper>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Overview" />
            <Tab label="Traits" />
            <Tab label="Behavior" />
            <Tab label="Relationships" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Background
            </Typography>
            <Typography paragraph>
              {character.background || "No background information available."}
            </Typography>

            {character.first_appearance_part && (
              <Typography variant="body2" color="text.secondary">
                First appeared in Part {character.first_appearance_part}
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Personality
            </Typography>
            <Box sx={{ mb: 3 }}>
              {personality ? (
                <Typography paragraph>{personality}</Typography>
              ) : (
                <Typography color="text.secondary">
                  No personality information recorded.
                </Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Physical Traits
            </Typography>
            <Box>
              {Array.isArray(physicalTraits) && physicalTraits.length > 0 ? (
                physicalTraits.map((trait: any, index: number) => (
                  <Chip
                    key={index}
                    label={
                      typeof trait === "string" ? trait : trait.name || trait
                    }
                    color="secondary"
                    sx={{ m: 0.5 }}
                  />
                ))
              ) : (
                <Typography color="text.secondary">
                  No physical traits recorded.
                </Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {[
              { label: "Behavior & Reactions", key: "behavior_notes" },
              { label: "Speech Style", key: "speech_patterns" },
              { label: "Fears", key: "fears" },
              { label: "Motivations", key: "motivations" },
              { label: "Relationships Summary", key: "relationships_summary" },
              { label: "Story Arc Notes", key: "arc_notes" },
            ].map(({ label, key }) => (
              <Box key={key} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {label}
                </Typography>
                {character[key] ? (
                  <Typography paragraph>{character[key]}</Typography>
                ) : (
                  <Typography color="text.secondary">Not recorded.</Typography>
                )}
              </Box>
            ))}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Relationships
            </Typography>
            {character.relationships && character.relationships.length > 0 ? (
              character.relationships.map((rel: any) => (
                <Paper key={rel.id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {rel.relationship_type}
                  </Typography>
                  {rel.description && (
                    <Typography variant="body2">{rel.description}</Typography>
                  )}
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary">
                No relationships recorded.
              </Typography>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

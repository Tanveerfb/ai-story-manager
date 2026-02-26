"use client";

import { useEffect, useState, useCallback } from "react";
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
  IconButton,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import BrushIcon from "@mui/icons-material/Brush";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveIcon from "@mui/icons-material/Save";

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
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Portrait generation
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // Editable fields
  const [traits, setTraits] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState("");
  const [physicalTraits, setPhysicalTraits] = useState<string[]>([]);
  const [newPhysicalTrait, setNewPhysicalTrait] = useState("");
  const [personality, setPersonality] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("");
  const [goals, setGoals] = useState("");
  const [role, setRole] = useState<string>("side");

  // Behavior fields
  const [behaviorNotes, setBehaviorNotes] = useState("");
  const [speechPatterns, setSpeechPatterns] = useState("");
  const [fears, setFears] = useState("");
  const [motivations, setMotivations] = useState("");
  const [arcNotes, setArcNotes] = useState("");

  // Voice profile fields
  const [dialogueStyle, setDialogueStyle] = useState("");
  const [vocabularyLevel, setVocabularyLevel] = useState("");
  const [catchphrases, setCatchphrases] = useState<string[]>([]);
  const [newCatchphrase, setNewCatchphrase] = useState("");

  // Relationships
  const [relationships, setRelationships] = useState<any[]>([]);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [newRelDialog, setNewRelDialog] = useState(false);
  const [newRelCharId, setNewRelCharId] = useState("");
  const [newRelType, setNewRelType] = useState("");
  const [newRelDesc, setNewRelDesc] = useState("");
  const [deleteRelTarget, setDeleteRelTarget] = useState<string | null>(null);

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

  const populateFields = useCallback((char: any) => {
    setTraits(
      Array.isArray(char.traits)
        ? char.traits
        : typeof char.traits === "string"
          ? JSON.parse(char.traits || "[]")
          : [],
    );
    const pt = char.physical_traits
      ? typeof char.physical_traits === "string"
        ? JSON.parse(char.physical_traits)
        : Array.isArray(char.physical_traits)
          ? char.physical_traits.map((t: any) =>
              typeof t === "string" ? t : t.name || String(t),
            )
          : []
      : [];
    setPhysicalTraits(pt);
    setPersonality(
      typeof char.personality === "string"
        ? char.personality
        : char.personality
          ? JSON.stringify(char.personality)
          : "",
    );
    setDescription(char.description || "");
    setBackground(char.background || "");
    setGoals(char.goals || "");
    setRole(char.role || "side");
    setBehaviorNotes(char.behavior_notes || "");
    setSpeechPatterns(char.speech_patterns || "");
    setFears(char.fears || "");
    setMotivations(char.motivations || "");
    setArcNotes(char.arc_notes || "");
    setDialogueStyle(char.dialogue_style || "");
    setVocabularyLevel(char.vocabulary_level || "");
    setCatchphrases(char.catchphrases || []);
    setRelationships(char.relationships || []);
  }, []);

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchCharacter(id);
      fetchAllCharacters();
    }
  }, [params]);

  const fetchCharacter = async (id: string) => {
    try {
      const response = await fetch(`/api/characters/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCharacter(data);
        populateFields(data);
      }
    } catch (err) {
      console.error("Failed to fetch character:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      if (res.ok) setAllCharacters(await res.json());
    } catch {}
  };

  const handleSave = async () => {
    if (!character) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          traits,
          physical_traits: physicalTraits,
          personality,
          description,
          background,
          goals,
          behavior_notes: behaviorNotes,
          speech_patterns: speechPatterns,
          fears,
          motivations,
          arc_notes: arcNotes,
          dialogue_style: dialogueStyle,
          vocabulary_level: vocabularyLevel,
          catchphrases,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Character saved.");
      const updated = await res.json();
      setCharacter(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTrait = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    clear: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!list.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setList([...list, trimmed]);
    }
    clear();
  };

  const removeTrait = (
    list: string[],
    setList: (v: string[]) => void,
    index: number,
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleAddRelationship = async () => {
    if (!newRelCharId || !newRelType) return;
    setSaving(true);
    try {
      const res = await fetch("/api/characters?action=add-relationship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_1_id: character.id,
          character_2_id: newRelCharId,
          relationship_type: newRelType,
          description: newRelDesc,
        }),
      });
      if (!res.ok) throw new Error("Failed to add relationship");
      setNewRelDialog(false);
      setNewRelCharId("");
      setNewRelType("");
      setNewRelDesc("");
      // Refresh character to get updated relationships
      fetchCharacter(character.id);
      setSuccess("Relationship added.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelationship = async () => {
    if (!deleteRelTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _deleteRelationship: deleteRelTarget }),
      });
      // also directly delete from relationships table
      await fetch(
        `/api/characters?action=delete-relationship&id=${deleteRelTarget}`,
        {
          method: "POST",
        },
      );
      setDeleteRelTarget(null);
      fetchCharacter(character.id);
      setSuccess("Relationship removed.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!character) {
    return <Typography>Character not found</Typography>;
  }

  // Other characters for relationship picker (exclude self)
  const otherCharacters = allCharacters.filter((c) => c.id !== character.id);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: { xs: 2, sm: 4 } }}>
        {/* Alerts */}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Header card */}
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
              <Box sx={{ display: "flex", gap: 0.5, mb: 2 }}>
                {(["main", "side", "bg"] as const).map((r) => (
                  <Chip
                    key={r}
                    label={
                      r === "bg"
                        ? "Background"
                        : r.charAt(0).toUpperCase() + r.slice(1)
                    }
                    color={role === r ? "primary" : "default"}
                    variant={role === r ? "filled" : "outlined"}
                    onClick={() => setRole(r)}
                    clickable
                  />
                ))}
              </Box>
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

        {/* Tabs */}
        <Paper>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 2,
              pt: 1,
            }}
          >
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
              <Tab label="Overview" />
              <Tab label="Traits" />
              <Tab label="Behavior" />
              <Tab label="Relationships" />
            </Tabs>
            <Button
              variant="contained"
              size="small"
              startIcon={saving ? <CircularProgress size={14} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              Save
            </Button>
          </Box>

          {/* Tab 0: Overview */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Physical appearance, key identifying features..."
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" gutterBottom>
              Background
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              placeholder="Character history, backstory..."
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" gutterBottom>
              Goals
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="What does this character want?"
            />

            {character.first_appearance_part && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                First appeared in Part {character.first_appearance_part}
              </Typography>
            )}
          </TabPanel>

          {/* Tab 1: Traits */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Personality
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={2}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Describe the character's personality..."
              sx={{ mb: 3 }}
            />

            <Typography variant="h6" gutterBottom>
              Character Traits
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
              {traits.map((trait, i) => (
                <Chip
                  key={i}
                  label={trait}
                  color="primary"
                  variant="outlined"
                  onDelete={() => removeTrait(traits, setTraits, i)}
                />
              ))}
              {traits.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No traits yet.
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1, mb: 3 }}>
              <TextField
                size="small"
                placeholder="Add a trait..."
                value={newTrait}
                onChange={(e) => setNewTrait(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTrait(traits, setTraits, newTrait, () =>
                      setNewTrait(""),
                    );
                  }
                }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() =>
                  addTrait(traits, setTraits, newTrait, () => setNewTrait(""))
                }
              >
                Add
              </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Physical Traits
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
              {physicalTraits.map((trait, i) => (
                <Chip
                  key={i}
                  label={trait}
                  color="secondary"
                  variant="outlined"
                  onDelete={() =>
                    removeTrait(physicalTraits, setPhysicalTraits, i)
                  }
                />
              ))}
              {physicalTraits.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No physical traits yet.
                </Typography>
              )}
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                size="small"
                placeholder="Add a physical trait..."
                value={newPhysicalTrait}
                onChange={(e) => setNewPhysicalTrait(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTrait(
                      physicalTraits,
                      setPhysicalTraits,
                      newPhysicalTrait,
                      () => setNewPhysicalTrait(""),
                    );
                  }
                }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() =>
                  addTrait(
                    physicalTraits,
                    setPhysicalTraits,
                    newPhysicalTrait,
                    () => setNewPhysicalTrait(""),
                  )
                }
              >
                Add
              </Button>
            </Box>
          </TabPanel>

          {/* Tab 2: Behavior */}
          <TabPanel value={tabValue} index={2}>
            {[
              {
                label: "Behavior & Reactions",
                value: behaviorNotes,
                setter: setBehaviorNotes,
                placeholder:
                  "How does this character react to stress, conflict, surprise?",
              },
              {
                label: "Speech Style",
                value: speechPatterns,
                setter: setSpeechPatterns,
                placeholder:
                  "Formal, casual, uses slang, talks slowly, stutters...",
              },
              {
                label: "Fears",
                value: fears,
                setter: setFears,
                placeholder: "What scares this character?",
              },
              {
                label: "Motivations",
                value: motivations,
                setter: setMotivations,
                placeholder: "What drives this character forward?",
              },
              {
                label: "Story Arc Notes",
                value: arcNotes,
                setter: setArcNotes,
                placeholder:
                  "How should this character develop over the story?",
              },
            ].map(({ label, value, setter, placeholder }) => (
              <Box key={label} sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {label}
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  placeholder={placeholder}
                />
              </Box>
            ))}

            {/* Voice Profile Section */}
            <Box sx={{ mt: 4, mb: 2 }}>
              <Typography variant="h5" gutterBottom>
                Voice Profile
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                These fields shape how the AI writes dialogue for this
                character.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Dialogue Style
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={dialogueStyle}
                onChange={(e) => setDialogueStyle(e.target.value)}
                placeholder="e.g. Short clipped sentences, lots of questions, poetic and flowery, sarcastic undertone..."
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vocabulary Level
              </Typography>
              <TextField
                fullWidth
                value={vocabularyLevel}
                onChange={(e) => setVocabularyLevel(e.target.value)}
                placeholder="e.g. Academic, street slang, archaic/medieval, child-like, technical jargon..."
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Catchphrases
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Signature phrases or expressions this character often uses.
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1 }}>
                {catchphrases.map((phrase, i) => (
                  <Chip
                    key={i}
                    label={phrase}
                    onDelete={() =>
                      setCatchphrases(
                        catchphrases.filter((_, idx) => idx !== i),
                      )
                    }
                  />
                ))}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  value={newCatchphrase}
                  onChange={(e) => setNewCatchphrase(e.target.value)}
                  placeholder='Add a catchphrase, e.g. "By the old gods..."'
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCatchphrase.trim()) {
                      setCatchphrases([...catchphrases, newCatchphrase.trim()]);
                      setNewCatchphrase("");
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!newCatchphrase.trim()}
                  onClick={() => {
                    setCatchphrases([...catchphrases, newCatchphrase.trim()]);
                    setNewCatchphrase("");
                  }}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </TabPanel>

          {/* Tab 3: Relationships */}
          <TabPanel value={tabValue} index={3}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Relationships</Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setNewRelDialog(true)}
              >
                Add Relationship
              </Button>
            </Box>

            {relationships && relationships.length > 0 ? (
              relationships.map((rel: any) => {
                // Find the other character's name
                const otherId =
                  rel.character_1_id === character.id
                    ? rel.character_2_id
                    : rel.character_1_id;
                const other = allCharacters.find((c) => c.id === otherId);
                return (
                  <Paper
                    key={rel.id}
                    sx={{ p: 2, mb: 2, display: "flex", gap: 2 }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 0.5,
                        }}
                      >
                        <Chip
                          label={rel.relationship_type || "unknown"}
                          size="small"
                          color="primary"
                        />
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          {other?.name || "Unknown character"}
                        </Typography>
                      </Box>
                      {rel.description && (
                        <Typography variant="body2" color="text.secondary">
                          {rel.description}
                        </Typography>
                      )}
                    </Box>
                    <Tooltip title="Remove relationship">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteRelTarget(rel.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                );
              })
            ) : (
              <Typography color="text.secondary">
                No relationships recorded.
              </Typography>
            )}
          </TabPanel>
        </Paper>
      </Box>

      {/* Add Relationship Dialog */}
      <Dialog
        open={newRelDialog}
        onClose={() => setNewRelDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Relationship</DialogTitle>
        <DialogContent>
          <TextField
            select
            fullWidth
            label="Character"
            value={newRelCharId}
            onChange={(e) => setNewRelCharId(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
            SelectProps={{ native: true }}
          >
            <option value="">Select a character...</option>
            {otherCharacters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Relationship type"
            placeholder="e.g. romantic, friendship, rivalry, family, mentor"
            value={newRelType}
            onChange={(e) => setNewRelType(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={2}
            label="Description (optional)"
            placeholder="Describe the dynamic between them..."
            value={newRelDesc}
            onChange={(e) => setNewRelDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewRelDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddRelationship}
            disabled={!newRelCharId || !newRelType || saving}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Relationship Dialog */}
      <Dialog
        open={!!deleteRelTarget}
        onClose={() => setDeleteRelTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove Relationship?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently remove this relationship. Continue?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteRelTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRelationship}
            disabled={saving}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

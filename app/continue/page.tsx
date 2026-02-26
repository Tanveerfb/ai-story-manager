"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  Alert,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  CircularProgress,
  Collapse,
  LinearProgress,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import InfoIcon from "@mui/icons-material/Info";
import RepeatIcon from "@mui/icons-material/Repeat";
import StopIcon from "@mui/icons-material/Stop";
import FactCheckIcon from "@mui/icons-material/FactCheck";

import GenerationProgress from "@/components/continue/GenerationProgress";
import ModelSelector from "@/components/continue/ModelSelector";
import EntityManager from "@/components/continue/EntityManager";
import LocationManager from "@/components/continue/LocationManager";
import { useWorld } from "@/components/WorldProvider";
import { DEFAULT_AI_MODEL } from "@/lib/constants";

export default function ContinuePage() {
  const { worldId } = useWorld();

  // Core state
  const [userPrompt, setUserPrompt] = useState("");
  const [characterFocus, setCharacterFocus] = useState("");
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL);
  const [loading, setLoading] = useState(false);
  const [continuation, setContinuation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generation controls
  const [generationStyle, setGenerationStyle] = useState<"strict" | "creative">(
    "strict",
  );
  const [maxTokens, setMaxTokens] = useState(600);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status
  const [status, setStatus] = useState("Ready");
  const [contextNotes, setContextNotes] = useState<string[]>([]);

  // Story memory
  const [storyMemory, setStoryMemory] = useState<{
    content: string;
    part_count: number;
    generated_at: string;
  } | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryExpanded, setMemoryExpanded] = useState(false);

  // Part/Chapter selector
  const [availableParts, setAvailableParts] = useState<number[]>([]);
  const [selectedPartNumber, setSelectedPartNumber] = useState<number | "new">(
    "new",
  );

  // Auto-continue state
  const [autoContinueCount, setAutoContinueCount] = useState(3);
  const [autoContinueRunning, setAutoContinueRunning] = useState(false);
  const [autoContinueProgress, setAutoContinueProgress] = useState(0);
  const [autoContinueStop, setAutoContinueStop] = useState(false);

  // Consistency checker state
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyResult, setConsistencyResult] = useState<{
    issues: {
      type: string;
      severity: string;
      description: string;
      quote: string;
      suggestion: string;
    }[];
    summary: string;
  } | null>(null);

  useEffect(() => {
    fetchCharacters();
    fetchLocations();
    fetchAvailableParts();
    fetchStoryMemory();
  }, [worldId]);

  const fetchCharacters = async () => {
    try {
      const response = await fetch(
        `/api/characters${worldId ? `?world_id=${worldId}` : ""}`,
      );
      if (response.ok) setCharacters(await response.json());
    } catch (e) {
      console.error("Failed to fetch characters:", e);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(
        `/api/locations${worldId ? `?world_id=${worldId}` : ""}`,
      );
      if (response.ok) setLocations(await response.json());
    } catch (e) {
      console.error("Failed to fetch locations:", e);
    }
  };

  const fetchAvailableParts = async () => {
    try {
      const response = await fetch(
        `/api/story-parts?action=list-parts${worldId ? `&world_id=${worldId}` : ""}`,
      );
      if (response.ok) {
        const data = await response.json();
        const nums: number[] = data.partNumbers || [];
        setAvailableParts(nums);
        setSelectedPartNumber(nums.length > 0 ? nums[nums.length - 1] : "new");
      }
    } catch (e) {
      console.error("Failed to fetch available parts:", e);
    }
  };

  const fetchStoryMemory = async () => {
    try {
      const res = await fetch("/api/story-memory");
      if (res.ok) {
        const data = await res.json();
        setStoryMemory(data.memory);
      }
    } catch {
      // No memory yet
    }
  };

  const handleGenerateMemory = async () => {
    setMemoryLoading(true);
    try {
      const res = await fetch("/api/story-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        setStoryMemory(data.memory);
        setMemoryExpanded(true);
        setSuccess("Story memory generated.");
      } else {
        const err = await res.json();
        setError(err.error || "Failed to generate memory");
      }
    } catch {
      setError("Failed to generate memory");
    } finally {
      setMemoryLoading(false);
    }
  };

  const handleClearMemory = async () => {
    try {
      await fetch("/api/story-memory", { method: "DELETE" });
      setStoryMemory(null);
    } catch {
      setError("Failed to clear memory");
    }
  };

  // ─── Generation ───

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setContinuation(null);
    setStatus("Generating...");

    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          userPrompt,
          characterFocus: characterFocus || null,
          model: selectedModel,
          generationStyle,
          maxTokens,
          worldId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setContextNotes(result.contextNotes || []);
      setStatus("Done");
    } catch (err: any) {
      setError(err.message);
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  // ─── Insert into Story ───

  const handleInsertIntoStory = async () => {
    if (!continuation) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Extract & merge entities
      setStatus("Extracting entities...");

      let entitySummary = "";
      try {
        const extractResponse = await fetch("/api/extract-entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: continuation }),
        });

        if (extractResponse.ok) {
          const extracted = await extractResponse.json();

          const findExisting = (list: any[], name: string) =>
            list.find((item) => item.name.toLowerCase() === name.toLowerCase());

          let addedChars = 0;
          let updatedChars = 0;
          let addedLocs = 0;
          let addedRels = 0;

          for (const char of extracted.characters || []) {
            const existing = findExisting(characters, char.name);
            if (!existing) {
              const r = await fetch("/api/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...char, world_id: worldId }),
              });
              if (r.ok) addedChars++;
            } else {
              const mergedTraits = Array.isArray(existing.traits)
                ? [...existing.traits]
                : [];
              for (const t of char.traits || []) {
                if (
                  !mergedTraits.some(
                    (m: string) => m.toLowerCase() === t.toLowerCase(),
                  )
                ) {
                  mergedTraits.push(t);
                }
              }

              const updates: any = { traits: mergedTraits };
              if (
                char.personality &&
                (!existing.personality ||
                  String(existing.personality).length <
                    String(char.personality).length)
              ) {
                updates.personality = char.personality;
              }
              if (
                char.description &&
                (!existing.description ||
                  existing.description.length < char.description.length)
              ) {
                updates.description = char.description;
              }
              if (char.goals && !existing.goals) {
                updates.goals = char.goals;
              }

              const r = await fetch(`/api/characters/${existing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
              });
              if (r.ok) updatedChars++;
            }
          }

          for (const rel of extracted.relationships || []) {
            const char1 = findExisting(characters, rel.character_1);
            const char2 = findExisting(characters, rel.character_2);
            if (char1 && char2) {
              const r = await fetch("/api/characters?action=add-relationship", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  character_1_id: char1.id,
                  character_2_id: char2.id,
                  relationship_type:
                    rel.relationship_type || rel.type || "unknown",
                  description: rel.dynamic || rel.description || "",
                }),
              });
              if (r.ok) addedRels++;
            }
          }

          for (const loc of extracted.locations || []) {
            if (!findExisting(locations, loc.name)) {
              const r = await fetch("/api/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...loc, world_id: worldId }),
              });
              if (r.ok) addedLocs++;
            }
          }

          await fetchCharacters();
          await fetchLocations();

          const parts = [];
          if (addedChars > 0)
            parts.push(
              `${addedChars} new character${addedChars > 1 ? "s" : ""}`,
            );
          if (updatedChars > 0) parts.push(`${updatedChars} updated`);
          if (addedRels > 0)
            parts.push(`${addedRels} relationship${addedRels > 1 ? "s" : ""}`);
          if (addedLocs > 0)
            parts.push(`${addedLocs} location${addedLocs > 1 ? "s" : ""}`);
          if (parts.length > 0) entitySummary = ` (${parts.join(", ")})`;
        }
      } catch {
        // Entity extraction failing should not block story insertion
      }

      // Step 2: Insert the story part
      setStatus("Saving to story...");

      const partsResponse = await fetch(
        `/api/story-parts${worldId ? `?world_id=${worldId}` : ""}`,
      );
      const allParts = await partsResponse.json();

      let partNumber: number;
      let chapterNumber: number;

      if (selectedPartNumber === "new" || availableParts.length === 0) {
        partNumber =
          allParts.length > 0
            ? Math.max(...allParts.map((p: any) => p.part_number)) + 1
            : 1;
        chapterNumber = 1;
      } else {
        partNumber = selectedPartNumber as number;
        const chaptersInPart = allParts.filter(
          (p: any) => p.part_number === partNumber,
        );
        chapterNumber =
          chaptersInPart.length > 0
            ? Math.max(
                ...chaptersInPart.map((p: any) => p.chapter_number || 1),
              ) + 1
            : 1;
      }

      const response = await fetch("/api/story-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part_number: partNumber,
          chapter_number: chapterNumber,
          title: `Part ${partNumber} — Chapter ${chapterNumber}`,
          content: continuation,
          word_count: continuation.split(/\s+/).length,
          world_id: worldId,
        }),
      });

      if (!response.ok) throw new Error("Failed to insert into story");

      setSuccess(
        `Part ${partNumber}, Chapter ${chapterNumber} saved${entitySummary}.`,
      );
      setContinuation(null);
      setContextNotes([]);
      setStatus("Ready");
      fetchAvailableParts();
    } catch (err: any) {
      setError(err.message || "Failed to insert into story");
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setContinuation(null);
    setContextNotes([]);
    setError(null);
    setSuccess(null);
  };

  // ─── Auto-Continue ───
  const handleAutoContinue = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }
    setAutoContinueRunning(true);
    setAutoContinueStop(false);
    setAutoContinueProgress(0);
    setError(null);

    for (let i = 0; i < autoContinueCount; i++) {
      if (autoContinueStop) break;
      setAutoContinueProgress(i + 1);
      setStatus(
        `Auto-continue: generating chapter ${i + 1} of ${autoContinueCount}...`,
      );

      try {
        // Generate
        const genRes = await fetch("/api/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate",
            userPrompt:
              i === 0
                ? userPrompt
                : `Continue the story naturally from where the previous chapter left off. ${userPrompt}`,
            characterFocus: characterFocus || null,
            model: selectedModel,
            generationStyle,
            maxTokens,
            worldId,
          }),
        });

        if (!genRes.ok) {
          const errData = await genRes.json();
          throw new Error(errData.error || "Generation failed");
        }

        const genResult = await genRes.json();
        const text = genResult.continuation;
        if (!text) throw new Error("Empty generation");

        // Auto-insert
        setStatus(`Auto-continue: inserting chapter ${i + 1}...`);

        // Extract entities
        try {
          await fetch("/api/extract-entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
        } catch {}

        // Determine part/chapter
        const partsRes = await fetch(
          `/api/story-parts?action=list-parts${worldId ? `&world_id=${worldId}` : ""}`,
        );
        let partNumber = 1;
        let chapterNumber = 1;
        if (partsRes.ok) {
          const partsData = await partsRes.json();
          if (partsData.length > 0) {
            const lastPart = partsData[partsData.length - 1];
            partNumber = lastPart.part_number;
            chapterNumber = (lastPart.max_chapter || 0) + 1;
          }
        }

        // Insert
        const insertRes = await fetch("/api/story-parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            part_number: partNumber,
            chapter_number: chapterNumber,
            world_id: worldId,
          }),
        });

        if (!insertRes.ok) throw new Error("Failed to insert chapter");
      } catch (err: any) {
        setError(`Auto-continue stopped at chapter ${i + 1}: ${err.message}`);
        break;
      }
    }

    setAutoContinueRunning(false);
    setStatus("Ready");
    setSuccess(
      `Auto-continue finished! Generated ${autoContinueProgress} chapter(s).`,
    );
    fetchAvailableParts();
  };

  // ─── Consistency Check ───
  const handleConsistencyCheck = async () => {
    if (!continuation) return;
    setConsistencyLoading(true);
    setConsistencyResult(null);
    try {
      const res = await fetch("/api/continue-story/consistency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: continuation,
          worldId,
          model: selectedModel,
        }),
      });
      if (!res.ok) throw new Error("Consistency check failed");
      const result = await res.json();
      setConsistencyResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConsistencyLoading(false);
    }
  };

  // ─── Render ───

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{ px: { xs: 1, sm: 2, md: 3 } }}
    >
      <Box sx={{ my: { xs: 2, sm: 3 } }}>
        {/* Header row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AutoAwesomeIcon color="primary" />
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 700, fontSize: { xs: "1.3rem", sm: "1.5rem" } }}
            >
              Continue Story
            </Typography>
          </Box>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={loading}
          />
        </Box>

        {/* Story Memory — compact bar */}
        <Paper
          variant="outlined"
          sx={{
            mb: 2,
            overflow: "hidden",
            borderColor: storyMemory ? "primary.main" : "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1,
              cursor: storyMemory ? "pointer" : "default",
            }}
            onClick={() => storyMemory && setMemoryExpanded((v) => !v)}
          >
            <Typography variant="body2" color="text.secondary">
              {storyMemory
                ? `Story Memory active — ${storyMemory.part_count} parts condensed`
                : "Story Memory — not generated"}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              {storyMemory && (
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearMemory();
                  }}
                  sx={{ minWidth: 0, px: 1, py: 0 }}
                >
                  Clear
                </Button>
              )}
              <Button
                size="small"
                variant={storyMemory ? "text" : "outlined"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateMemory();
                }}
                disabled={memoryLoading}
                sx={{ py: 0 }}
              >
                {memoryLoading
                  ? "Generating…"
                  : storyMemory
                    ? "Regenerate"
                    : "Generate"}
              </Button>
              {storyMemory && (
                <IconButton size="small">
                  {memoryExpanded ? (
                    <ExpandLessIcon fontSize="small" />
                  ) : (
                    <ExpandMoreIcon fontSize="small" />
                  )}
                </IconButton>
              )}
            </Box>
          </Box>
          <Collapse in={memoryExpanded && !!storyMemory}>
            <Box
              sx={{
                px: 2,
                pb: 1.5,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: "pre-wrap",
                  color: "text.secondary",
                  mt: 1,
                  fontSize: "0.8rem",
                }}
              >
                {storyMemory?.content}
              </Typography>
            </Box>
          </Collapse>
        </Paper>

        <Grid container spacing={2}>
          {/* ─── Main Column ─── */}
          <Grid item xs={12} lg={8}>
            {/* Prompt Card */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
              {/* Generation style toggle + character focus — single row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2,
                  flexWrap: "wrap",
                }}
              >
                <ToggleButtonGroup
                  value={generationStyle}
                  exclusive
                  onChange={(_, v) => v && setGenerationStyle(v)}
                  disabled={loading}
                  size="small"
                >
                  <ToggleButton value="strict">
                    <Tooltip title="AI renders your exact narrative intent as prose — no inventions">
                      <span>Reword</span>
                    </Tooltip>
                  </ToggleButton>
                  <ToggleButton value="creative">
                    <Tooltip title="AI uses your prompt as a starting point and expands freely">
                      <span>Expand</span>
                    </Tooltip>
                  </ToggleButton>
                </ToggleButtonGroup>

                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Play as</InputLabel>
                  <Select
                    value={characterFocus}
                    label="Play as"
                    onChange={(e) => setCharacterFocus(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {characters.map((char) => (
                      <MenuItem key={char.id} value={char.name}>
                        {char.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  size="small"
                  variant="text"
                  onClick={() => setShowAdvanced((v) => !v)}
                  sx={{
                    ml: "auto",
                    textTransform: "none",
                    color: "text.secondary",
                  }}
                >
                  {showAdvanced ? "Hide settings" : "Settings"}
                </Button>
              </Box>

              {/* Advanced settings (collapsible) */}
              <Collapse in={showAdvanced}>
                <Box sx={{ mb: 2, pl: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Max Tokens: {maxTokens}
                  </Typography>
                  <Slider
                    value={maxTokens}
                    onChange={(_, v) => setMaxTokens(v as number)}
                    min={100}
                    max={3000}
                    step={50}
                    disabled={loading}
                    marks={[
                      { value: 100, label: "100" },
                      { value: 600, label: "600" },
                      { value: 1500, label: "1500" },
                      { value: 3000, label: "3000" },
                    ]}
                    valueLabelDisplay="auto"
                    sx={{ maxWidth: 400 }}
                  />
                </Box>
              </Collapse>

              {/* Prompt text area */}
              <TextField
                fullWidth
                multiline
                rows={5}
                placeholder={
                  characterFocus
                    ? `Playing as ${characterFocus}. Describe what they do, say, or experience next...`
                    : generationStyle === "strict"
                      ? "Describe what happens next — the AI will render it as prose without adding anything extra."
                      : "Describe what should happen next — the AI will expand on it creatively..."
                }
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={loading}
                sx={{
                  "& .MuiInputBase-root": {
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                  },
                }}
              />

              {/* Action buttons */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  mt: 2,
                  alignItems: "center",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleGenerate}
                  disabled={loading || !userPrompt.trim()}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ px: 3 }}
                >
                  Generate
                </Button>
                <Tooltip title="Retry">
                  <span>
                    <IconButton
                      onClick={handleGenerate}
                      disabled={loading || !userPrompt.trim()}
                      color="primary"
                      size="small"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Clear output">
                  <span>
                    <IconButton
                      onClick={handleClear}
                      disabled={loading || !continuation}
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Auto-Continue Section */}
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <RepeatIcon color="action" />
                  <Typography variant="subtitle2" sx={{ flex: 1 }}>
                    Auto-Continue
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    label="Chapters"
                    value={autoContinueCount}
                    onChange={(e) =>
                      setAutoContinueCount(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                      )
                    }
                    sx={{ width: 100 }}
                    inputProps={{ min: 1, max: 20 }}
                    disabled={autoContinueRunning}
                  />
                  {autoContinueRunning ? (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<StopIcon />}
                      onClick={() => setAutoContinueStop(true)}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<RepeatIcon />}
                      onClick={handleAutoContinue}
                      disabled={loading || !userPrompt.trim()}
                    >
                      Auto-Write
                    </Button>
                  )}
                </Box>
                {autoContinueRunning && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(autoContinueProgress / autoContinueCount) * 100}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Chapter {autoContinueProgress} of {autoContinueCount}
                    </Typography>
                  </Box>
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{ mt: 0.5 }}
                >
                  Generates and auto-inserts multiple chapters sequentially
                  using your prompt as the base direction.
                </Typography>
              </Paper>
            </Paper>

            {/* Generation Progress */}
            <GenerationProgress
              isGenerating={loading}
              status={status}
              contextNotes={contextNotes}
            />

            {/* Alerts */}
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
                onClose={() => setError(null)}
              >
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

            {/* Generated Output */}
            {continuation && (
              <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  Generated — edit as needed, then insert into your story:
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={12}
                  value={continuation}
                  onChange={(e) => setContinuation(e.target.value)}
                  variant="outlined"
                  disabled={loading}
                  sx={{
                    mb: 2,
                    "& .MuiInputBase-root": {
                      fontFamily: "Georgia, serif",
                      fontSize: "1rem",
                      lineHeight: 1.8,
                    },
                  }}
                />

                <Divider sx={{ mb: 2 }} />

                {/* Insert controls */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    flexWrap: "wrap",
                  }}
                >
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Insert into</InputLabel>
                    <Select
                      value={selectedPartNumber}
                      label="Insert into"
                      onChange={(e) =>
                        setSelectedPartNumber(
                          e.target.value === "new"
                            ? "new"
                            : Number(e.target.value),
                        )
                      }
                      disabled={loading}
                    >
                      {availableParts.map((num) => (
                        <MenuItem key={num} value={num}>
                          Part {num}
                        </MenuItem>
                      ))}
                      <MenuItem value="new">
                        <em>+ New Part</em>
                      </MenuItem>
                    </Select>
                  </FormControl>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ flex: 1 }}
                  >
                    {selectedPartNumber === "new"
                      ? "Creates new part, Chapter 1"
                      : `Adds next chapter to Part ${selectedPartNumber}`}
                  </Typography>

                  <Button
                    variant="outlined"
                    startIcon={
                      consistencyLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        <FactCheckIcon />
                      )
                    }
                    onClick={handleConsistencyCheck}
                    disabled={loading || consistencyLoading}
                  >
                    Check Consistency
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleInsertIntoStory}
                    disabled={loading}
                  >
                    Insert into Story
                  </Button>
                </Box>

                {/* Consistency Results */}
                {consistencyResult && (
                  <Box sx={{ mt: 2 }}>
                    <Alert
                      severity={
                        consistencyResult.issues.length === 0
                          ? "success"
                          : "warning"
                      }
                      sx={{ mb: 1 }}
                    >
                      {consistencyResult.summary}
                    </Alert>
                    {consistencyResult.issues.map((issue, i) => (
                      <Paper key={i} variant="outlined" sx={{ p: 1.5, mb: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 0.5,
                          }}
                        >
                          <Chip
                            label={issue.type}
                            size="small"
                            color={
                              issue.severity === "high"
                                ? "error"
                                : issue.severity === "medium"
                                  ? "warning"
                                  : "default"
                            }
                          />
                          <Chip
                            label={issue.severity}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          {issue.description}
                        </Typography>
                        {issue.quote && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontStyle: "italic", mb: 0.5 }}
                          >
                            &ldquo;{issue.quote}&rdquo;
                          </Typography>
                        )}
                        {issue.suggestion && (
                          <Typography variant="body2" color="primary">
                            Suggestion: {issue.suggestion}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Box>
                )}
              </Paper>
            )}
          </Grid>

          {/* ─── Sidebar ─── */}
          <Grid item xs={12} lg={4}>
            <EntityManager
              characters={characters}
              onCharactersChange={fetchCharacters}
            />
            <LocationManager
              locations={locations}
              onLocationsChange={fetchLocations}
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

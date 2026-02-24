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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ToggleButtonGroup,
  ToggleButton,
  Slider,
  CircularProgress,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SaveIcon from "@mui/icons-material/Save";
import RefreshIcon from "@mui/icons-material/Refresh";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

import GenerationProgress from "@/components/continue/GenerationProgress";
import FeedbackPanel from "@/components/continue/FeedbackPanel";
import HistoryPanel from "@/components/continue/HistoryPanel";
import BranchingPanel from "@/components/continue/BranchingPanel";
import SideNotesPanel from "@/components/continue/SideNotesPanel";
import ModelSelector from "@/components/continue/ModelSelector";
import EntityManager from "@/components/continue/EntityManager";
import LocationManager from "@/components/continue/LocationManager";
import WorldSwitcher from "@/components/WorldSwitcher";
import { DEFAULT_AI_MODEL } from "@/lib/constants";

export default function ContinuePage() {
  // Basic state
  const [userPrompt, setUserPrompt] = useState("");
  const [characterFocus, setCharacterFocus] = useState("");
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL); // Use constant for default model
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [currentWorldName, setCurrentWorldName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [continuation, setContinuation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generation Style state (new feature)
  const [generationStyle, setGenerationStyle] = useState<"strict" | "creative">(
    "strict",
  ); // Default to 'strict'
  const [maxTokens, setMaxTokens] = useState(600); // Default max tokens

  // Advanced state
  const [status, setStatus] = useState("Ready");
  const [contextNotes, setContextNotes] = useState<string[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [sideNotes, setSideNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [sceneType, setSceneType] = useState("");
  const [showPreviousContext, setShowPreviousContext] = useState(true);
  const [recentParts, setRecentParts] = useState<any[]>([]);

  // Recent events summary state
  const [recentEventsSummary, setRecentEventsSummary] = useState<string | null>(
    null,
  );
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Story memory state
  const [storyMemory, setStoryMemory] = useState<{
    content: string;
    part_count: number;
    generated_at: string;
  } | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryExpanded, setMemoryExpanded] = useState(false);

  useEffect(() => {
    fetchCharacters();
    fetchLocations();
    fetchRecentParts();
    fetchRecentEventsSummary();
    fetchStoryMemory();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };

  const fetchRecentParts = async () => {
    try {
      const response = await fetch("/api/story-parts");
      if (response.ok) {
        const data = await response.json();
        setRecentParts(data.slice(-3));
      }
    } catch (error) {
      console.error("Failed to fetch recent parts:", error);
    }
  };

  const fetchRecentEventsSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch("/api/story-parts?action=summarize&limit=3");
      if (response.ok) {
        const data = await response.json();
        setRecentEventsSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      setRecentEventsSummary("Unable to generate summary at this time.");
    } finally {
      setSummaryLoading(false);
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
      // No memory yet — silent
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
        setSuccess(
          "Story memory generated — AI will use this to keep context.",
        );
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

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setContinuation(null);
    setStatus("Generating story continuation...");

    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          userPrompt,
          characterFocus: characterFocus || null,
          model: selectedModel, // Include selected model
          generationStyle, // Include generation style
          maxTokens, // Include max tokens
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setContextNotes(result.contextNotes || []);
      setStatus("Generation complete");
    } catch (err: any) {
      setError(err.message);
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const handleRevise = async (revisionInstructions: string) => {
    if (!currentDraftId) {
      // If no draft exists yet, treat this as a new generation with revision instructions
      handleGenerateWithInstructions(revisionInstructions);
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Revising based on your feedback...");

    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revise",
          draftId: currentDraftId,
          revisionInstructions,
          generationStyle, // Include generation style
          maxTokens, // Include max tokens
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Revision failed");
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setStatus("Revision complete");

      // Refresh history if draft exists
      if (currentDraftId) {
        await fetchHistory(currentDraftId);
      }
    } catch (err: any) {
      setError(err.message);
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithInstructions = async (
    revisionInstructions: string,
  ) => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Generating with your instructions...");

    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          userPrompt,
          characterFocus: characterFocus || null,
          revisionInstructions,
          generationStyle, // Include generation style
          maxTokens, // Include max tokens
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setContextNotes(result.contextNotes || []);
      setStatus("Generation complete");
    } catch (err: any) {
      setError(err.message);
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!continuation) return;

    setLoading(true);
    setError(null);
    setStatus("Saving draft...");

    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-draft",
          userPrompt,
          characterFocus: characterFocus || null,
          generatedContent: continuation, // Include the edited content
          tags,
          sideNotes,
          sceneType,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }

      const result = await response.json();
      setCurrentDraftId(result.draft.id);
      setSuccess("Draft saved successfully!");
      setStatus("Ready");
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const handleInsertIntoStory = async () => {
    if (!continuation) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Extract & merge entities first
      setStatus("Extracting characters and locations...");

      let entitySummary = "";
      try {
        const extractResponse = await fetch("/api/extract-entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: continuation }),
        });

        if (extractResponse.ok) {
          const extracted = await extractResponse.json();

          const entityExists = (list: any[], name: string) =>
            list.some((item) => item.name.toLowerCase() === name.toLowerCase());

          let addedChars = 0;
          let addedLocs = 0;

          for (const char of extracted.characters || []) {
            if (!entityExists(characters, char.name)) {
              const r = await fetch("/api/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(char),
              });
              if (r.ok) addedChars++;
            }
          }

          for (const loc of extracted.locations || []) {
            if (!entityExists(locations, loc.name)) {
              const r = await fetch("/api/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(loc),
              });
              if (r.ok) addedLocs++;
            }
          }

          await fetchCharacters();
          await fetchLocations();

          const parts = [];
          if (addedChars > 0)
            parts.push(`${addedChars} character${addedChars > 1 ? "s" : ""}`);
          if (addedLocs > 0)
            parts.push(`${addedLocs} location${addedLocs > 1 ? "s" : ""}`);
          if (parts.length > 0)
            entitySummary = ` (added ${parts.join(" and ")})`;
        }
      } catch {
        // Entity extraction failing should not block story insertion
      }

      // Step 2: Insert the story part
      setStatus("Inserting into story...");

      const partsResponse = await fetch("/api/story-parts");
      const parts = await partsResponse.json();
      const nextPartNumber =
        parts.length > 0
          ? Math.max(...parts.map((p: any) => p.part_number)) + 1
          : 1;

      const response = await fetch("/api/story-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part_number: nextPartNumber,
          title: `Part ${nextPartNumber}`,
          content: continuation,
          word_count: continuation.split(/\s+/).length,
        }),
      });

      if (!response.ok) throw new Error("Failed to insert into story");

      setSuccess(`Story part ${nextPartNumber} saved${entitySummary}.`);
      handleClear();
      setStatus("Ready");
      fetchRecentParts();
    } catch (err: any) {
      setError(err.message || "Failed to insert into story");
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractEntities = async () => {
    if (!continuation) return;

    setLoading(true);
    setError(null);
    setStatus("Extracting characters and locations...");

    try {
      // Extract entities from the generated content
      const extractResponse = await fetch("/api/extract-entities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: continuation }),
      });

      if (!extractResponse.ok) {
        throw new Error("Failed to extract entities");
      }

      const extracted = await extractResponse.json();

      let addedCharacters = 0;
      let addedLocations = 0;
      let skippedCharacters = 0;
      let skippedLocations = 0;

      // Helper function to check if entity exists (case-insensitive)
      const entityExists = (list: any[], name: string) => {
        return list.some(
          (item) => item.name.toLowerCase() === name.toLowerCase(),
        );
      };

      // Add new characters
      if (extracted.characters && extracted.characters.length > 0) {
        for (const char of extracted.characters) {
          if (!entityExists(characters, char.name)) {
            // Add new character
            const response = await fetch("/api/characters", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(char),
            });

            if (response.ok) {
              addedCharacters++;
            }
          } else {
            skippedCharacters++;
          }
        }
      }

      // Add new locations
      if (extracted.locations && extracted.locations.length > 0) {
        for (const loc of extracted.locations) {
          if (!entityExists(locations, loc.name)) {
            // Add new location
            const response = await fetch("/api/locations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(loc),
            });

            if (response.ok) {
              addedLocations++;
            }
          } else {
            skippedLocations++;
          }
        }
      }

      // Refresh character and location lists
      await fetchCharacters();
      await fetchLocations();

      // Build detailed success message
      const totalAdded = addedCharacters + addedLocations;
      const totalSkipped = skippedCharacters + skippedLocations;

      if (totalAdded > 0) {
        let message = "Successfully extracted and added ";
        const parts = [];
        if (addedCharacters > 0)
          parts.push(
            `${addedCharacters} character${addedCharacters > 1 ? "s" : ""}`,
          );
        if (addedLocations > 0)
          parts.push(
            `${addedLocations} location${addedLocations > 1 ? "s" : ""}`,
          );
        message += parts.join(" and ");
        if (totalSkipped > 0) {
          message += ` (${totalSkipped} already existed)`;
        }
        message += "!";
        setSuccess(message);
      } else if (totalSkipped > 0) {
        setSuccess(
          `Found ${totalSkipped} entities that already exist in your database.`,
        );
      } else {
        setSuccess("No new entities found in the generated content.");
      }
      setStatus("Ready");
    } catch (err: any) {
      setError(err.message || "Failed to extract entities");
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

  const handleRetry = () => {
    handleGenerate();
  };

  const fetchHistory = async (draftId: string) => {
    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get-history",
          draftId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setHistory(result.history || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const handleRestoreHistory = (entry: any) => {
    setContinuation(entry.generated_content);
    setUserPrompt(entry.user_prompt);
  };

  const handleCreateBranch = async (
    branchName: string,
    branchPrompt: string,
    branchNotes: string,
  ) => {
    if (!currentDraftId) {
      setError("Please save a draft first before creating branches");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus("Creating branch...");

    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "branch",
          draftId: currentDraftId,
          branchName,
          userPrompt: branchPrompt,
          characterFocus: characterFocus || null,
          sideNotes: branchNotes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create branch");
      }

      const result = await response.json();
      setSuccess(`Branch "${branchName}" created successfully!`);
      setStatus("Ready");
    } catch (err: any) {
      setError(err.message || "Failed to create branch");
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const promptTemplates = [
    {
      label: "Continue from cliffhanger",
      prompt: "Continue from the cliffhanger, building tension",
    },
    {
      label: "Describe character's reaction",
      prompt: characterFocus
        ? `Describe ${characterFocus}'s emotional reaction to recent events`
        : "Describe the main character's emotional reaction to recent events",
    },
    {
      label: "Add dialogue scene",
      prompt: "Write a dialogue-heavy scene that reveals character motivations",
    },
    {
      label: "Describe setting",
      prompt: "Provide rich, atmospheric description of the current setting",
    },
    {
      label: "Plot twist",
      prompt:
        "Introduce an unexpected plot development that changes everything",
    },
  ];

  return (
    <Container
      maxWidth="xl"
      disableGutters
      sx={{ px: { xs: 1, sm: 2, md: 3 } }}
    >
      <Box sx={{ my: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
          <AutoAwesomeIcon
            sx={{
              fontSize: { xs: 28, sm: 40 },
              flexShrink: 0,
              color: "primary.main",
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{ fontSize: { xs: "1.4rem", sm: "2.125rem" } }}
            >
              AI-First Story Creation
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: "none", sm: "block" } }}
            >
              Create stories from scratch with AI assistance - build narrative,
              entities, and locations live
            </Typography>
          </Box>
        </Box>

        {/* World Switcher */}
        <Box sx={{ mb: 3 }}>
          <WorldSwitcher
            currentWorldId={currentWorldId}
            onWorldChange={(id, name) => {
              setCurrentWorldId(id);
              setCurrentWorldName(name);
            }}
          />
        </Box>

        {/* AI Story Memory */}
        <Paper variant="outlined" sx={{ mb: 3, overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              cursor: storyMemory ? "pointer" : "default",
              bgcolor: storyMemory ? "background.default" : "transparent",
            }}
            onClick={() => storyMemory && setMemoryExpanded((v) => !v)}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AutoAwesomeIcon
                fontSize="small"
                color={storyMemory ? "primary" : "disabled"}
              />
              <Typography
                variant="subtitle2"
                color={storyMemory ? "text.primary" : "text.secondary"}
              >
                {storyMemory
                  ? `AI Story Memory — ${storyMemory.part_count} parts condensed`
                  : "AI Story Memory — not generated yet"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {storyMemory && (
                <Button
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearMemory();
                  }}
                  sx={{ minWidth: 0, px: 1 }}
                >
                  Clear
                </Button>
              )}
              <Button
                size="small"
                variant={storyMemory ? "outlined" : "contained"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateMemory();
                }}
                disabled={memoryLoading}
                startIcon={
                  memoryLoading ? <CircularProgress size={14} /> : undefined
                }
              >
                {memoryLoading
                  ? "Generating…"
                  : storyMemory
                    ? "Regenerate"
                    : "Generate Memory"}
              </Button>
            </Box>
          </Box>
          {memoryExpanded && storyMemory && (
            <Box
              sx={{
                px: 2,
                pb: 2,
                borderTop: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1, mb: 0.5 }}
              >
                Condensed on{" "}
                {new Date(storyMemory.generated_at).toLocaleString()}
              </Typography>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", color: "text.secondary" }}
              >
                {storyMemory.content}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Info Alert */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          <strong>Welcome to AI-First Authoring:</strong> Start with an empty
          canvas and let AI help you create. Use [ --- note ] markers for
          in-context instructions. Create characters and locations on the fly.
          Switch between models to find your perfect creative partner.
        </Alert>

        {/* Recent Events Summary */}
        {summaryLoading ? (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body1" color="text.secondary">
                Generating summary of recent events...
              </Typography>
            </Box>
          </Paper>
        ) : (
          recentEventsSummary && (
            <Paper
              sx={{
                p: 3,
                mb: 3,
                bgcolor: "background.default",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <AutoAwesomeIcon fontSize="small" color="primary" />
                Recent Events Summary
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {recentEventsSummary}
              </Typography>
            </Paper>
          )
        )}

        <Grid container spacing={3}>
          {/* Left Column - Main Editor */}
          <Grid item xs={12} lg={8}>
            {/* Previous Context */}
            {showPreviousContext && recentParts.length > 0 && (
              <Accordion sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Recent Story Context</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {recentParts.map((part) => (
                    <Box key={part.id} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="primary">
                        Part {part.part_number}: {part.title || "Untitled"}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1 }}
                      >
                        {part.summary || part.content.substring(0, 200) + "..."}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Main Prompt Input */}
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Prompt
              </Typography>

              {/* Model Selector */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={loading}
              />

              {/* Generation Style Controls - NEW FEATURE */}
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  Generation Style
                  <Tooltip title="Reword: AI renders your exact narrative intent as prose — no inventions, no extras. AI expands: AI uses your prompt as a starting point and builds naturally from there.">
                    <InfoIcon fontSize="small" color="action" />
                  </Tooltip>
                </Typography>
                <ToggleButtonGroup
                  value={generationStyle}
                  exclusive
                  onChange={(e, newValue) => {
                    if (newValue !== null) {
                      setGenerationStyle(newValue);
                    }
                  }}
                  disabled={loading}
                  size="small"
                  sx={{ mb: 2 }}
                >
                  <ToggleButton value="strict">Reword my intent</ToggleButton>
                  <ToggleButton value="creative">
                    AI expands freely
                  </ToggleButton>
                </ToggleButtonGroup>

                <Typography variant="caption" gutterBottom display="block">
                  Max Tokens: {maxTokens}
                </Typography>
                <Slider
                  value={maxTokens}
                  onChange={(e, newValue) => setMaxTokens(newValue as number)}
                  min={100}
                  max={3000}
                  step={50}
                  disabled={loading}
                  marks={[
                    { value: 100, label: "100" },
                    { value: 300, label: "300" },
                    { value: 500, label: "500" },
                    { value: 1500, label: "1500" },
                    { value: 3000, label: "3000" },
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ maxWidth: 400 }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder={
                  characterFocus
                    ? `You are playing as ${characterFocus}. Describe what ${characterFocus} does, says, thinks, or experiences next.\n\nThe AI will write it from ${characterFocus}'s POV and portray all other characters based on their saved profiles.\n\nExample: "${characterFocus} walks into the room and notices something feels wrong. She scans the faces around her."`
                    : generationStyle === "strict"
                      ? `Describe your narrative intent — what you want to happen next. The AI will render it as story prose without adding anything extra.\n\nExample: "Rhea enters the marketplace for the first time. She is overwhelmed by the noise and smells but tries to appear calm."\n\nUse [ --- note ] for inline instructions.`
                      : `Describe what should happen next in the story...\n\nUse [ --- ] markers for in-context notes, e.g.:\n[ --- Make this scene intense and emotional ]\nDuke confronts the villain...`
                }
                label={
                  characterFocus
                    ? `Playing as ${characterFocus}`
                    : "Your Prompt"
                }
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={loading}
                InputLabelProps={{ shrink: true }}
              />

              <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
                <FormControl sx={{ minWidth: { xs: "100%", sm: 200 } }}>
                  <InputLabel>Play as Character</InputLabel>
                  <Select
                    value={characterFocus}
                    label="Play as Character"
                    onChange={(e) => setCharacterFocus(e.target.value)}
                    disabled={loading}
                  >
                    <MenuItem value="">None</MenuItem>
                    {characters.map((char) => (
                      <MenuItem key={char.id} value={char.name}>
                        {char.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleGenerate}
                  disabled={loading || !userPrompt.trim()}
                  startIcon={<AutoAwesomeIcon />}
                  sx={{ flex: 1, minWidth: { xs: "100%", sm: 160 } }}
                >
                  Generate
                </Button>

                <Tooltip title="Retry generation">
                  <span>
                    <IconButton
                      onClick={handleRetry}
                      disabled={loading || !userPrompt.trim()}
                      color="primary"
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
                      color="secondary"
                    >
                      <ClearIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Prompt Templates */}
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  gutterBottom
                >
                  Quick Templates:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                  {promptTemplates.map((template, idx) => (
                    <Chip
                      key={idx}
                      label={template.label}
                      size="small"
                      onClick={() => setUserPrompt(template.prompt)}
                      disabled={loading}
                      clickable
                    />
                  ))}
                </Box>
              </Box>
            </Paper>

            {/* Generation Progress */}
            <GenerationProgress
              isGenerating={loading}
              status={status}
              contextNotes={contextNotes}
            />

            {/* Errors and Success Messages */}
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                sx={{ mb: 3 }}
                onClose={() => setSuccess(null)}
              >
                {success}
              </Alert>
            )}

            {/* Generated Output */}
            {continuation && (
              <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                    flexWrap: "wrap",
                    gap: 1,
                  }}
                >
                  <Typography variant="h6">Generated Continuation</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<PersonAddIcon />}
                      onClick={handleExtractEntities}
                      disabled={loading}
                      size="small"
                      color="secondary"
                    >
                      Extract Entities
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveDraft}
                      disabled={loading}
                      size="small"
                    >
                      Save Draft
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleInsertIntoStory}
                      disabled={loading}
                      size="small"
                    >
                      Insert into Story
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Edit the text below as needed:
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  minRows={15}
                  value={continuation}
                  onChange={(e) => setContinuation(e.target.value)}
                  variant="outlined"
                  disabled={loading}
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: "Georgia, serif",
                      fontSize: "1rem",
                      lineHeight: 1.8,
                    },
                  }}
                />
              </Paper>
            )}

            {/* Feedback Panel - Only show when there's generated content */}
            {continuation && (
              <FeedbackPanel
                onSubmitFeedback={handleRevise}
                isLoading={loading}
              />
            )}
          </Grid>

          {/* Right Column - Sidebar Tools */}
          <Grid item xs={12} lg={4}>
            {/* Entity Manager - Characters */}
            <EntityManager
              characters={characters}
              onCharactersChange={fetchCharacters}
            />

            {/* Location Manager */}
            <LocationManager
              locations={locations}
              onLocationsChange={fetchLocations}
            />

            {/* Side Notes & Tags */}
            <SideNotesPanel
              notes={sideNotes}
              onNotesChange={setSideNotes}
              tags={tags}
              onTagsChange={setTags}
              sceneType={sceneType}
              onSceneTypeChange={setSceneType}
            />

            {/* Branching */}
            <BranchingPanel
              currentDraftId={currentDraftId}
              onCreateBranch={handleCreateBranch}
              isLoading={loading}
            />

            {/* History */}
            {currentDraftId && (
              <HistoryPanel
                history={history}
                onRestore={handleRestoreHistory}
              />
            )}
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

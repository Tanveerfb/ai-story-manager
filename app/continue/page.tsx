'use client';

import { useEffect, useState } from 'react';
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
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';

import GenerationProgress from '@/components/continue/GenerationProgress';
import FeedbackPanel from '@/components/continue/FeedbackPanel';
import HistoryPanel from '@/components/continue/HistoryPanel';
import BranchingPanel from '@/components/continue/BranchingPanel';
import SideNotesPanel from '@/components/continue/SideNotesPanel';
import ModelSelector from '@/components/continue/ModelSelector';
import EntityManager from '@/components/continue/EntityManager';
import LocationManager from '@/components/continue/LocationManager';

export default function ContinuePage() {
  // Basic state
  const [userPrompt, setUserPrompt] = useState('');
  const [characterFocus, setCharacterFocus] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState('llama3.1:70b'); // Default model
  const [loading, setLoading] = useState(false);
  const [continuation, setContinuation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Advanced state
  const [status, setStatus] = useState('Ready');
  const [contextNotes, setContextNotes] = useState<string[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [sideNotes, setSideNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [sceneType, setSceneType] = useState('');
  const [showPreviousContext, setShowPreviousContext] = useState(true);
  const [recentParts, setRecentParts] = useState<any[]>([]);

  useEffect(() => {
    fetchCharacters();
    fetchLocations();
    fetchRecentParts();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const fetchRecentParts = async () => {
    try {
      const response = await fetch('/api/story-parts');
      if (response.ok) {
        const data = await response.json();
        setRecentParts(data.slice(-3));
      }
    } catch (error) {
      console.error('Failed to fetch recent parts:', error);
    }
  };

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setContinuation(null);
    setStatus('Generating story continuation...');

    try {
      const response = await fetch('/api/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          userPrompt,
          characterFocus: characterFocus || null,
          model: selectedModel, // Include selected model
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setContextNotes(result.contextNotes || []);
      setStatus('Generation complete');
    } catch (err: any) {
      setError(err.message);
      setStatus('Ready');
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
    setStatus('Revising based on your feedback...');

    try {
      const response = await fetch('/api/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise',
          draftId: currentDraftId,
          revisionInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Revision failed');
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setStatus('Revision complete');
      
      // Refresh history if draft exists
      if (currentDraftId) {
        await fetchHistory(currentDraftId);
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('Ready');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWithInstructions = async (revisionInstructions: string) => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt first');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('Generating with your instructions...');

    try {
      const response = await fetch('/api/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          userPrompt,
          characterFocus: characterFocus || null,
          revisionInstructions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setContextNotes(result.contextNotes || []);
      setStatus('Generation complete');
    } catch (err: any) {
      setError(err.message);
      setStatus('Ready');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!continuation) return;

    setLoading(true);
    setError(null);
    setStatus('Saving draft...');

    try {
      const response = await fetch('/api/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-draft',
          userPrompt,
          characterFocus: characterFocus || null,
          generatedContent: continuation, // Include the edited content
          tags,
          sideNotes,
          sceneType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save draft');
      }

      const result = await response.json();
      setCurrentDraftId(result.draft.id);
      setSuccess('Draft saved successfully!');
      setStatus('Ready');
    } catch (err: any) {
      setError(err.message || 'Failed to save draft');
      setStatus('Ready');
    } finally {
      setLoading(false);
    }
  };

  const handleInsertIntoStory = async () => {
    if (!continuation) return;

    setLoading(true);
    setError(null);
    setStatus('Inserting into story...');

    try {
      // Get the next part number
      const partsResponse = await fetch('/api/story-parts');
      const parts = await partsResponse.json();
      const nextPartNumber = parts.length > 0 
        ? Math.max(...parts.map((p: any) => p.part_number)) + 1 
        : 1;

      // Save as a new story part
      const response = await fetch('/api/story-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          part_number: nextPartNumber,
          title: `Continuation - Part ${nextPartNumber}`,
          content: continuation,
          word_count: continuation.split(/\s+/).length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to insert into story');
      }

      setSuccess('Story continuation inserted successfully!');
      handleClear();
      setStatus('Ready');
      fetchRecentParts();
    } catch (err: any) {
      setError(err.message || 'Failed to insert into story');
      setStatus('Ready');
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
      const response = await fetch('/api/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get-history',
          draftId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setHistory(result.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleRestoreHistory = (entry: any) => {
    setContinuation(entry.generated_content);
    setUserPrompt(entry.user_prompt);
  };

  const handleCreateBranch = async (branchName: string, branchPrompt: string, branchNotes: string) => {
    if (!currentDraftId) {
      setError('Please save a draft first before creating branches');
      return;
    }

    setLoading(true);
    setError(null);
    setStatus('Creating branch...');

    try {
      const response = await fetch('/api/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'branch',
          draftId: currentDraftId,
          branchName,
          userPrompt: branchPrompt,
          characterFocus: characterFocus || null,
          sideNotes: branchNotes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create branch');
      }

      const result = await response.json();
      setSuccess(`Branch "${branchName}" created successfully!`);
      setStatus('Ready');
    } catch (err: any) {
      setError(err.message || 'Failed to create branch');
      setStatus('Ready');
    } finally {
      setLoading(false);
    }
  };

  const promptTemplates = [
    { label: 'Continue from cliffhanger', prompt: 'Continue from the cliffhanger, building tension' },
    { 
      label: "Describe character's reaction", 
      prompt: characterFocus 
        ? `Describe ${characterFocus}'s emotional reaction to recent events` 
        : "Describe the main character's emotional reaction to recent events"
    },
    { label: 'Add dialogue scene', prompt: 'Write a dialogue-heavy scene that reveals character motivations' },
    { label: 'Describe setting', prompt: 'Provide rich, atmospheric description of the current setting' },
    { label: 'Plot twist', prompt: 'Introduce an unexpected plot development that changes everything' },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <AutoAwesomeIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              AI-First Story Creation
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create stories from scratch with AI assistance - build narrative, entities, and locations live
            </Typography>
          </Box>
        </Box>

        {/* Info Alert */}
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
          <strong>Welcome to AI-First Authoring:</strong> Start with an empty canvas and let AI help you create. 
          Use [ --- note ] markers for in-context instructions. Create characters and locations on the fly. 
          Switch between models to find your perfect creative partner.
        </Alert>

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
                        Part {part.part_number}: {part.title || 'Untitled'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {part.summary || part.content.substring(0, 200) + '...'}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Main Prompt Input */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Your Prompt
              </Typography>

              {/* Model Selector */}
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={loading}
              />

              <TextField
                fullWidth
                multiline
                rows={6}
                placeholder="Describe what should happen next in the story...
                
Use [ --- ] markers for in-context notes, e.g.:
[ --- Make this scene intense and emotional ]
Duke confronts the villain..."
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={loading}
              />

              <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }}>
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
                  sx={{ flex: 1, minWidth: 200 }}
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
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Quick Templates:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
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
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
                {success}
              </Alert>
            )}

            {/* Generated Output */}
            {continuation && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6">Generated Continuation</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
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

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                    '& .MuiInputBase-root': {
                      fontFamily: 'Georgia, serif',
                      fontSize: '1rem',
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

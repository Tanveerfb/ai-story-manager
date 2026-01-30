'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

export default function ContinuePage() {
  const [userPrompt, setUserPrompt] = useState('');
  const [characterFocus, setCharacterFocus] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [continuation, setContinuation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCharacters();
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

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setLoading(true);
    setError(null);
    setContinuation(null);

    try {
      const response = await fetch('/api/continue-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          characterFocus,
          saveAsNewPart: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const result = await response.json();
      setContinuation(result.continuation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!continuation) return;

    try {
      const response = await fetch('/api/continue-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt,
          characterFocus,
          saveAsNewPart: true,
        }),
      });

      if (response.ok) {
        alert('Story continuation saved!');
      }
    } catch (err) {
      alert('Failed to save continuation');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Continue Story
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Provide a prompt and let the AI continue your story with full context awareness.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Prompt"
              placeholder="Describe what should happen next in the story..."
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Focus Character (Optional)</InputLabel>
              <Select
                value={characterFocus}
                label="Focus Character (Optional)"
                onChange={(e) => setCharacterFocus(e.target.value)}
              >
                <MenuItem value="">None</MenuItem>
                {characters.map((char) => (
                  <MenuItem key={char.id} value={char.name}>
                    {char.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleGenerate}
              disabled={loading}
              sx={{ height: '56px' }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  Generating...
                </>
              ) : (
                'Generate Continuation'
              )}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {continuation && (
          <Paper sx={{ mt: 4, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Generated Continuation</Typography>
              <Button variant="outlined" onClick={handleSave}>
                Save as New Part
              </Button>
            </Box>
            <Typography
              variant="body1"
              sx={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}
            >
              {continuation}
            </Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Chip,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SaveIcon from '@mui/icons-material/Save';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BookmarkIcon from '@mui/icons-material/Bookmark';

interface SearchResult {
  id: string;
  type: 'event' | 'story_part';
  content: string;
  description?: string;
  characters?: string[];
  locations?: string[];
  storyPartNumber?: number;
  relevanceScore?: number;
}

interface Flashback {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  created_at: string;
}

export default function FlashbacksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [characterFilter, setCharacterFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedFlashbacks, setSavedFlashbacks] = useState<Flashback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [flashbackTitle, setFlashbackTitle] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [charsRes, locsRes, flashbacksRes] = await Promise.all([
        fetch('/api/characters'),
        fetch('/api/locations'),
        fetch('/api/flashbacks/save'),
      ]);

      if (charsRes.ok) {
        const data = await charsRes.json();
        setCharacters(data);
      }

      if (locsRes.ok) {
        const data = await locsRes.json();
        setLocations(data);
      }

      if (flashbacksRes.ok) {
        const data = await flashbacksRes.json();
        setSavedFlashbacks(data);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !characterFilter && !locationFilter) {
      setError('Please enter a search query or select filters');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery);
      if (characterFilter) params.append('character', characterFilter);
      if (locationFilter) params.append('location', locationFilter);

      const response = await fetch(`/api/flashbacks/search?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const results = await response.json();
      setSearchResults(results);

      if (results.length === 0) {
        setError('No matching scenes found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = (result: SearchResult) => {
    setSelectedResult(result);
    setFlashbackTitle('');
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedResult || !flashbackTitle.trim()) {
      setError('Please enter a title for the flashback');
      return;
    }

    setSaveDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/flashbacks/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: flashbackTitle,
          content: selectedResult.content,
          keywords: searchQuery.split(/\s+/).filter((w) => w.length > 2),
          description: selectedResult.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save flashback');
      }

      setSuccess('Flashback saved successfully!');
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlashback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flashback?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashbacks/save?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete flashback');
      }

      setSuccess('Flashback deleted successfully');
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete flashback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Story Flashbacks
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Search for key scenes and moments in your story by keyword, character, or location.
          Save important scenes as flashbacks for easy reference.
        </Typography>

        {/* Search Section */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Search Scenes
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Search Keywords"
                placeholder="Enter keywords to search for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Filter by Character</InputLabel>
                <Select
                  value={characterFilter}
                  label="Filter by Character"
                  onChange={(e) => setCharacterFilter(e.target.value)}
                >
                  <MenuItem value="">All Characters</MenuItem>
                  {characters.map((char) => (
                    <MenuItem key={char.id} value={char.name}>
                      {char.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={5}>
              <FormControl fullWidth>
                <InputLabel>Filter by Location</InputLabel>
                <Select
                  value={locationFilter}
                  label="Filter by Location"
                  onChange={(e) => setLocationFilter(e.target.value)}
                >
                  <MenuItem value="">All Locations</MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.name}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Search Results ({searchResults.length})
            </Typography>
            <Grid container spacing={2}>
              {searchResults.map((result, index) => (
                <Grid item xs={12} key={index}>
                  <Card>
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Chip
                            label={result.type === 'event' ? 'Event' : `Part ${result.storyPartNumber}`}
                            size="small"
                            color="primary"
                            sx={{ mb: 1 }}
                          />
                          {result.description && (
                            <Typography variant="subtitle1" fontWeight="bold">
                              {result.description}
                            </Typography>
                          )}
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<SaveIcon />}
                          onClick={() => handleSaveClick(result)}
                        >
                          Save as Flashback
                        </Button>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'Georgia, serif',
                          color: 'text.secondary',
                        }}
                      >
                        {result.content.slice(0, 500)}
                        {result.content.length > 500 ? '...' : ''}
                      </Typography>
                      {(result.characters || result.locations) && (
                        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {result.characters?.map((char, i) => (
                            <Chip key={i} label={char} size="small" variant="outlined" />
                          ))}
                          {result.locations?.map((loc, i) => (
                            <Chip
                              key={i}
                              label={loc}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Saved Flashbacks */}
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BookmarkIcon />
            Saved Flashbacks ({savedFlashbacks.length})
          </Typography>
          {savedFlashbacks.length === 0 ? (
            <Alert severity="info">
              No saved flashbacks yet. Search for scenes and save them as flashbacks for quick reference.
            </Alert>
          ) : (
            savedFlashbacks.map((flashback) => (
              <Accordion key={flashback.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography variant="h6">{flashback.title}</Typography>
                    <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                      {flashback.keywords.slice(0, 3).map((keyword, i) => (
                        <Chip key={i} label={keyword} size="small" />
                      ))}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'Georgia, serif',
                        mb: 2,
                      }}
                    >
                      {flashback.content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleDeleteFlashback(flashback.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Box>
      </Box>

      {/* Save Flashback Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Save as Flashback</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Flashback Title"
              placeholder="Enter a descriptive title..."
              value={flashbackTitle}
              onChange={(e) => setFlashbackTitle(e.target.value)}
              autoFocus
            />
            {selectedResult && (
              <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" color="text.secondary">
                  Preview:
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedResult.content.slice(0, 200)}...
                </Typography>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmSave}
            color="primary"
            variant="contained"
            disabled={!flashbackTitle.trim()}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

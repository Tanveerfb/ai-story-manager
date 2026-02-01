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
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface UnlinkedName {
  name: string;
  usageCount: number;
  contexts: string[];
  suggestedMatches: Array<{ id: string; name: string; score: number }>;
}

export default function UnlinkedCharactersPage() {
  const [unlinkedNames, setUnlinkedNames] = useState<UnlinkedName[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedName, setSelectedName] = useState<UnlinkedName | null>(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [unlinkedRes, charactersRes] = await Promise.all([
        fetch('/api/characters/unlinked'),
        fetch('/api/characters'),
      ]);

      if (unlinkedRes.ok) {
        const unlinkedData = await unlinkedRes.json();
        setUnlinkedNames(unlinkedData);
      }

      if (charactersRes.ok) {
        const charactersData = await charactersRes.json();
        setCharacters(charactersData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load unlinked characters');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkClick = (name: UnlinkedName) => {
    setSelectedName(name);
    setSelectedCharacterId(
      name.suggestedMatches.length > 0 ? name.suggestedMatches[0].id : ''
    );
    setLinkDialogOpen(true);
  };

  const handleConfirmLink = async () => {
    if (!selectedName || !selectedCharacterId) return;

    setLinkDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/characters/link-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: selectedCharacterId,
          alias: selectedName.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to link nickname');
      }

      setSuccess(`Successfully linked "${selectedName.name}" to character`);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteName = async (name: string) => {
    if (!confirm(`Are you sure you want to ignore "${name}"?`)) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/characters/unlinked', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete name');
      }

      setSuccess(`Successfully ignored "${name}"`);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Missing Character Names
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          These names appear in events or relationships but are not linked to any canonical character.
          Link them to existing characters or ignore them.
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

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

        {!loading && unlinkedNames.length === 0 ? (
          <Alert severity="success" icon={<CheckCircleIcon />}>
            All character names are properly linked!
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {unlinkedNames.map((unlinkedName) => (
              <Grid item xs={12} key={unlinkedName.name}>
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
                        <Typography variant="h6" component="div">
                          {unlinkedName.name}
                        </Typography>
                        <Chip
                          label={`${unlinkedName.usageCount} occurrence${unlinkedName.usageCount > 1 ? 's' : ''}`}
                          size="small"
                          color="primary"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                      <Box>
                        <Tooltip title="Link to Character">
                          <IconButton
                            color="primary"
                            onClick={() => handleLinkClick(unlinkedName)}
                            disabled={loading}
                          >
                            <LinkIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Ignore">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteName(unlinkedName.name)}
                            disabled={loading}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {unlinkedName.contexts.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Context Preview:
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontStyle: 'italic', color: 'text.secondary' }}
                        >
                          {unlinkedName.contexts[0].slice(0, 150)}...
                        </Typography>
                      </Box>
                    )}

                    {unlinkedName.suggestedMatches.length > 0 && (
                      <Box>
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          gutterBottom
                        >
                          Suggested Matches:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {unlinkedName.suggestedMatches.map((match) => (
                            <Chip
                              key={match.id}
                              label={`${match.name} (${(match.score * 100).toFixed(0)}%)`}
                              size="small"
                              variant="outlined"
                              color="secondary"
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Link Dialog */}
      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Link Name to Character</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Link "{selectedName?.name}" to:
            </Typography>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Select Character</InputLabel>
              <Select
                value={selectedCharacterId}
                label="Select Character"
                onChange={(e) => setSelectedCharacterId(e.target.value)}
              >
                {characters.map((char) => (
                  <MenuItem key={char.id} value={char.id}>
                    {char.name} ({char.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmLink}
            color="primary"
            variant="contained"
            disabled={!selectedCharacterId}
          >
            Link
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

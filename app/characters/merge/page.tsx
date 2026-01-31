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
  Avatar,
  Checkbox,
} from '@mui/material';
import { useRouter } from 'next/navigation';

interface Character {
  id: string;
  name: string;
  role: string;
  description?: string;
  personality?: string;
  avatar_url?: string;
}

export default function MergeCharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<Character[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    let filtered = characters;

    if (searchTerm) {
      filtered = filtered.filter((char) =>
        char.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCharacters(filtered);
  }, [characters, searchTerm]);

  const fetchCharacters = async () => {
    try {
      const response = await fetch('/api/characters');
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
        setFilteredCharacters(data);
      }
    } catch (error) {
      console.error('Failed to fetch characters:', error);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        // If deselecting the primary, clear primary
        if (id === primaryId) {
          setPrimaryId(null);
        }
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSetPrimary = (id: string) => {
    if (selectedIds.includes(id)) {
      setPrimaryId(id);
    }
  };

  const handleMergeClick = () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 characters to merge');
      return;
    }

    if (!primaryId) {
      setError('Please set a primary character');
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirmMerge = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const duplicateIds = selectedIds.filter((id) => id !== primaryId);

      const response = await fetch('/api/characters/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryCharacterId: primaryId,
          duplicateCharacterIds: duplicateIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Merge failed');
      }

      const result = await response.json();
      setSuccess(result.message);
      setSelectedIds([]);
      setPrimaryId(null);

      // Refresh character list
      await fetchCharacters();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMerge = () => {
    setConfirmDialogOpen(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'main':
        return 'primary';
      case 'side':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const primaryCharacter = characters.find((c) => c.id === primaryId);
  const duplicateCharacters = characters.filter(
    (c) => selectedIds.includes(c.id) && c.id !== primaryId
  );

  const canMerge = selectedIds.length >= 2 && primaryId !== null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Merge Characters
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Select duplicate characters to merge. Choose one as the primary character to keep,
          and the others will be merged into it and deleted.
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Search by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
          />

          {selectedIds.length > 0 && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Selected Characters ({selectedIds.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedIds.map((id) => {
                  const char = characters.find((c) => c.id === id);
                  return char ? (
                    <Chip
                      key={id}
                      label={char.name}
                      onDelete={() => toggleSelection(id)}
                      color={id === primaryId ? 'primary' : 'default'}
                    />
                  ) : null;
                })}
              </Box>
            </Paper>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleMergeClick}
            disabled={!canMerge || loading}
            sx={{ mb: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Merging...
              </>
            ) : (
              'Merge Selected Characters'
            )}
          </Button>
        </Box>

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

        {filteredCharacters.length === 0 ? (
          <Typography color="text.secondary">
            No characters found. Import a story to extract characters.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredCharacters.map((character) => {
              const isSelected = selectedIds.includes(character.id);
              const isPrimary = character.id === primaryId;

              return (
                <Grid item xs={12} sm={6} md={4} key={character.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: isPrimary
                        ? '3px solid #1976d2'
                        : isSelected
                        ? '2px solid #1976d2'
                        : '1px solid transparent',
                      '&:hover': { boxShadow: 6 },
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleSelection(character.id)}
                        />
                        <Avatar
                          src={character.avatar_url}
                          alt={character.name}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          {character.name[0]}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" component="div">
                            {character.name}
                          </Typography>
                          <Chip
                            label={character.role}
                            size="small"
                            color={getRoleColor(character.role)}
                          />
                          {isPrimary && (
                            <Chip
                              label="PRIMARY"
                              size="small"
                              color="primary"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Box>
                      </Box>

                      {character.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {character.description.slice(0, 100)}
                          {character.description.length > 100 ? '...' : ''}
                        </Typography>
                      )}

                      {isSelected && !isPrimary && (
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          onClick={() => handleSetPrimary(character.id)}
                        >
                          Set as Primary
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelMerge}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Character Merge</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The duplicate characters will be
            permanently deleted.
          </Alert>

          {primaryCharacter && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Primary Character (KEEP)
              </Typography>
              <Typography variant="h6">{primaryCharacter.name}</Typography>
              <Typography variant="body2">
                Role: {primaryCharacter.role}
              </Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Characters to Delete ({duplicateCharacters.length})
            </Typography>
            {duplicateCharacters.map((char) => (
              <Typography key={char.id} variant="body2">
                • {char.name}
              </Typography>
            ))}
          </Paper>

          <Typography variant="body2" sx={{ mt: 2 }}>
            All data from duplicate characters will be merged into the primary
            character, and all relationships will be updated to point to the
            primary character.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelMerge}>Cancel</Button>
          <Button onClick={handleConfirmMerge} color="primary" variant="contained">
            Confirm Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

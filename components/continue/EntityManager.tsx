'use client';

import { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';

/**
 * Entity Manager Component - Character Management
 * Allows live creation, editing, and deletion of characters
 * Supports auto-suggestions from existing characters
 */

interface Character {
  id: string;
  name: string;
  role?: string;
  personality?: string;
  traits?: string[];
  description?: string;
}

interface EntityManagerProps {
  characters: Character[];
  onCharactersChange: () => void;
}

export default function EntityManager({ characters, onCharactersChange }: EntityManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    role: 'side',
    personality: '',
    traits: [] as string[],
    description: '',
  });
  const [traitsInput, setTraitsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Opens dialog for creating a new character
   */
  const handleOpenCreate = () => {
    setEditingCharacter(null);
    setNewCharacter({
      name: '',
      role: 'side',
      personality: '',
      traits: [],
      description: '',
    });
    setTraitsInput('');
    setDialogOpen(true);
  };

  /**
   * Opens dialog for editing an existing character
   */
  const handleOpenEdit = (character: Character) => {
    setEditingCharacter(character);
    setNewCharacter({
      name: character.name,
      role: character.role || 'side',
      personality: character.personality || '',
      traits: character.traits || [],
      description: character.description || '',
    });
    setTraitsInput((character.traits || []).join(', '));
    setDialogOpen(true);
  };

  /**
   * Closes the create/edit dialog
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCharacter(null);
    setError(null);
  };

  /**
   * Saves a new character or updates an existing one
   */
  const handleSaveCharacter = async () => {
    if (!newCharacter.name.trim()) {
      setError('Character name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Parse traits from comma-separated string
      const traits = traitsInput
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const characterData = {
        ...newCharacter,
        traits,
      };

      const url = editingCharacter
        ? `/api/characters/${editingCharacter.id}`
        : '/api/characters';
      
      const method = editingCharacter ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(characterData),
      });

      if (!response.ok) {
        throw new Error('Failed to save character');
      }

      handleCloseDialog();
      onCharactersChange();
    } catch (err: any) {
      setError(err.message || 'Failed to save character');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a character
   */
  const handleDeleteCharacter = async (characterId: string) => {
    if (!confirm('Are you sure you want to delete this character?')) {
      return;
    }

    try {
      const response = await fetch(`/api/characters/${characterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete character');
      }

      onCharactersChange();
    } catch (err: any) {
      console.error('Failed to delete character:', err);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <Typography variant="h6">Characters</Typography>
        </Box>
        <Tooltip title="Create new character">
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Add
          </Button>
        </Tooltip>
      </Box>

      {characters.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No characters yet. Create your first character to get started!
        </Typography>
      ) : (
        <List dense>
          {characters.slice(0, 5).map((character) => (
            <ListItem
              key={character.id}
              secondaryAction={
                <Box>
                  <Tooltip title="Edit character">
                    <IconButton edge="end" size="small" onClick={() => handleOpenEdit(character)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete character">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteCharacter(character.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              }
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {character.name}
                    {character.role && (
                      <Chip label={character.role} size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={character.personality || 'No description'}
              />
            </ListItem>
          ))}
        </List>
      )}

      {characters.length > 5 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          Showing 5 of {characters.length} characters
        </Typography>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCharacter ? 'Edit Character' : 'Create New Character'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <TextField
            fullWidth
            label="Character Name"
            value={newCharacter.name}
            onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            select
            label="Role"
            value={newCharacter.role}
            onChange={(e) => setNewCharacter({ ...newCharacter, role: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="main">Main Character</option>
            <option value="side">Side Character</option>
            <option value="minor">Minor Character</option>
          </TextField>

          <TextField
            fullWidth
            label="Personality"
            value={newCharacter.personality}
            onChange={(e) => setNewCharacter({ ...newCharacter, personality: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            placeholder="Brief personality description..."
          />

          <TextField
            fullWidth
            label="Traits (comma-separated)"
            value={traitsInput}
            onChange={(e) => setTraitsInput(e.target.value)}
            margin="normal"
            placeholder="brave, intelligent, stubborn"
            helperText="Enter character traits separated by commas"
          />

          <TextField
            fullWidth
            label="Physical Description"
            value={newCharacter.description}
            onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            placeholder="Physical appearance..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveCharacter}
            variant="contained"
            disabled={loading || !newCharacter.name.trim()}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

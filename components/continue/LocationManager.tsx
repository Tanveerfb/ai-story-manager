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
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlaceIcon from '@mui/icons-material/Place';

/**
 * Location Manager Component
 * Allows live creation, editing, and deletion of story locations
 */

interface Location {
  id: string;
  name: string;
  type?: string;
  description?: string;
  atmosphere?: string;
}

interface LocationManagerProps {
  locations: Location[];
  onLocationsChange: () => void;
}

export default function LocationManager({ locations, onLocationsChange }: LocationManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'indoor',
    description: '',
    atmosphere: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Opens dialog for creating a new location
   */
  const handleOpenCreate = () => {
    setEditingLocation(null);
    setNewLocation({
      name: '',
      type: 'indoor',
      description: '',
      atmosphere: '',
    });
    setDialogOpen(true);
  };

  /**
   * Opens dialog for editing an existing location
   */
  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      type: location.type || 'indoor',
      description: location.description || '',
      atmosphere: location.atmosphere || '',
    });
    setDialogOpen(true);
  };

  /**
   * Closes the create/edit dialog
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
    setError(null);
  };

  /**
   * Saves a new location or updates an existing one
   */
  const handleSaveLocation = async () => {
    if (!newLocation.name.trim()) {
      setError('Location name is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : '/api/locations';
      
      const method = editingLocation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation),
      });

      if (!response.ok) {
        throw new Error('Failed to save location');
      }

      handleCloseDialog();
      onLocationsChange();
    } catch (err: any) {
      setError(err.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a location
   */
  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete location');
      }

      onLocationsChange();
    } catch (err: any) {
      console.error('Failed to delete location:', err);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PlaceIcon color="primary" />
          <Typography variant="h6">Locations</Typography>
        </Box>
        <Tooltip title="Create new location">
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

      {locations.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No locations yet. Create your first location to get started!
        </Typography>
      ) : (
        <List dense>
          {locations.slice(0, 5).map((location) => (
            <ListItem
              key={location.id}
              secondaryAction={
                <Box>
                  <Tooltip title="Edit location">
                    <IconButton edge="end" size="small" onClick={() => handleOpenEdit(location)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete location">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeleteLocation(location.id)}
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
                    {location.name}
                    {location.type && (
                      <Chip label={location.type} size="small" variant="outlined" />
                    )}
                  </Box>
                }
                secondary={location.description || 'No description'}
              />
            </ListItem>
          ))}
        </List>
      )}

      {locations.length > 5 && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
          Showing 5 of {locations.length} locations
        </Typography>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Create New Location'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <TextField
            fullWidth
            label="Location Name"
            value={newLocation.name}
            onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
            margin="normal"
            required
          />

          <TextField
            fullWidth
            select
            label="Type"
            value={newLocation.type}
            onChange={(e) => setNewLocation({ ...newLocation, type: e.target.value })}
            margin="normal"
            SelectProps={{ native: true }}
          >
            <option value="indoor">Indoor</option>
            <option value="outdoor">Outdoor</option>
            <option value="public">Public Place</option>
            <option value="private">Private Place</option>
            <option value="natural">Natural Setting</option>
            <option value="urban">Urban Setting</option>
          </TextField>

          <TextField
            fullWidth
            label="Description"
            value={newLocation.description}
            onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            placeholder="Describe the location..."
          />

          <TextField
            fullWidth
            label="Atmosphere"
            value={newLocation.atmosphere}
            onChange={(e) => setNewLocation({ ...newLocation, atmosphere: e.target.value })}
            margin="normal"
            placeholder="e.g., tense, peaceful, mysterious"
            helperText="The mood or feeling of this location"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveLocation}
            variant="contained"
            disabled={loading || !newLocation.name.trim()}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

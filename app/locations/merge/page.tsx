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
  Checkbox,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MergeTypeIcon from '@mui/icons-material/MergeType';

interface Location {
  id: string;
  name: string;
  description?: string;
  type?: string;
  importance?: string;
  usageCount?: number;
}

interface LocationGroup {
  locations: Location[];
  similarityScore: number;
}

export default function LocationsMergePage() {
  const [tabValue, setTabValue] = useState(0);
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [suggestedGroups, setSuggestedGroups] = useState<LocationGroup[]>([]);
  const [unusedLocations, setUnusedLocations] = useState<Location[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = locations;

    if (searchTerm) {
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLocations(filtered);
  }, [locations, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locationsRes, suggestionsRes, unusedRes] = await Promise.all([
        fetch('/api/locations'),
        fetch('/api/locations/suggestions'),
        fetch('/api/locations/unused'),
      ]);

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data);
        setFilteredLocations(data);
      }

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestedGroups(data);
      }

      if (unusedRes.ok) {
        const data = await unusedRes.json();
        setUnusedLocations(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
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
      setError('Please select at least 2 locations to merge');
      return;
    }

    if (!primaryId) {
      setError('Please set a primary location');
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

      const response = await fetch('/api/locations/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryLocationId: primaryId,
          duplicateLocationIds: duplicateIds,
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

      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/locations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      setSuccess('Location deleted successfully');
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestedGroup = (group: LocationGroup) => {
    const ids = group.locations.map((loc) => loc.id);
    setSelectedIds(ids);
    setPrimaryId(ids[0]);
    setTabValue(0); // Switch to main tab
  };

  const primaryLocation = locations.find((l) => l.id === primaryId);
  const duplicateLocations = locations.filter(
    (l) => selectedIds.includes(l.id) && l.id !== primaryId
  );

  const canMerge = selectedIds.length >= 2 && primaryId !== null;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Locations Merge & Review
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Merge duplicate locations, review unused locations, and clean up your location database.
        </Typography>

        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
          <Tab label="All Locations" />
          <Tab label="Suggested Merges" />
          <Tab label={`Unused (${unusedLocations.length})`} />
        </Tabs>

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

        {/* Tab 0: All Locations */}
        {tabValue === 0 && (
          <>
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
                    Selected Locations ({selectedIds.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedIds.map((id) => {
                      const loc = locations.find((l) => l.id === id);
                      return loc ? (
                        <Chip
                          key={id}
                          label={loc.name}
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
                startIcon={<MergeTypeIcon />}
                sx={{ mb: 2 }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 2 }} />
                    Merging...
                  </>
                ) : (
                  'Merge Selected Locations'
                )}
              </Button>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredLocations.length === 0 ? (
              <Typography color="text.secondary">
                No locations found. Import a story to extract locations.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {filteredLocations.map((location) => {
                  const isSelected = selectedIds.includes(location.id);
                  const isPrimary = location.id === primaryId;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={location.id}>
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
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleSelection(location.id)}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="h6" component="div">
                                {location.name}
                              </Typography>
                              {location.type && (
                                <Chip label={location.type} size="small" sx={{ mt: 1 }} />
                              )}
                              {isPrimary && (
                                <Chip
                                  label="PRIMARY"
                                  size="small"
                                  color="primary"
                                  sx={{ ml: 1, mt: 1 }}
                                />
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteLocation(location.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>

                          {location.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {location.description.slice(0, 100)}
                              {location.description.length > 100 ? '...' : ''}
                            </Typography>
                          )}

                          {isSelected && !isPrimary && (
                            <Button
                              size="small"
                              variant="outlined"
                              fullWidth
                              onClick={() => handleSetPrimary(location.id)}
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
          </>
        )}

        {/* Tab 1: Suggested Merges */}
        {tabValue === 1 && (
          <Box>
            {suggestedGroups.length === 0 ? (
              <Alert severity="info">No duplicate locations detected!</Alert>
            ) : (
              <Grid container spacing={3}>
                {suggestedGroups.map((group, idx) => (
                  <Grid item xs={12} key={idx}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Possible Duplicates (
                          {(group.similarityScore * 100).toFixed(0)}% similar)
                        </Typography>
                        <List>
                          {group.locations.map((loc) => (
                            <ListItem key={loc.id}>
                              <ListItemText primary={loc.name} secondary={loc.description} />
                            </ListItem>
                          ))}
                        </List>
                        <Button
                          variant="contained"
                          onClick={() => handleSelectSuggestedGroup(group)}
                        >
                          Select for Merge
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Tab 2: Unused Locations */}
        {tabValue === 2 && (
          <Box>
            {unusedLocations.length === 0 ? (
              <Alert severity="success">All locations are in use!</Alert>
            ) : (
              <Grid container spacing={3}>
                {unusedLocations.map((location) => (
                  <Grid item xs={12} sm={6} md={4} key={location.id}>
                    <Card>
                      <CardContent>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" component="div">
                              {location.name}
                            </Typography>
                            <Chip
                              label={`Used ${location.usageCount || 0} time${(location.usageCount || 0) === 1 ? '' : 's'}`}
                              size="small"
                              color={location.usageCount === 0 ? 'error' : 'warning'}
                              sx={{ mt: 1 }}
                            />
                          </Box>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                        {location.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {location.description}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Location Merge</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. The duplicate locations will be permanently deleted.
          </Alert>

          {primaryLocation && (
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.light' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Primary Location (KEEP)
              </Typography>
              <Typography variant="h6">{primaryLocation.name}</Typography>
              <Typography variant="body2">Type: {primaryLocation.type}</Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Locations to Delete ({duplicateLocations.length})
            </Typography>
            {duplicateLocations.map((loc) => (
              <Typography key={loc.id} variant="body2">
                • {loc.name}
              </Typography>
            ))}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmMerge} color="primary" variant="contained">
            Confirm Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Card,
  CardContent,
} from '@mui/material';

export default function TimelinePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (eventTypeFilter) {
      filtered = filtered.filter((event) => event.event_type === eventTypeFilter);
    }

    setFilteredEvents(filtered);
  }, [events, eventTypeFilter]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const getEventColor = (type: string): 'primary' | 'secondary' | 'error' | 'default' => {
    switch (type) {
      case 'dialogue':
        return 'primary';
      case 'action':
        return 'secondary';
      case 'revelation':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Events Timeline
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Event Type</InputLabel>
              <Select
                value={eventTypeFilter}
                label="Filter by Event Type"
                onChange={(e) => setEventTypeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="dialogue">Dialogue</MenuItem>
                <MenuItem value="action">Action</MenuItem>
                <MenuItem value="revelation">Revelation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {filteredEvents.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No events found. Import a story to extract events.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {filteredEvents.map((event, index) => (
              <Grid item xs={12} key={event.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Chip
                        label={event.event_type}
                        size="small"
                        color={getEventColor(event.event_type)}
                      />
                      {event.timestamp_in_story && (
                        <Typography variant="caption" color="text.secondary">
                          {event.timestamp_in_story}
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {event.description}
                    </Typography>
                    {event.content && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {event.content}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      {event.characters && (
                        <Typography variant="caption">
                          Character: {event.characters.name}
                        </Typography>
                      )}
                      {event.locations && (
                        <Typography variant="caption">
                          Location: {event.locations.name}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

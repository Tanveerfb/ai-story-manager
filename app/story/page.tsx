'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';

export default function StoryPage() {
  const [storyParts, setStoryParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchStoryParts();
  }, []);

  const fetchStoryParts = async () => {
    try {
      const response = await fetch('/api/story-parts');
      if (response.ok) {
        const data = await response.json();
        setStoryParts(data);
      }
    } catch (error) {
      console.error('Failed to fetch story parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParts = storyParts.filter(
    (part) =>
      part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Story Viewer
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push('/continue')}
          >
            Continue Story
          </Button>
        </Box>

        <TextField
          fullWidth
          label="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
        />

        {loading ? (
          <Typography>Loading...</Typography>
        ) : filteredParts.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No story parts found. Import a story to get started.
            </Typography>
          </Paper>
        ) : (
          filteredParts.map((part) => (
            <Accordion key={part.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Chip label={`Part ${part.part_number}`} color="primary" />
                  <Typography variant="h6">
                    {part.title || 'Untitled'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    {part.word_count} words
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {part.summary && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Summary:
                    </Typography>
                    <Typography variant="body2">{part.summary}</Typography>
                  </Paper>
                )}
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif' }}
                >
                  {part.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Container>
  );
}

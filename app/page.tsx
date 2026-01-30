'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CreateIcon from '@mui/icons-material/Create';
import PeopleIcon from '@mui/icons-material/People';
import MenuBookIcon from '@mui/icons-material/MenuBook';

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState({
    storyParts: 0,
    characters: 0,
    locations: 0,
  });

  useEffect(() => {
    // Fetch statistics
    const fetchStats = async () => {
      try {
        const [partsRes, charsRes, locsRes] = await Promise.all([
          fetch('/api/story-parts'),
          fetch('/api/characters'),
          fetch('/api/locations'),
        ]);

        if (partsRes.ok) {
          const parts = await partsRes.json();
          setStats((prev) => ({ ...prev, storyParts: parts.length || 0 }));
        }
        if (charsRes.ok) {
          const chars = await charsRes.json();
          setStats((prev) => ({ ...prev, characters: chars.length || 0 }));
        }
        if (locsRes.ok) {
          const locs = await locsRes.json();
          setStats((prev) => ({ ...prev, locations: locs.length || 0 }));
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to AI Story Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage your stories, characters, and continue writing with AI assistance.
        </Typography>

        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  {stats.storyParts}
                </Typography>
                <Typography color="text.secondary">Story Parts</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  {stats.characters}
                </Typography>
                <Typography color="text.secondary">Characters</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  {stats.locations}
                </Typography>
                <Typography color="text.secondary">Locations</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<UploadFileIcon />}
                onClick={() => router.push('/import')}
                sx={{ py: 2 }}
              >
                Import Story
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<CreateIcon />}
                onClick={() => router.push('/continue')}
                sx={{ py: 2 }}
              >
                Continue Story
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<MenuBookIcon />}
                onClick={() => router.push('/story')}
                sx={{ py: 2 }}
              >
                View Story
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<PeopleIcon />}
                onClick={() => router.push('/characters')}
                sx={{ py: 2 }}
              >
                Characters
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
}

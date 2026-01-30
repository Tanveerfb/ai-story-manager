'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Grid,
} from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function CharacterDetailPage() {
  const params = useParams();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchCharacter(id);
    }
  }, [params]);

  const fetchCharacter = async (id: string) => {
    try {
      const response = await fetch(`/api/characters/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCharacter(data);
      }
    } catch (error) {
      console.error('Failed to fetch character:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (!character) {
    return <Typography>Character not found</Typography>;
  }

  const personality = character.personality
    ? typeof character.personality === 'string'
      ? JSON.parse(character.personality)
      : character.personality
    : [];

  const physicalTraits = character.physical_traits
    ? typeof character.physical_traits === 'string'
      ? JSON.parse(character.physical_traits)
      : character.physical_traits
    : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item>
              <Avatar
                src={character.avatar_url}
                alt={character.name}
                sx={{ width: 120, height: 120 }}
              >
                {character.name[0]}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" gutterBottom>
                {character.name}
              </Typography>
              <Chip label={character.role} color="primary" sx={{ mb: 2 }} />
              {character.description && (
                <Typography variant="body1" paragraph>
                  {character.description}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>

        <Paper>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab label="Overview" />
            <Tab label="Traits" />
            <Tab label="Relationships" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Background
            </Typography>
            <Typography paragraph>
              {character.background || 'No background information available.'}
            </Typography>

            {character.first_appearance_part && (
              <Typography variant="body2" color="text.secondary">
                First appeared in Part {character.first_appearance_part}
              </Typography>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Personality Traits
            </Typography>
            <Box sx={{ mb: 3 }}>
              {Array.isArray(personality) && personality.length > 0 ? (
                personality.map((trait: any, index: number) => (
                  <Chip
                    key={index}
                    label={typeof trait === 'string' ? trait : trait.name || trait}
                    sx={{ m: 0.5 }}
                  />
                ))
              ) : (
                <Typography color="text.secondary">No personality traits recorded.</Typography>
              )}
            </Box>

            <Typography variant="h6" gutterBottom>
              Physical Traits
            </Typography>
            <Box>
              {Array.isArray(physicalTraits) && physicalTraits.length > 0 ? (
                physicalTraits.map((trait: any, index: number) => (
                  <Chip
                    key={index}
                    label={typeof trait === 'string' ? trait : trait.name || trait}
                    color="secondary"
                    sx={{ m: 0.5 }}
                  />
                ))
              ) : (
                <Typography color="text.secondary">No physical traits recorded.</Typography>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Relationships
            </Typography>
            {character.relationships && character.relationships.length > 0 ? (
              character.relationships.map((rel: any) => (
                <Paper key={rel.id} sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    {rel.relationship_type}
                  </Typography>
                  {rel.description && (
                    <Typography variant="body2">{rel.description}</Typography>
                  )}
                </Paper>
              ))
            ) : (
              <Typography color="text.secondary">No relationships recorded.</Typography>
            )}
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

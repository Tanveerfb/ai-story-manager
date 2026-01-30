'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';
import CharacterCard from '@/components/CharacterCard';
import { useRouter } from 'next/navigation';

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
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

    if (roleFilter) {
      filtered = filtered.filter((char) => char.role === roleFilter);
    }

    setFilteredCharacters(filtered);
  }, [characters, searchTerm, roleFilter]);

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

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Characters
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                label="Filter by Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="main">Main</MenuItem>
                <MenuItem value="side">Side</MenuItem>
                <MenuItem value="minor">Minor</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {filteredCharacters.length === 0 ? (
          <Typography color="text.secondary">
            No characters found. Import a story to extract characters.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredCharacters.map((character) => (
              <Grid item xs={12} sm={6} md={4} key={character.id}>
                <CharacterCard
                  character={character}
                  onClick={() => router.push(`/characters/${character.id}`)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}

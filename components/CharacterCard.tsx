'use client';

import { Card, CardContent, Typography, Chip, Box, Avatar } from '@mui/material';

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    role: string;
    description?: string;
    avatar_url?: string;
    personality?: any;
  };
  onClick?: () => void;
}

export default function CharacterCard({ character, onClick }: CharacterCardProps) {
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

  return (
    <Card 
      onClick={onClick} 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 6 } : {},
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={character.avatar_url}
            alt={character.name}
            sx={{ width: 56, height: 56, mr: 2 }}
          >
            {character.name[0]}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {character.name}
            </Typography>
            <Chip
              label={character.role}
              size="small"
              color={getRoleColor(character.role)}
            />
          </Box>
        </Box>
        {character.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {character.description.slice(0, 100)}
            {character.description.length > 100 ? '...' : ''}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

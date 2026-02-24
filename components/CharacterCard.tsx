"use client";

import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BrushIcon from "@mui/icons-material/Brush";
import { useState } from "react";

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
  onRefine?: (character: any) => void;
}

export default function CharacterCard({
  character,
  onClick,
  onRefine,
}: CharacterCardProps) {
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portrait, setPortrait] = useState<string | null>(
    character.avatar_url?.startsWith("data:") ? character.avatar_url : null,
  );

  const handleGeneratePortrait = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPortraitLoading(true);
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
      const data = await res.json();
      if (data.portrait) {
        setPortrait(data.portrait);
        character.avatar_url = data.portrait;
      }
    } catch {
      // silent — user can retry
    } finally {
      setPortraitLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "main":
        return "primary";
      case "side":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card
      sx={{
        cursor: onClick ? "pointer" : "default",
        "&:hover": onClick ? { boxShadow: 6 } : {},
        position: "relative",
      }}
    >
      {/* AI Refine button — top-right corner, stops card click propagation */}
      {onRefine && (
        <Tooltip title="Build character with AI">
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onRefine(character);
            }}
            sx={{ position: "absolute", top: 8, right: 8 }}
          >
            <AutoFixHighIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Generate portrait button */}
      <Tooltip
        title={
          portraitLoading ? "Generating portrait…" : "Generate AI portrait"
        }
      >
        <span
          style={{ position: "absolute", top: 8, right: onRefine ? 40 : 8 }}
        >
          <IconButton
            size="small"
            color="secondary"
            onClick={handleGeneratePortrait}
            disabled={portraitLoading}
          >
            {portraitLoading ? (
              <CircularProgress size={16} />
            ) : (
              <BrushIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <CardContent onClick={onClick}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
            pr: onRefine ? 3 : 0,
          }}
        >
          <Avatar
            src={portrait || character.avatar_url}
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
            {character.description.length > 100 ? "..." : ""}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

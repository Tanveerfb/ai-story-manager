"use client";

import { useState, useCallback } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PersonIcon from "@mui/icons-material/Person";
import PlaceIcon from "@mui/icons-material/Place";
import { useWorld } from "@/components/WorldProvider";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "story" | "character" | "location";
  id: string;
  title: string;
  snippet: string;
  meta: Record<string, any>;
}

export default function SearchPage() {
  const { worldId } = useWorld();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useState<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(
    async (q: string, type: string) => {
      if (!q || q.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: q.trim(), type });
        if (worldId) params.set("world_id", worldId);
        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [worldId],
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    debounceRef[0] = setTimeout(() => doSearch(value, filter), 400);
  };

  const handleFilterChange = (_: any, val: string | null) => {
    if (!val) return;
    setFilter(val);
    if (query.trim().length >= 2) doSearch(query, val);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "story") {
      router.push("/story");
    } else if (result.type === "character") {
      router.push(`/characters/${result.id}`);
    } else if (result.type === "location") {
      router.push("/locations");
    }
  };

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <Box
          key={i}
          component="span"
          sx={{
            bgcolor: "warning.light",
            color: "warning.contrastText",
            px: 0.3,
            borderRadius: 0.5,
          }}
        >
          {part}
        </Box>
      ) : (
        part
      ),
    );
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "story":
        return <MenuBookIcon fontSize="small" />;
      case "character":
        return <PersonIcon fontSize="small" />;
      case "location":
        return <PlaceIcon fontSize="small" />;
      default:
        return null;
    }
  };

  const typeColor = (type: string): "primary" | "secondary" | "success" => {
    switch (type) {
      case "story":
        return "primary";
      case "character":
        return "secondary";
      case "location":
        return "success";
      default:
        return "primary";
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Search
      </Typography>

      <TextField
        fullWidth
        placeholder="Search across your story, characters, and locations..."
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        autoFocus
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: loading ? (
            <InputAdornment position="end">
              <CircularProgress size={20} />
            </InputAdornment>
          ) : null,
        }}
        sx={{ mb: 2 }}
      />

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilterChange}
        size="small"
        sx={{ mb: 3 }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="story">Story</ToggleButton>
        <ToggleButton value="characters">Characters</ToggleButton>
        <ToggleButton value="locations">Locations</ToggleButton>
      </ToggleButtonGroup>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {searched && results.length === 0 && !loading && (
        <Alert severity="info">No results found for &quot;{query}&quot;</Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {results.map((result) => (
          <Card key={`${result.type}-${result.id}`} variant="outlined">
            <CardActionArea onClick={() => handleResultClick(result)}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <Chip
                    icon={typeIcon(result.type) || undefined}
                    label={result.type}
                    size="small"
                    color={typeColor(result.type)}
                    variant="outlined"
                  />
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    {highlightMatch(result.title)}
                  </Typography>
                  {result.meta?.role && (
                    <Chip label={result.meta.role} size="small" />
                  )}
                  {result.meta?.part_number != null && (
                    <Typography variant="caption" color="text.secondary">
                      Part {result.meta.part_number}, Ch.{" "}
                      {result.meta.chapter_number}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ whiteSpace: "pre-wrap" }}
                >
                  {highlightMatch(result.snippet)}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>

      {!searched && !loading && (
        <Box sx={{ textAlign: "center", mt: 6, color: "text.secondary" }}>
          <SearchIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
          <Typography>Type at least 2 characters to search</Typography>
        </Box>
      )}
    </Container>
  );
}

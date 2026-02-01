"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    let filtered = locations;

    if (searchTerm) {
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((loc) => loc.type === typeFilter);
    }

    setFilteredLocations(filtered);
  }, [locations, searchTerm, typeFilter]);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
        setFilteredLocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };

  const handleExtractFromStory = async () => {
    setExtracting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/locations?action=extract", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract locations");
      }

      const result = await response.json();

      console.log("Location extraction result:", result);

      let message = `Successfully extracted ${result.newLocations} new location(s) and updated ${result.updatedLocations} existing location(s)!`;

      if (result.extractedNames && result.extractedNames.length > 0) {
        message += ` Found: ${result.extractedNames.join(", ")}`;
      }

      if (result.message) {
        message = result.message;
      }

      setMessage({
        type: result.totalExtracted === 0 ? "warning" : "success",
        text: message,
      });

      // Refresh the locations list
      await fetchLocations();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
            alignItems: "center",
          }}
        >
          <Typography variant="h4" component="h1">
            Locations
          </Typography>
          <Button
            variant="contained"
            onClick={handleExtractFromStory}
            disabled={extracting}
            startIcon={extracting ? <CircularProgress size={20} /> : null}
          >
            {extracting ? "Extracting..." : "Extract from Story Parts"}
          </Button>
        </Box>

        {message && (
          <Alert
            severity={message.type}
            sx={{ mb: 2 }}
            onClose={() => setMessage(null)}
          >
            {message.text}
          </Alert>
        )}

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
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={typeFilter}
                label="Filter by Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="indoor">Indoor</MenuItem>
                <MenuItem value="outdoor">Outdoor</MenuItem>
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {filteredLocations.length === 0 ? (
          <Typography color="text.secondary">
            No locations found. Import a story to extract locations.
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {filteredLocations.map((location) => (
              <Grid item xs={12} sm={6} md={4} key={location.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {location.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      paragraph
                    >
                      {location.description || "No description available"}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Type: {location.type || "Unknown"}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Importance: {location.importance || "Unknown"}
                    </Typography>
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

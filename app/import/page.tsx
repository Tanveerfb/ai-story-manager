"use client";

import { useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import FileUpload from "@/components/FileUpload";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [partNumber, setPartNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [skipExtraction, setSkipExtraction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partNumber", partNumber.toString());
      formData.append("title", title);
      formData.append("skipExtraction", skipExtraction.toString());

      const response = await fetch("/api/import-story", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Import failed");
      }

      const result = await response.json();
      setSuccess(result);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Import Story
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload a .docx, .md, .markdown, .txt, or .gdoc file containing your
          story. The AI will automatically extract characters, locations,
          events, and relationships.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <FileUpload onFileSelect={setFile} />
        </Box>

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Part Number"
            type="number"
            value={partNumber}
            onChange={(e) => setPartNumber(parseInt(e.target.value) || 1)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Title (Optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={skipExtraction}
                onChange={(e) => setSkipExtraction(e.target.checked)}
              />
            }
            label="Skip AI extraction (add entities manually later)"
          />
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleImport}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Processing...
              </>
            ) : (
              "Import Story"
            )}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Paper sx={{ mt: 3, p: 3 }}>
            <Alert severity="success" sx={{ mb: 2 }}>
              Story imported successfully!
            </Alert>
            <Typography variant="h6" gutterBottom>
              Extracted Entities:
            </Typography>
            <Typography>
              • Characters: {success.extracted.characters}
            </Typography>
            <Typography>• Locations: {success.extracted.locations}</Typography>
            <Typography>• Events: {success.extracted.events}</Typography>
            <Typography>
              • Relationships: {success.extracted.relationships}
            </Typography>
            <Typography>• Themes: {success.extracted.themes}</Typography>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

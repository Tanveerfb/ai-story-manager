"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Grid,
} from "@mui/material";
import { useThemeMode } from "@/components/ThemeProvider";

export default function SettingsPage() {
  const { mode, toggleTheme } = useThemeMode();
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("llama3.1:70b");
  const [temperature, setTemperature] = useState("0.82");
  const [topP, setTopP] = useState("0.92");
  const [topK, setTopK] = useState("50");
  const [maxTokens, setMaxTokens] = useState("1500");
  const [numCtx, setNumCtx] = useState("8192");
  const [connectionStatus, setConnectionStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");

  const testConnection = async () => {
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`);
      if (response.ok) {
        setConnectionStatus("connected");
      } else {
        setConnectionStatus("disconnected");
      }
    } catch (error) {
      setConnectionStatus("disconnected");
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontSize: { xs: "1.5rem", sm: "2.125rem" } }}
        >
          Settings
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          <FormControlLabel
            control={
              <Switch checked={mode === "dark"} onChange={toggleTheme} />
            }
            label="Dark Mode"
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Ollama Configuration
          </Typography>

          <TextField
            fullWidth
            label="Ollama API URL"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Model"
            value={ollamaModel}
            onChange={(e) => setOllamaModel(e.target.value)}
            helperText="e.g., llama3.1:70b, llama2, mistral"
            sx={{ mb: 2 }}
          />

          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
              mb: 2,
            }}
          >
            <Button variant="contained" onClick={testConnection}>
              Test Connection
            </Button>
            {connectionStatus !== "unknown" && (
              <Alert
                severity={
                  connectionStatus === "connected" ? "success" : "error"
                }
                sx={{ py: 0 }}
              >
                {connectionStatus === "connected"
                  ? "Connected"
                  : "Disconnected"}
              </Alert>
            )}
          </Box>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            AI Generation Parameters
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            These settings control the quality and creativity of AI-generated
            content.
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Temperature"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                inputProps={{ step: 0.01, min: 0, max: 2 }}
                helperText="Creativity (0.0-2.0)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Top P"
                type="number"
                value={topP}
                onChange={(e) => setTopP(e.target.value)}
                inputProps={{ step: 0.01, min: 0, max: 1 }}
                helperText="Nucleus sampling (0.0-1.0)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Top K"
                type="number"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
                inputProps={{ step: 1, min: 1 }}
                helperText="Token selection pool"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Max Tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                inputProps={{ step: 100, min: 100 }}
                helperText="Maximum response length"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Context Window (num_ctx)"
                type="number"
                value={numCtx}
                onChange={(e) => setNumCtx(e.target.value)}
                inputProps={{ step: 512, min: 512 }}
                helperText="Context window size for the model"
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            Note: These settings are informational only. To change them, update
            your .env file and restart the application.
          </Alert>
        </Paper>
      </Box>
    </Container>
  );
}

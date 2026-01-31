'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Paper,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  TextField,
  LinearProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface FileWithStatus {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  extracted?: {
    characters: number;
    locations: number;
    events: number;
    relationships: number;
    themes: number;
  };
}

export default function BatchImportPage() {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [startingPartNumber, setStartingPartNumber] = useState(1);
  const [skipExtraction, setSkipExtraction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        status: 'pending' as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setError(null);
  };

  const handleBatchImport = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: files.length });

    try {
      const formData = new FormData();
      files.forEach((fileWithStatus, index) => {
        formData.append(`file_${index}`, fileWithStatus.file);
      });
      formData.append('startingPartNumber', startingPartNumber.toString());
      formData.append('skipExtraction', skipExtraction.toString());

      const response = await fetch('/api/import-story/batch', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Batch import failed');
      }

      const result = await response.json();

      // Update file statuses based on results
      setFiles((prev) =>
        prev.map((fileWithStatus, index) => {
          const fileResult = result.results[index];
          return {
            ...fileWithStatus,
            status: fileResult.success ? 'completed' : 'error',
            error: fileResult.error,
            extracted: fileResult.extracted,
          };
        })
      );

      setProgress({ current: result.totalFiles, total: result.totalFiles });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon />;
      case 'processing':
        return <PendingIcon color="primary" />;
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <PendingIcon />;
    }
  };

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const estimatedTime = skipExtraction ? files.length * 2 : files.length * 30;

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Batch Import Stories
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload multiple files (.docx, .md, .markdown, .txt) to import them
          sequentially. Each file will be assigned a part number automatically.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <input
              type="file"
              id="batch-file-upload"
              accept=".docx,.md,.markdown,.txt"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <label htmlFor="batch-file-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<CloudUploadIcon />}
                disabled={loading}
              >
                Select Files
              </Button>
            </label>
          </Paper>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Starting Part Number"
              type="number"
              value={startingPartNumber}
              onChange={(e) =>
                setStartingPartNumber(parseInt(e.target.value) || 1)
              }
              sx={{ mb: 2 }}
              disabled={loading}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={skipExtraction}
                  onChange={(e) => setSkipExtraction(e.target.checked)}
                  disabled={loading}
                />
              }
              label="Skip AI extraction (add entities manually later)"
            />
          </Box>

          {files.length > 0 && (
            <Paper sx={{ mb: 3 }}>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="h6">
                  Files ({files.length})
                  {completedCount > 0 && (
                    <Chip
                      label={`${completedCount} completed`}
                      color="success"
                      size="small"
                      sx={{ ml: 2 }}
                    />
                  )}
                  {errorCount > 0 && (
                    <Chip
                      label={`${errorCount} failed`}
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Typography>
                <Button
                  size="small"
                  onClick={clearAllFiles}
                  disabled={loading}
                >
                  Clear All
                </Button>
              </Box>

              {loading && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Processing {progress.current} of {progress.total} files...
                  </Typography>
                  <LinearProgress />
                </Box>
              )}

              <List>
                {files.map((fileWithStatus, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      !loading && (
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(index)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemIcon>{getStatusIcon(fileWithStatus.status)}</ListItemIcon>
                    <ListItemText
                      primary={fileWithStatus.file.name}
                      secondary={
                        <>
                          Part {startingPartNumber + index}
                          {fileWithStatus.error && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="error"
                              sx={{ display: 'block' }}
                            >
                              Error: {fileWithStatus.error}
                            </Typography>
                          )}
                          {fileWithStatus.extracted && (
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              Extracted: {fileWithStatus.extracted.characters} chars,{' '}
                              {fileWithStatus.extracted.locations} locs,{' '}
                              {fileWithStatus.extracted.events} events
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {files.length > 0 && !loading && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Estimated time: ~{Math.ceil(estimatedTime / 60)} minutes
              </Typography>
            </Box>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleBatchImport}
            disabled={files.length === 0 || loading}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                Processing Files...
              </>
            ) : (
              `Import ${files.length} File${files.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}

        {completedCount > 0 && !loading && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Successfully imported {completedCount} of {files.length} files!
          </Alert>
        )}
      </Box>
    </Container>
  );
}

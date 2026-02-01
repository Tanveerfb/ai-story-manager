import { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface FeedbackPanelProps {
  onSubmitFeedback: (instructions: string) => void;
  isLoading: boolean;
}

export default function FeedbackPanel({ onSubmitFeedback, isLoading }: FeedbackPanelProps) {
  const [feedbackText, setFeedbackText] = useState('');
  
  const suggestionTemplates = [
    'Make the dialogue more natural',
    'Add more descriptive details',
    'Increase the tension in this scene',
    'Make the character sound angrier',
    'Add more emotional depth',
    'Shorten this section',
    'Expand on this moment',
  ];

  const handleSubmit = () => {
    if (feedbackText.trim()) {
      onSubmitFeedback(feedbackText);
      setFeedbackText('');
    }
  };

  const handleTemplateClick = (template: string) => {
    setFeedbackText(template);
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Revision Instructions
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Provide feedback to guide the AI in rewriting the generated content.
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        <strong>Tip:</strong> Be specific about what you want changed. The AI will respect your instructions and never water down scenes.
      </Alert>

      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder="E.g., 'Make Duke sound more determined', 'Add more tension to the confrontation', 'Include more description of the setting'"
        value={feedbackText}
        onChange={(e) => setFeedbackText(e.target.value)}
        disabled={isLoading}
        sx={{ mb: 2 }}
      />

      <Button
        variant="contained"
        startIcon={<SendIcon />}
        onClick={handleSubmit}
        disabled={isLoading || !feedbackText.trim()}
        fullWidth
        sx={{ mb: 2 }}
      >
        Generate Revision
      </Button>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Quick Templates:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {suggestionTemplates.map((template, idx) => (
          <Button
            key={idx}
            size="small"
            variant="outlined"
            onClick={() => handleTemplateClick(template)}
            disabled={isLoading}
          >
            {template}
          </Button>
        ))}
      </Box>
    </Paper>
  );
}

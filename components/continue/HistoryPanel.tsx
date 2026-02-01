import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Chip,
  Divider
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface HistoryEntry {
  id: string;
  user_prompt: string;
  revision_instructions?: string;
  generated_content: string;
  created_at: string;
}

interface HistoryPanelProps {
  history: HistoryEntry[];
  onRestore?: (entry: HistoryEntry) => void;
}

export default function HistoryPanel({ history, onRestore }: HistoryPanelProps) {
  if (!history || history.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Generation History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No history yet. Your previous generations will appear here.
        </Typography>
      </Paper>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Paper sx={{ p: 3, mt: 3, maxHeight: 500, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Generation History
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        View and restore previous versions
      </Typography>

      <List>
        {history.map((entry, index) => (
          <Box key={entry.id}>
            {index > 0 && <Divider sx={{ my: 2 }} />}
            <ListItem
              sx={{ 
                px: 0,
                alignItems: 'flex-start'
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.created_at)}
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Prompt:</strong> {entry.user_prompt.substring(0, 100)}
                      {entry.user_prompt.length > 100 && '...'}
                    </Typography>
                    {entry.revision_instructions && (
                      <Chip 
                        label={`Revision: ${entry.revision_instructions.substring(0, 40)}...`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {entry.generated_content.substring(0, 150)}...
                    </Typography>
                  </Box>
                }
              />
              {onRestore && (
                <IconButton
                  edge="end"
                  onClick={() => onRestore(entry)}
                  size="small"
                  sx={{ mt: 1 }}
                  title="Restore this version"
                >
                  <RestoreIcon />
                </IconButton>
              )}
            </ListItem>
          </Box>
        ))}
      </List>
    </Paper>
  );
}

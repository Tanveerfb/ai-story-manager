import { Box, LinearProgress, Typography, Chip } from '@mui/material';

interface GenerationProgressProps {
  isGenerating: boolean;
  status: string;
  contextNotes?: string[];
}

export default function GenerationProgress({ 
  isGenerating, 
  status,
  contextNotes 
}: GenerationProgressProps) {
  if (!isGenerating && !contextNotes?.length) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }}>
      {isGenerating && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
              {status}
            </Typography>
          </Box>
          <LinearProgress />
        </>
      )}
      
      {contextNotes && contextNotes.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            Context Notes Detected:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            {contextNotes.map((note, idx) => (
              <Chip 
                key={idx} 
                label={note} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

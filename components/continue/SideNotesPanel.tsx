import {
  Paper,
  Typography,
  TextField,
  Box,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

interface SideNotesPanelProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  sceneType: string;
  onSceneTypeChange: (type: string) => void;
}

const SCENE_TYPES = [
  'Action',
  'Dialogue',
  'Description',
  'Cliffhanger',
  'Reversal',
  'Revelation',
  'Transition',
  'Flashback',
  'Emotional',
  'Other'
];

const TAG_SUGGESTIONS = [
  'Draft',
  'Needs Review',
  'Important',
  'Climax',
  'Character Development',
  'Plot Point',
  'Romance',
  'Conflict',
  'Resolution'
];

export default function SideNotesPanel({
  notes,
  onNotesChange,
  tags,
  onTagsChange,
  sceneType,
  onSceneTypeChange
}: SideNotesPanelProps) {
  const handleTagClick = (tag: string) => {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter(t => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Author&apos;s Notes & Tags
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Scene Type</InputLabel>
          <Select
            value={sceneType}
            label="Scene Type"
            onChange={(e) => onSceneTypeChange(e.target.value)}
          >
            <MenuItem value="">None</MenuItem>
            {SCENE_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="subtitle2" gutterBottom>
          Tags:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {TAG_SUGGESTIONS.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              color={tags.includes(tag) ? 'primary' : 'default'}
              onClick={() => handleTagClick(tag)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Box>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Side Notes"
          placeholder="Add your notes about this continuation: intentions, tone, character motivations, etc."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          helperText="These notes are private and help you keep track of your creative decisions"
        />
      </Box>
    </Paper>
  );
}

import { useState } from 'react';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CallSplitIcon from '@mui/icons-material/CallSplit';

interface BranchingPanelProps {
  currentDraftId: string | null;
  onCreateBranch: (branchName: string, prompt: string, sideNotes: string) => void;
  isLoading: boolean;
}

export default function BranchingPanel({ 
  currentDraftId, 
  onCreateBranch, 
  isLoading 
}: BranchingPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [branchPrompt, setBranchPrompt] = useState('');
  const [branchNotes, setBranchNotes] = useState('');

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setBranchName('');
    setBranchPrompt('');
    setBranchNotes('');
  };

  const handleSubmit = () => {
    if (branchName.trim() && branchPrompt.trim()) {
      onCreateBranch(branchName, branchPrompt, branchNotes);
      handleCloseDialog();
    }
  };

  return (
    <>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Alternative Scenarios
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Create a branch to explore different story directions without losing your current progress.
        </Typography>

        <Button
          variant="outlined"
          startIcon={<CallSplitIcon />}
          onClick={handleOpenDialog}
          disabled={!currentDraftId || isLoading}
          fullWidth
        >
          Create Branch
        </Button>
      </Paper>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Story Branch</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Branch Name"
            placeholder="E.g., 'Alternative ending', 'What if Duke stayed?'"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Branch Prompt"
            placeholder="Describe what happens in this alternative scenario..."
            value={branchPrompt}
            onChange={(e) => setBranchPrompt(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Side Notes (Optional)"
            placeholder="Any additional notes about this branch..."
            value={branchNotes}
            onChange={(e) => setBranchNotes(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!branchName.trim() || !branchPrompt.trim()}
          >
            Create Branch
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

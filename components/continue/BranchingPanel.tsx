import { useState } from "react";
import { Card, Typography, Input, Button, Modal } from "antd";
import { BranchesOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface BranchingPanelProps {
  currentDraftId: string | null;
  onCreateBranch: (
    branchName: string,
    prompt: string,
    sideNotes: string,
  ) => void;
  isLoading: boolean;
}

export default function BranchingPanel({
  currentDraftId,
  onCreateBranch,
  isLoading,
}: BranchingPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [branchName, setBranchName] = useState("");
  const [branchPrompt, setBranchPrompt] = useState("");
  const [branchNotes, setBranchNotes] = useState("");

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setBranchName("");
    setBranchPrompt("");
    setBranchNotes("");
  };

  const handleSubmit = () => {
    if (branchName.trim() && branchPrompt.trim()) {
      onCreateBranch(branchName, branchPrompt, branchNotes);
      handleCloseDialog();
    }
  };

  return (
    <>
      <Card style={{ padding: 24, marginTop: 24 }}>
        <Title level={5}>Alternative Scenarios</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Create a branch to explore different story directions without losing
          your current progress.
        </Text>

        <Button
          icon={<BranchesOutlined />}
          onClick={handleOpenDialog}
          disabled={!currentDraftId || isLoading}
          block
        >
          Create Branch
        </Button>
      </Card>

      <Modal
        open={dialogOpen}
        onCancel={handleCloseDialog}
        title="Create Story Branch"
        width={600}
        footer={[
          <Button key="cancel" onClick={handleCloseDialog}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmit}
            disabled={!branchName.trim() || !branchPrompt.trim()}
          >
            Create Branch
          </Button>,
        ]}
      >
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Branch Name
          </Text>
          <Input
            placeholder="E.g., 'Alternative ending', 'What if Duke stayed?'"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Branch Prompt
          </Text>
          <TextArea
            rows={4}
            placeholder="Describe what happens in this alternative scenario..."
            value={branchPrompt}
            onChange={(e) => setBranchPrompt(e.target.value)}
          />
        </div>

        <div>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Side Notes (Optional)
          </Text>
          <TextArea
            rows={2}
            placeholder="Any additional notes about this branch..."
            value={branchNotes}
            onChange={(e) => setBranchNotes(e.target.value)}
          />
        </div>
      </Modal>
    </>
  );
}

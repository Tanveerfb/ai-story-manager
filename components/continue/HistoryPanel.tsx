import { Card, Typography, Tag, Button, Divider, Tooltip } from "antd";
import { RollbackOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

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

export default function HistoryPanel({
  history,
  onRestore,
}: HistoryPanelProps) {
  if (!history || history.length === 0) {
    return (
      <Card style={{ padding: 24, marginTop: 24 }}>
        <Title level={5}>Generation History</Title>
        <Text type="secondary">
          No history yet. Your previous generations will appear here.
        </Text>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card
      style={{ padding: 24, marginTop: 24, maxHeight: 500, overflow: "auto" }}
    >
      <Title level={5}>Generation History</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
        View and restore previous versions
      </Text>

      <div>
        {history.map((entry, index) => (
          <div key={entry.id}>
            {index > 0 && <Divider style={{ margin: "16px 0" }} />}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <ClockCircleOutlined
                    style={{
                      fontSize: 14,
                      marginRight: 8,
                      color: "rgba(0,0,0,0.45)",
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDate(entry.created_at)}
                  </Text>
                </div>
                <Text style={{ marginBottom: 8, display: "block" }}>
                  <strong>Prompt:</strong>{" "}
                  {entry.user_prompt
                    ? entry.user_prompt.substring(0, 100) +
                      (entry.user_prompt.length > 100 ? "..." : "")
                    : "No prompt"}
                </Text>
                {entry.revision_instructions && (
                  <Tag color="blue" style={{ marginBottom: 8 }}>
                    Revision: {entry.revision_instructions.substring(0, 40)}
                    ...
                  </Tag>
                )}
                <Text type="secondary" style={{ display: "block" }}>
                  {entry.generated_content
                    ? entry.generated_content.substring(0, 150) + "..."
                    : "No content"}
                </Text>
              </div>
              {onRestore && (
                <Tooltip title="Restore this version">
                  <Button
                    type="text"
                    size="small"
                    icon={<RollbackOutlined />}
                    onClick={() => onRestore(entry)}
                  />
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

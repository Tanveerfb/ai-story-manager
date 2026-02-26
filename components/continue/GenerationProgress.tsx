import { Progress, Typography, Tag } from "antd";

const { Text } = Typography;

interface GenerationProgressProps {
  isGenerating: boolean;
  status: string;
  contextNotes?: string[];
}

export default function GenerationProgress({
  isGenerating,
  status,
  contextNotes,
}: GenerationProgressProps) {
  if (!isGenerating && !contextNotes?.length) {
    return null;
  }

  return (
    <div style={{ marginBottom: 24 }}>
      {isGenerating && (
        <>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
          >
            <Text type="secondary" style={{ marginRight: 16 }}>
              {status}
            </Text>
          </div>
          <Progress percent={100} status="active" showInfo={false} />
        </>
      )}

      {contextNotes && contextNotes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: "block", marginBottom: 8 }}
          >
            Context Notes Detected:
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {contextNotes.map((note, idx) => (
              <Tag key={idx} color="blue">
                {note}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

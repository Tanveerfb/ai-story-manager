import { Card, Typography, Input, Select, Tag } from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SideNotesPanelProps {
  notes: string;
  onNotesChange: (notes: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  sceneType: string;
  onSceneTypeChange: (type: string) => void;
}

const SCENE_TYPES = [
  "Action",
  "Dialogue",
  "Description",
  "Cliffhanger",
  "Reversal",
  "Revelation",
  "Transition",
  "Flashback",
  "Emotional",
  "Other",
];

const TAG_SUGGESTIONS = [
  "Draft",
  "Needs Review",
  "Important",
  "Climax",
  "Character Development",
  "Plot Point",
  "Romance",
  "Conflict",
  "Resolution",
];

export default function SideNotesPanel({
  notes,
  onNotesChange,
  tags,
  onTagsChange,
  sceneType,
  onSceneTypeChange,
}: SideNotesPanelProps) {
  const handleTagClick = (tag: string) => {
    if (tags.includes(tag)) {
      onTagsChange(tags.filter((t) => t !== tag));
    } else {
      onTagsChange([...tags, tag]);
    }
  };

  return (
    <Card style={{ padding: 24, marginTop: 24 }}>
      <Title level={5}>Author&apos;s Notes &amp; Tags</Title>

      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Scene Type
          </Text>
          <Select
            value={sceneType || undefined}
            placeholder="Scene Type"
            onChange={(value) => onSceneTypeChange(value ?? "")}
            allowClear
            style={{ width: "100%" }}
            options={[
              { value: "", label: "None" },
              ...SCENE_TYPES.map((type) => ({ value: type, label: type })),
            ]}
          />
        </div>

        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Tags:
        </Text>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {TAG_SUGGESTIONS.map((tag) => (
            <Tag
              key={tag}
              color={tags.includes(tag) ? "blue" : "default"}
              onClick={() => handleTagClick(tag)}
              style={{ cursor: "pointer" }}
            >
              {tag}
            </Tag>
          ))}
        </div>

        <Text strong style={{ display: "block", marginBottom: 8 }}>
          Side Notes
        </Text>
        <TextArea
          rows={4}
          placeholder="Add your notes about this continuation: intentions, tone, character motivations, etc."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          These notes are private and help you keep track of your creative
          decisions
        </Text>
      </div>
    </Card>
  );
}

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Typography,
  Card,
  Button,
  Input,
  Collapse,
  Tag,
  Modal,
  Tooltip,
  Alert,
} from "antd";
import {
  DeleteOutlined,
  BookOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";
import { useRouter } from "next/navigation";
import { useWorld } from "@/components/WorldProvider";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function StoryPage() {
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);
  const { worldId } = useWorld();
  const [storyParts, setStoryParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
    part_number: number;
    chapter_number?: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchStoryParts();
  }, [worldId]);

  const fetchStoryParts = async () => {
    try {
      const response = await fetch(
        `/api/story-parts${worldId ? `?world_id=${worldId}` : ""}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStoryParts(data);
      }
    } catch (error) {
      console.error("Failed to fetch story parts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/story-parts/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setStoryParts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      }
    } catch (error) {
      console.error("Failed to delete story part:", error);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const startEditing = (chapter: any) => {
    setEditingId(chapter.id);
    setEditTitle(chapter.title || "");
    setEditContent(chapter.content || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/story-parts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (response.ok) {
        const updated = await response.json();
        setStoryParts((prev) =>
          prev.map((p) => (p.id === editingId ? updated : p)),
        );
        setSuccess("Chapter saved.");
        cancelEditing();
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const filteredParts = storyParts.filter(
    (part) =>
      part.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const groupedParts = useMemo(() => {
    const groups: Record<number, any[]> = {};
    for (const part of filteredParts) {
      const pn = part.part_number;
      if (!groups[pn]) groups[pn] = [];
      groups[pn].push(part);
    }
    for (const pn of Object.keys(groups)) {
      groups[Number(pn)].sort(
        (a: any, b: any) => (a.chapter_number || 1) - (b.chapter_number || 1),
      );
    }
    return groups;
  }, [filteredParts]);

  const sortedPartNumbers = useMemo(
    () =>
      Object.keys(groupedParts)
        .map(Number)
        .sort((a, b) => a - b),
    [groupedParts],
  );

  const totalWords = storyParts.reduce(
    (sum, p) => sum + (p.word_count || 0),
    0,
  );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 16, marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 24,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Story Viewer
            </Title>
            {storyParts.length > 0 && (
              <Text type="secondary">
                {sortedPartNumbers.length} part
                {sortedPartNumbers.length !== 1 ? "s" : ""} &middot;{" "}
                {storyParts.length} chapter
                {storyParts.length !== 1 ? "s" : ""} &middot;{" "}
                {totalWords.toLocaleString()} words
              </Text>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                const params = new URLSearchParams({ format: "markdown" });
                if (worldId) params.set("world_id", worldId);
                window.open(`/api/export?${params}`, "_blank");
              }}
            >
              Export MD
            </Button>
            <Button
              icon={<DownloadOutlined />}
              onClick={() => {
                const params = new URLSearchParams({ format: "text" });
                if (worldId) params.set("world_id", worldId);
                window.open(`/api/export?${params}`, "_blank");
              }}
            >
              Export TXT
            </Button>
            <Button type="primary" onClick={() => router.push("/continue")}>
              Continue Story
            </Button>
          </div>
        </div>

        {success && (
          <Alert
            type="success"
            title={success}
            closable
            onClose={() => setSuccess(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ marginBottom: 24 }}
        />

        {loading ? (
          <Text>Loading...</Text>
        ) : sortedPartNumbers.length === 0 ? (
          <Card style={{ textAlign: "center" }}>
            <Text type="secondary">
              No story parts found. Go to Continue Story to start writing.
            </Text>
          </Card>
        ) : (
          sortedPartNumbers.map((partNum) => {
            const chapters = groupedParts[partNum];
            const partWordCount = chapters.reduce(
              (sum: number, ch: any) => sum + (ch.word_count || 0),
              0,
            );

            return (
              <Card
                key={partNum}
                style={{ marginBottom: 24, overflow: "hidden" }}
                styles={{
                  header: {
                    background: token.colorPrimary,
                    color: "#fff",
                    borderBottom: "none",
                  },
                  body: { padding: 0 },
                }}
                title={
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: "#fff",
                    }}
                  >
                    <BookOutlined />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>
                      Part {partNum}
                    </span>
                    <Tag
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "inherit",
                        border: "none",
                      }}
                    >
                      {chapters.length} ch.
                    </Tag>
                    <span
                      style={{
                        marginLeft: "auto",
                        opacity: 0.85,
                        fontSize: 13,
                      }}
                    >
                      {partWordCount.toLocaleString()} words
                    </span>
                  </div>
                }
              >
                <Collapse
                  bordered={false}
                  items={chapters.map((chapter: any) => {
                    const isEditing = editingId === chapter.id;

                    return {
                      key: chapter.id,
                      label: (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                            width: "100%",
                            paddingRight: 8,
                          }}
                        >
                          <Tag color="purple" bordered>
                            Ch. {chapter.chapter_number || 1}
                          </Tag>
                          <Text strong>{chapter.title || "Untitled"}</Text>
                          <Text type="secondary" style={{ marginLeft: "auto" }}>
                            {chapter.word_count || 0} words
                          </Text>
                          <Tooltip title="Edit">
                            <Button
                              type="text"
                              size="small"
                              icon={<EditOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(chapter);
                              }}
                            />
                          </Tooltip>
                          <Tooltip title="Delete">
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({
                                  id: chapter.id,
                                  title: chapter.title,
                                  part_number: chapter.part_number,
                                  chapter_number: chapter.chapter_number || 1,
                                });
                              }}
                            />
                          </Tooltip>
                        </div>
                      ),
                      children: isEditing ? (
                        <div>
                          <Input
                            size="small"
                            placeholder="Title"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            style={{ marginBottom: 16 }}
                          />
                          <TextArea
                            rows={10}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            style={{
                              marginBottom: 16,
                              fontFamily: "Georgia, serif",
                              fontSize: "1rem",
                              lineHeight: 1.8,
                            }}
                          />
                          <div style={{ display: "flex", gap: 8 }}>
                            <Button
                              type="primary"
                              size="small"
                              icon={<SaveOutlined />}
                              onClick={handleSave}
                              loading={saving}
                            >
                              {saving ? "Saving..." : "Save"}
                            </Button>
                            <Button
                              size="small"
                              icon={<CloseOutlined />}
                              onClick={cancelEditing}
                              disabled={saving}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {chapter.summary && (
                            <Card
                              size="small"
                              style={{
                                marginBottom: 16,
                                background: sc.subtleBg,
                              }}
                            >
                              <Text
                                strong
                                style={{ display: "block", marginBottom: 4 }}
                              >
                                Summary:
                              </Text>
                              <Text type="secondary">{chapter.summary}</Text>
                            </Card>
                          )}
                          <div
                            style={{
                              whiteSpace: "pre-wrap",
                              fontFamily: "Georgia, serif",
                              lineHeight: 1.8,
                            }}
                          >
                            {chapter.content}
                          </div>
                        </>
                      ),
                    };
                  })}
                />
              </Card>
            );
          })
        )}
      </div>

      <Modal
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        title="Delete Chapter?"
        footer={[
          <Button
            key="cancel"
            onClick={() => setDeleteTarget(null)}
            disabled={deleting}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleDelete}
            loading={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>,
        ]}
        width={400}
      >
        <Text>
          Permanently delete{" "}
          <Text strong>
            Part {deleteTarget?.part_number}, Chapter{" "}
            {deleteTarget?.chapter_number || 1}
            {deleteTarget?.title ? ` — ${deleteTarget.title}` : ""}
          </Text>
          ? This cannot be undone.
        </Text>
      </Modal>
    </div>
  );
}

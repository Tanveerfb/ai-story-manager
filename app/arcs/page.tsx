"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Spin,
  Alert,
  Collapse,
  Tooltip,
  Tag,
  Card,
  theme as antdTheme,
} from "antd";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";
import { UserOutlined } from "@ant-design/icons";
import { useWorld } from "@/components/WorldProvider";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface Appearance {
  part_number: number;
  chapter_number: number;
  title: string;
  mention_count: number;
  snippets: string[];
}

interface ArcData {
  character: {
    id: string;
    name: string;
    role: string;
    arc_notes: string;
    goals: string;
    fears: string;
    motivations: string;
  };
  appearances: Appearance[];
  total_mentions: number;
  chapters_present: number;
  chapters_total: number;
}

export default function ArcsPage() {
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);
  const { worldId } = useWorld();
  const router = useRouter();
  const [arcs, setArcs] = useState<ArcData[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArcs = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (worldId) params.set("world_id", worldId);
        const res = await fetch(`/api/character-arcs?${params}`);
        if (!res.ok) throw new Error("Failed to load arcs");
        const data = await res.json();
        setArcs(data.arcs || []);
        setTotalChapters(data.total_chapters || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchArcs();
  }, [worldId]);

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 16px",
          textAlign: "center",
        }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Analyzing character arcs...</Text>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
        <Alert type="error" title={error} showIcon />
      </div>
    );
  }

  const roleColor = (role: string) => {
    switch (role) {
      case "protagonist":
        return "blue";
      case "antagonist":
        return "red";
      case "supporting":
        return "purple";
      case "bg":
        return "default";
      default:
        return "default";
    }
  };

  const collapseItems = arcs.map((arc) => {
    const presencePercent =
      totalChapters > 0
        ? Math.round((arc.chapters_present / totalChapters) * 100)
        : 0;

    return {
      key: arc.character.id,
      label: (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
          }}
        >
          <UserOutlined style={{ color: "rgba(0,0,0,0.45)" }} />
          <span
            style={{ fontSize: 16, fontWeight: 500, cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/characters/${arc.character.id}`);
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.textDecoration = "none")
            }
          >
            {arc.character.name}
          </span>
          <Tag color={roleColor(arc.character.role)}>
            {arc.character.role || "unassigned"}
          </Tag>
          <span style={{ flex: 1 }} />
          <Text type="secondary" style={{ marginRight: 16 }}>
            {arc.total_mentions} mentions &middot; {arc.chapters_present}/
            {totalChapters} chapters ({presencePercent}%)
          </Text>
        </div>
      ),
      children: (
        <div>
          {/* Arc Notes & Goals */}
          {(arc.character.arc_notes ||
            arc.character.goals ||
            arc.character.motivations) && (
            <Card size="small" style={{ marginBottom: 16 }}>
              {arc.character.arc_notes && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Arc Notes
                  </Text>
                  <div>
                    <Text>{arc.character.arc_notes}</Text>
                  </div>
                </div>
              )}
              {arc.character.goals && (
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Goals
                  </Text>
                  <div>
                    <Text>{arc.character.goals}</Text>
                  </div>
                </div>
              )}
              {arc.character.motivations && (
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Motivations
                  </Text>
                  <div>
                    <Text>{arc.character.motivations}</Text>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Visual Timeline Bar */}
          <div style={{ marginBottom: 16 }}>
            <Text strong>Presence Timeline</Text>
            <div style={{ display: "flex", gap: 0.5, marginTop: 8 }}>
              {Array.from({ length: totalChapters }, (_, i) => {
                const appearance = arc.appearances[0]
                  ? arc.appearances.find((a, idx) => {
                      return false; // placeholder
                    })
                  : null;
                return null;
              })}
            </div>
            {/* Simple bar representation */}
            <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {arc.appearances.map((app, i) => (
                <Tooltip
                  key={i}
                  title={`${app.title}: ${app.mention_count} mentions`}
                >
                  <div
                    style={{
                      height: 24,
                      minWidth: 24,
                      padding: "0 4px",
                      backgroundColor:
                        app.mention_count > 5
                          ? token.colorPrimary
                          : app.mention_count > 2
                            ? "#69b1ff"
                            : "#e6f4ff",
                      color: app.mention_count > 2 ? "white" : "inherit",
                      borderRadius: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                    }}
                  >
                    {app.chapter_number}
                  </div>
                </Tooltip>
              ))}
            </div>
            {arc.appearances.length > 0 && (
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Chapters where {arc.character.name} appears (darker = more
                  mentions)
                </Text>
              </div>
            )}
          </div>

          {/* Appearance List */}
          <Text strong>Chapter Appearances</Text>
          <div style={{ marginTop: 8 }}>
            {arc.appearances.length === 0 ? (
              <Text type="secondary">
                This character hasn&apos;t appeared in any chapters yet.
              </Text>
            ) : (
              arc.appearances.map((app, i) => (
                <Card key={i} size="small" style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text strong>{app.title}</Text>
                    <Tag>{app.mention_count}x</Tag>
                  </div>
                  {app.snippets.slice(0, 2).map((s, j) => (
                    <div key={j} style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        &ldquo;...{s}...&rdquo;
                      </Text>
                    </div>
                  ))}
                </Card>
              ))
            )}
          </div>
        </div>
      ),
    };
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      <Title level={3}>Character Arcs</Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        Track how each character appears and develops across the story. Click a
        character name to view their full profile.
      </Text>

      {arcs.length === 0 ? (
        <Card style={{ textAlign: "center" }}>
          <Text type="secondary">
            No characters or chapters found yet. Start writing to see character
            arcs develop.
          </Text>
        </Card>
      ) : (
        <Collapse
          defaultActiveKey={arcs
            .filter((a) => a.total_mentions > 0)
            .map((a) => a.character.id)}
          items={collapseItems}
        />
      )}
    </div>
  );
}

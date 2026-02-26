"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Spin,
  Alert,
  Progress,
  Tag,
  Divider,
} from "antd";
import {
  BookOutlined,
  UserOutlined,
  EnvironmentOutlined,
  EditOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";
import { useWorld } from "@/components/WorldProvider";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";

const { Title, Text } = Typography;

interface Stats {
  overview: {
    totalWords: number;
    totalChapters: number;
    totalParts: number;
    totalCharacters: number;
    totalLocations: number;
    avgWordsPerChapter: number;
  };
  wordsPerPart: { part: number; words: number; chapters: number }[];
  timeline: { date: string; words: number }[];
  characterMentions: { name: string; role: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
  longestChapter: {
    title: string;
    part: number;
    chapter: number;
    words: number;
  } | null;
  shortestChapter: {
    title: string;
    part: number;
    chapter: number;
    words: number;
  } | null;
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}) {
  const { token } = antdTheme.useToken();
  return (
    <Card style={{ textAlign: "center", height: "100%" }}>
      <div
        style={{
          color: color || token.colorPrimary,
          marginBottom: 8,
          fontSize: 28,
        }}
      >
        {icon}
      </div>
      <Title level={3} style={{ margin: 0 }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </Title>
      <Text type="secondary">{label}</Text>
    </Card>
  );
}

export default function StatsPage() {
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);
  const { worldId } = useWorld();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (worldId) params.set("world_id", worldId);
        const res = await fetch(`/api/stats?${params}`);
        if (!res.ok) throw new Error("Failed to load statistics");
        const data = await res.json();
        setStats(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
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
          <Text>Crunching numbers...</Text>
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

  if (!stats) return null;

  const {
    overview,
    wordsPerPart,
    timeline,
    characterMentions,
    roleDistribution,
    longestChapter,
    shortestChapter,
  } = stats;
  const maxMentions =
    characterMentions.length > 0 ? characterMentions[0].count : 1;

  // Estimate pages (250 words per page)
  const estimatedPages = Math.round(overview.totalWords / 250);

  // Novel length classification
  const novelClass =
    overview.totalWords < 7500
      ? "Short Story"
      : overview.totalWords < 20000
        ? "Novelette"
        : overview.totalWords < 40000
          ? "Novella"
          : overview.totalWords < 80000
            ? "Novel"
            : "Epic Novel";

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 16px" }}>
      <Title level={3}>Story Statistics</Title>

      {/* Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={8} md={4}>
          <StatCard
            icon={<EditOutlined />}
            label="Total Words"
            value={overview.totalWords}
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard
            icon={<BookOutlined />}
            label="Chapters"
            value={overview.totalChapters}
            color="#722ed1"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard
            icon={<BarChartOutlined />}
            label="Parts"
            value={overview.totalParts}
            color="#52c41a"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard
            icon={<UserOutlined />}
            label="Characters"
            value={overview.totalCharacters}
            color="#faad14"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard
            icon={<EnvironmentOutlined />}
            label="Locations"
            value={overview.totalLocations}
            color="#13c2c2"
          />
        </Col>
        <Col xs={12} sm={8} md={4}>
          <StatCard
            icon={<EditOutlined />}
            label="Avg Words/Ch"
            value={overview.avgWordsPerChapter}
            color="#f5222d"
          />
        </Col>
      </Row>

      {/* Novel classification */}
      <Card style={{ marginBottom: 32 }}>
        <Title level={5} style={{ marginTop: 0 }}>
          Story Classification
        </Title>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Tag color="blue" style={{ fontSize: 14, padding: "4px 12px" }}>
            {novelClass}
          </Tag>
          <Text type="secondary">
            ~{estimatedPages} pages (at 250 words/page)
          </Text>
        </div>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Words per Part */}
        <Col xs={24} md={12}>
          <Card style={{ height: "100%" }}>
            <Title level={5} style={{ marginTop: 0 }}>
              Words per Part
            </Title>
            {wordsPerPart.length === 0 ? (
              <Text type="secondary">No data yet</Text>
            ) : (
              wordsPerPart.map((p) => {
                const maxWords = Math.max(
                  ...wordsPerPart.map((x) => x.words),
                  1,
                );
                return (
                  <div key={p.part} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text strong>Part {p.part}</Text>
                      <Text type="secondary">
                        {p.words.toLocaleString()} words &middot; {p.chapters}{" "}
                        ch.
                      </Text>
                    </div>
                    <Progress
                      percent={Math.round((p.words / maxWords) * 100)}
                      showInfo={false}
                      strokeLinecap="round"
                      size={["100%", 8]}
                    />
                  </div>
                );
              })
            )}
          </Card>
        </Col>

        {/* Character Mentions */}
        <Col xs={24} md={12}>
          <Card style={{ height: "100%" }}>
            <Title level={5} style={{ marginTop: 0 }}>
              Character Mentions
            </Title>
            {characterMentions.length === 0 ? (
              <Text type="secondary">No characters yet</Text>
            ) : (
              characterMentions.slice(0, 12).map((c) => (
                <div key={c.name} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text strong>{c.name}</Text>
                      <Tag>{c.role}</Tag>
                    </div>
                    <Text type="secondary">{c.count} mentions</Text>
                  </div>
                  <Progress
                    percent={Math.round((c.count / maxMentions) * 100)}
                    showInfo={false}
                    strokeColor="#722ed1"
                    strokeLinecap="round"
                    size={["100%", 6]}
                  />
                </div>
              ))
            )}
          </Card>
        </Col>

        {/* Role Distribution */}
        <Col xs={24} md={12}>
          <Card>
            <Title level={5} style={{ marginTop: 0 }}>
              Character Roles
            </Title>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {roleDistribution.map((r) => (
                <Tag key={r.role}>
                  {r.role}: {r.count}
                </Tag>
              ))}
            </div>
          </Card>
        </Col>

        {/* Chapter Extremes */}
        <Col xs={24} md={12}>
          <Card>
            <Title level={5} style={{ marginTop: 0 }}>
              Chapter Records
            </Title>
            {longestChapter && (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">Longest Chapter</Text>
                <div>
                  <Text strong>
                    {longestChapter.title ||
                      `Part ${longestChapter.part}, Ch. ${longestChapter.chapter}`}
                  </Text>
                </div>
                <Text>{longestChapter.words?.toLocaleString()} words</Text>
              </div>
            )}
            {shortestChapter && (
              <div>
                <Text type="secondary">Shortest Chapter</Text>
                <div>
                  <Text strong>
                    {shortestChapter.title ||
                      `Part ${shortestChapter.part}, Ch. ${shortestChapter.chapter}`}
                  </Text>
                </div>
                <Text>{shortestChapter.words?.toLocaleString()} words</Text>
              </div>
            )}
          </Card>
        </Col>

        {/* Writing Timeline */}
        <Col xs={24}>
          <Card>
            <Title level={5} style={{ marginTop: 0 }}>
              Writing Timeline
            </Title>
            {timeline.length === 0 ? (
              <Text type="secondary">No data yet</Text>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 4,
                  height: 120,
                  overflow: "auto",
                }}
              >
                {timeline.map((t) => {
                  const maxW = Math.max(...timeline.map((x) => x.words), 1);
                  const height = Math.max(4, (t.words / maxW) * 100);
                  return (
                    <div
                      key={t.date}
                      title={`${t.date}: ${t.words.toLocaleString()} words`}
                      style={{
                        flex: "1 0 20px",
                        maxWidth: 40,
                        height: `${height}%`,
                        backgroundColor: token.colorPrimary,
                        borderRadius: "4px 4px 0 0",
                        minWidth: 8,
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          token.colorPrimaryActive)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          token.colorPrimary)
                      }
                    />
                  );
                })}
              </div>
            )}
            {timeline.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {timeline[0].date}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {timeline[timeline.length - 1].date}
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

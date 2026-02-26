"use client";

import { useState, useCallback } from "react";
import {
  Typography,
  Input,
  Segmented,
  Card,
  Tag,
  Spin,
  Alert,
  theme as antdTheme,
} from "antd";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";
import {
  SearchOutlined,
  BookOutlined,
  UserOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useWorld } from "@/components/WorldProvider";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface SearchResult {
  type: "story" | "character" | "location";
  id: string;
  title: string;
  snippet: string;
  meta: Record<string, any>;
}

export default function SearchPage() {
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);
  const { worldId } = useWorld();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useState<NodeJS.Timeout | null>(null);

  const doSearch = useCallback(
    async (q: string, type: string) => {
      if (!q || q.trim().length < 2) {
        setResults([]);
        setSearched(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ q: q.trim(), type });
        if (worldId) params.set("world_id", worldId);
        const res = await fetch(`/api/search?${params}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [worldId],
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    debounceRef[0] = setTimeout(() => doSearch(value, filter), 400);
  };

  const handleFilterChange = (val: string) => {
    setFilter(val);
    if (query.trim().length >= 2) doSearch(query, val);
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.type === "story") {
      router.push("/story");
    } else if (result.type === "character") {
      router.push(`/characters/${result.id}`);
    } else if (result.type === "location") {
      router.push("/locations");
    }
  };

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span
          key={i}
          style={{
            backgroundColor: isDark ? "rgba(250,173,20,0.3)" : "#faad14",
            color: sc.textPrimary,
            padding: "0 2px",
            borderRadius: 2,
          }}
        >
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "story":
        return <BookOutlined />;
      case "character":
        return <UserOutlined />;
      case "location":
        return <EnvironmentOutlined />;
      default:
        return null;
    }
  };

  const typeColor = (type: string): "processing" | "magenta" | "success" => {
    switch (type) {
      case "story":
        return "processing";
      case "character":
        return "magenta";
      case "location":
        return "success";
      default:
        return "processing";
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      <Title level={3}>Search</Title>

      <Input
        placeholder="Search across your story, characters, and locations..."
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        autoFocus
        prefix={<SearchOutlined />}
        suffix={loading ? <Spin size="small" /> : null}
        size="large"
        style={{ marginBottom: 16 }}
      />

      <Segmented
        value={filter}
        onChange={(val) => handleFilterChange(val as string)}
        options={[
          { label: "All", value: "all" },
          { label: "Story", value: "story" },
          { label: "Characters", value: "characters" },
          { label: "Locations", value: "locations" },
        ]}
        style={{ marginBottom: 24 }}
      />

      {error && (
        <Alert
          type="error"
          title={error}
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {searched && results.length === 0 && !loading && (
        <Alert type="info" title={`No results found for "${query}"`} showIcon />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {results.map((result) => (
          <Card
            key={`${result.type}-${result.id}`}
            hoverable
            size="small"
            onClick={() => handleResultClick(result)}
            style={{ cursor: "pointer" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Tag icon={typeIcon(result.type)} color={typeColor(result.type)}>
                {result.type}
              </Tag>
              <Text strong style={{ flex: 1, fontSize: 16 }}>
                {highlightMatch(result.title)}
              </Text>
              {result.meta?.role && <Tag>{result.meta.role}</Tag>}
              {result.meta?.part_number != null && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Part {result.meta.part_number}, Ch.{" "}
                  {result.meta.chapter_number}
                </Text>
              )}
            </div>
            <Text type="secondary" style={{ whiteSpace: "pre-wrap" }}>
              {highlightMatch(result.snippet)}
            </Text>
          </Card>
        ))}
      </div>

      {!searched && !loading && (
        <div
          style={{
            textAlign: "center",
            marginTop: 48,
            color: "rgba(0,0,0,0.25)",
          }}
        >
          <SearchOutlined style={{ fontSize: 64, marginBottom: 16 }} />
          <div>
            <Text type="secondary">Type at least 2 characters to search</Text>
          </div>
        </div>
      )}
    </div>
  );
}

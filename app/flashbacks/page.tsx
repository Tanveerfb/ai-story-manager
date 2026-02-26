"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Input,
  Button,
  Alert,
  Spin,
  Modal,
  Card,
  Tag,
  Select,
  Collapse,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  SaveOutlined,
  BookOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface SearchResult {
  id: string;
  type: "event" | "story_part";
  content: string;
  description?: string;
  characters?: string[];
  locations?: string[];
  storyPartNumber?: number;
  relevanceScore?: number;
}

interface Flashback {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  created_at: string;
}

export default function FlashbacksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [characterFilter, setCharacterFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [savedFlashbacks, setSavedFlashbacks] = useState<Flashback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null,
  );
  const [flashbackTitle, setFlashbackTitle] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [charsRes, locsRes, flashbacksRes] = await Promise.all([
        fetch("/api/characters"),
        fetch("/api/locations"),
        fetch("/api/flashbacks/save"),
      ]);

      if (charsRes.ok) {
        const data = await charsRes.json();
        setCharacters(data);
      }

      if (locsRes.ok) {
        const data = await locsRes.json();
        setLocations(data);
      }

      if (flashbacksRes.ok) {
        const data = await flashbacksRes.json();
        setSavedFlashbacks(data);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !characterFilter && !locationFilter) {
      setError("Please enter a search query or select filters");
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("query", searchQuery);
      if (characterFilter) params.append("character", characterFilter);
      if (locationFilter) params.append("location", locationFilter);

      const response = await fetch(
        `/api/flashbacks/search?${params.toString()}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const results = await response.json();
      setSearchResults(results);

      if (results.length === 0) {
        setError("No matching scenes found");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = (result: SearchResult) => {
    setSelectedResult(result);
    setFlashbackTitle("");
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!selectedResult || !flashbackTitle.trim()) {
      setError("Please enter a title for the flashback");
      return;
    }

    setSaveDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/flashbacks/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: flashbackTitle,
          content: selectedResult.content,
          keywords: searchQuery.split(/\s+/).filter((w) => w.length > 2),
          description: selectedResult.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save flashback");
      }

      setSuccess("Flashback saved successfully!");
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFlashback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flashback?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flashbacks/save?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete flashback");
      }

      setSuccess("Flashback deleted successfully");
      await fetchInitialData();
    } catch (err: any) {
      setError(err.message || "Failed to delete flashback");
    } finally {
      setLoading(false);
    }
  };

  const flashbackCollapseItems = savedFlashbacks.map((flashback) => ({
    key: flashback.id,
    label: (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "center",
        }}
      >
        <Text strong style={{ fontSize: 16 }}>
          {flashback.title}
        </Text>
        <div style={{ display: "flex", gap: 8, marginRight: 16 }}>
          {flashback.keywords.slice(0, 3).map((keyword, i) => (
            <Tag key={i}>{keyword}</Tag>
          ))}
        </div>
      </div>
    ),
    children: (
      <div>
        <Paragraph
          style={{
            whiteSpace: "pre-wrap",
            fontFamily: "Georgia, serif",
            marginBottom: 16,
          }}
        >
          {flashback.content}
        </Paragraph>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteFlashback(flashback.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    ),
  }));

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ margin: "32px 0" }}>
        <Title level={3}>Story Flashbacks</Title>
        <Paragraph type="secondary">
          Search for key scenes and moments in your story by keyword, character,
          or location. Save important scenes as flashbacks for easy reference.
        </Paragraph>

        {/* Search Section */}
        <Card style={{ marginBottom: 32 }}>
          <Title level={5}>Search Scenes</Title>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Input
                placeholder="Enter keywords to search for..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={handleSearch}
              />
            </Col>
            <Col xs={24} md={10}>
              <Select
                style={{ width: "100%" }}
                placeholder="Filter by Character"
                value={characterFilter || undefined}
                onChange={(value) => setCharacterFilter(value || "")}
                allowClear
                options={[
                  { value: "", label: "All Characters" },
                  ...characters.map((char) => ({
                    value: char.name,
                    label: char.name,
                  })),
                ]}
              />
            </Col>
            <Col xs={24} md={10}>
              <Select
                style={{ width: "100%" }}
                placeholder="Filter by Location"
                value={locationFilter || undefined}
                onChange={(value) => setLocationFilter(value || "")}
                allowClear
                options={[
                  { value: "", label: "All Locations" },
                  ...locations.map((loc) => ({
                    value: loc.name,
                    label: loc.name,
                  })),
                ]}
              />
            </Col>
            <Col xs={24} md={4}>
              <Button
                block
                type="primary"
                size="large"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
                style={{ height: 40 }}
              >
                Search
              </Button>
            </Col>
          </Row>
        </Card>

        {error && (
          <Alert
            type="error"
            title={error}
            showIcon
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        {success && (
          <Alert
            type="success"
            title={success}
            showIcon
            closable
            onClose={() => setSuccess(null)}
            style={{ marginBottom: 24 }}
          />
        )}

        {loading && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              margin: "32px 0",
            }}
          >
            <Spin size="large" />
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <Title level={5}>Search Results ({searchResults.length})</Title>
            <Row gutter={[16, 16]}>
              {searchResults.map((result, index) => (
                <Col span={24} key={index}>
                  <Card>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <div style={{ flexGrow: 1 }}>
                        <Tag color="blue" style={{ marginBottom: 8 }}>
                          {result.type === "event"
                            ? "Event"
                            : `Part ${result.storyPartNumber}`}
                        </Tag>
                        {result.description && (
                          <div>
                            <Text strong style={{ fontSize: 16 }}>
                              {result.description}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Button
                        size="small"
                        icon={<SaveOutlined />}
                        onClick={() => handleSaveClick(result)}
                      >
                        Save as Flashback
                      </Button>
                    </div>
                    <Text
                      type="secondary"
                      style={{
                        whiteSpace: "pre-wrap",
                        fontFamily: "Georgia, serif",
                        display: "block",
                      }}
                    >
                      {result.content.slice(0, 500)}
                      {result.content.length > 500 ? "..." : ""}
                    </Text>
                    {(result.characters || result.locations) && (
                      <div
                        style={{
                          marginTop: 16,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        {result.characters?.map((char, i) => (
                          <Tag key={i}>{char}</Tag>
                        ))}
                        {result.locations?.map((loc, i) => (
                          <Tag key={i} color="purple">
                            {loc}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}

        {/* Saved Flashbacks */}
        <div>
          <Title
            level={5}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <BookOutlined />
            Saved Flashbacks ({savedFlashbacks.length})
          </Title>
          {savedFlashbacks.length === 0 ? (
            <Alert
              type="info"
              title="No saved flashbacks yet. Search for scenes and save them as flashbacks for quick reference."
              showIcon
            />
          ) : (
            <Collapse items={flashbackCollapseItems} />
          )}
        </div>
      </div>

      {/* Save Flashback Modal */}
      <Modal
        title="Save as Flashback"
        open={saveDialogOpen}
        onCancel={() => setSaveDialogOpen(false)}
        onOk={handleConfirmSave}
        okText="Save"
        okButtonProps={{ disabled: !flashbackTitle.trim() }}
      >
        <div style={{ marginTop: 16 }}>
          <Input
            placeholder="Enter a descriptive title..."
            value={flashbackTitle}
            onChange={(e) => setFlashbackTitle(e.target.value)}
            autoFocus
          />
          {selectedResult && (
            <Card size="small" style={{ marginTop: 16 }}>
              <Text type="secondary">Preview:</Text>
              <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                {selectedResult.content.slice(0, 200)}...
              </Paragraph>
            </Card>
          )}
        </div>
      </Modal>
    </div>
  );
}

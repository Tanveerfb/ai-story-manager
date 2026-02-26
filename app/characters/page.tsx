"use client";

import { useEffect, useState } from "react";
import { Typography, Input, Select, Button, Alert, Spin, Row, Col } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import CharacterCard from "@/components/CharacterCard";
import CharacterRefineDialog from "@/components/CharacterRefineDialog";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function CharactersPage() {
  const [characters, setCharacters] = useState<any[]>([]);
  const [filteredCharacters, setFilteredCharacters] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);
  const [refineTarget, setRefineTarget] = useState<any | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchCharacters();
  }, []);

  useEffect(() => {
    let filtered = characters;

    if (searchTerm) {
      filtered = filtered.filter((char) =>
        char.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((char) => char.role === roleFilter);
    }

    setFilteredCharacters(filtered);
  }, [characters, searchTerm, roleFilter]);

  const fetchCharacters = async () => {
    try {
      const response = await fetch("/api/characters");
      if (response.ok) {
        const data = await response.json();
        setCharacters(data);
        setFilteredCharacters(data);
      }
    } catch (error) {
      console.error("Failed to fetch characters:", error);
    }
  };

  const handleExtractFromStory = async () => {
    setExtracting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/characters?action=extract", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract characters");
      }

      const result = await response.json();

      console.log("Extraction result:", result);

      let message = `Successfully extracted ${result.newCharacters} new character(s) and updated ${result.updatedCharacters} existing character(s)!`;

      if (result.extractedNames && result.extractedNames.length > 0) {
        message += ` Found: ${result.extractedNames.join(", ")}`;
      }

      if (result.message) {
        message = result.message;
      }

      setMessage({
        type: result.totalExtracted === 0 ? "warning" : "success",
        text: message,
      });

      // Refresh the characters list
      await fetchCharacters();
    } catch (error: any) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setExtracting(false);
    }
  };

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
          <Title level={2} style={{ margin: 0 }}>
            Characters
          </Title>
          <Button
            type="primary"
            onClick={handleExtractFromStory}
            disabled={extracting}
            icon={
              extracting ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />}
                  size="small"
                />
              ) : null
            }
          >
            {extracting ? "Extracting..." : "Extract from Story Parts"}
          </Button>
        </div>

        {message && (
          <Alert
            type={message.type}
            title={message.text}
            closable
            onClose={() => setMessage(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} md={16}>
            <Input
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: "100%" }}
              placeholder="Filter by Role"
              value={roleFilter || undefined}
              onChange={(value) => setRoleFilter(value || "")}
              allowClear
              options={[
                { value: "", label: "All" },
                { value: "main", label: "Main" },
                { value: "side", label: "Side" },
                { value: "minor", label: "Minor" },
              ]}
            />
          </Col>
        </Row>

        {filteredCharacters.length === 0 ? (
          <Text type="secondary">
            No characters found. Import a story to extract characters.
          </Text>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredCharacters.map((character) => (
              <Col xs={24} sm={12} md={8} key={character.id}>
                <CharacterCard
                  character={character}
                  onClick={() => router.push(`/characters/${character.id}`)}
                  onRefine={(char) => setRefineTarget(char)}
                />
              </Col>
            ))}
          </Row>
        )}
      </div>

      <CharacterRefineDialog
        open={!!refineTarget}
        character={refineTarget}
        onClose={() => setRefineTarget(null)}
        onSaved={(updates) => {
          // Merge updates into local state so UI reflects changes immediately
          setCharacters((prev) =>
            prev.map((c) =>
              c.id === refineTarget?.id ? { ...c, ...updates } : c,
            ),
          );
        }}
      />
    </div>
  );
}

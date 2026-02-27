"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Row,
  Col,
  Input,
  Button,
  Alert,
  Card,
  Select,
  Divider,
  Tag,
  Tooltip,
  Segmented,
  Slider,
  Spin,
  Progress,
} from "antd";
import {
  ThunderboltOutlined,
  ReloadOutlined,
  ClearOutlined,
  PlusOutlined,
  DownOutlined,
  UpOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  StopOutlined,
  AuditOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

import { theme as antdTheme } from "antd";
import GenerationProgress from "@/components/continue/GenerationProgress";
import ModelSelector from "@/components/continue/ModelSelector";
import EntityManager from "@/components/continue/EntityManager";
import LocationManager from "@/components/continue/LocationManager";
import { useWorld } from "@/components/WorldProvider";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";
import { DEFAULT_AI_MODEL } from "@/lib/constants";

const { Text, Title } = Typography;
const { TextArea } = Input;

export default function ContinuePage() {
  const { worldId } = useWorld();
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);

  // Core state
  const [userPrompt, setUserPrompt] = useState("");
  const [characterFocus, setCharacterFocus] = useState("");
  const [characters, setCharacters] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL);
  const [loading, setLoading] = useState(false);
  const [continuation, setContinuation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generation controls
  const [generationStyle, setGenerationStyle] = useState<"strict" | "creative">(
    "strict",
  );
  const [maxTokens, setMaxTokens] = useState(600);
  const [temperature, setTemperature] = useState<number | null>(null); // null = use style default
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Status
  const [status, setStatus] = useState("Ready");
  const [contextNotes, setContextNotes] = useState<string[]>([]);

  // Story memory
  const [storyMemory, setStoryMemory] = useState<{
    content: string;
    part_count: number;
    generated_at: string;
  } | null>(null);
  const [memoryLoading, setMemoryLoading] = useState(false);
  const [memoryExpanded, setMemoryExpanded] = useState(false);

  // Part/Chapter selector
  const [availableParts, setAvailableParts] = useState<number[]>([]);
  const [selectedPartNumber, setSelectedPartNumber] = useState<number | "new">(
    "new",
  );

  // Auto-continue state
  const [autoContinueCount, setAutoContinueCount] = useState(3);
  const [autoContinueRunning, setAutoContinueRunning] = useState(false);
  const [autoContinueProgress, setAutoContinueProgress] = useState(0);
  const [autoContinueStop, setAutoContinueStop] = useState(false);

  // Consistency checker state
  const [consistencyLoading, setConsistencyLoading] = useState(false);
  const [consistencyResult, setConsistencyResult] = useState<{
    issues: {
      type: string;
      severity: string;
      description: string;
      quote: string;
      suggestion: string;
    }[];
    summary: string;
  } | null>(null);

  useEffect(() => {
    fetchCharacters();
    fetchLocations();
    fetchAvailableParts();
    fetchStoryMemory();
  }, [worldId]);

  const fetchCharacters = async () => {
    try {
      const response = await fetch(
        `/api/characters${worldId ? `?world_id=${worldId}` : ""}`,
      );
      if (response.ok) setCharacters(await response.json());
    } catch (e) {
      console.error("Failed to fetch characters:", e);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await fetch(
        `/api/locations${worldId ? `?world_id=${worldId}` : ""}`,
      );
      if (response.ok) setLocations(await response.json());
    } catch (e) {
      console.error("Failed to fetch locations:", e);
    }
  };

  const fetchAvailableParts = async () => {
    try {
      const response = await fetch(
        `/api/story-parts?action=list-parts${worldId ? `&world_id=${worldId}` : ""}`,
      );
      if (response.ok) {
        const data = await response.json();
        const nums: number[] = data.partNumbers || [];
        setAvailableParts(nums);
        setSelectedPartNumber(nums.length > 0 ? nums[nums.length - 1] : "new");
      }
    } catch (e) {
      console.error("Failed to fetch available parts:", e);
    }
  };

  const fetchStoryMemory = async () => {
    try {
      const res = await fetch("/api/story-memory");
      if (res.ok) {
        const data = await res.json();
        setStoryMemory(data.memory);
      }
    } catch {
      // No memory yet
    }
  };

  const handleGenerateMemory = async () => {
    setMemoryLoading(true);
    try {
      const res = await fetch("/api/story-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selectedModel }),
      });
      if (res.ok) {
        const data = await res.json();
        setStoryMemory(data.memory);
        setMemoryExpanded(true);
        setSuccess("Story memory generated.");
      } else {
        const err = await res.json();
        setError(err.error || "Failed to generate memory");
      }
    } catch {
      setError("Failed to generate memory");
    } finally {
      setMemoryLoading(false);
    }
  };

  const handleClearMemory = async () => {
    try {
      await fetch("/api/story-memory", { method: "DELETE" });
      setStoryMemory(null);
    } catch {
      setError("Failed to clear memory");
    }
  };

  // ─── Generation ───

  const handleGenerate = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError(null);
    setContinuation(null);
    setStatus("Generating...");

    try {
      const response = await fetch("/api/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          userPrompt,
          characterFocus: characterFocus || null,
          model: selectedModel,
          generationStyle,
          maxTokens,
          temperature,
          worldId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Generation failed");
      }

      const result = await response.json();
      setContinuation(result.continuation);
      setContextNotes(result.contextNotes || []);
      setStatus("Done");
    } catch (err: any) {
      setError(err.message);
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  // ─── Insert into Story ───

  const handleInsertIntoStory = async () => {
    if (!continuation) return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Extract & merge entities
      setStatus("Extracting entities...");

      let entitySummary = "";
      try {
        const extractResponse = await fetch("/api/extract-entities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: continuation }),
        });

        if (extractResponse.ok) {
          const extracted = await extractResponse.json();

          const findExisting = (list: any[], name: string) =>
            list.find((item) => item.name.toLowerCase() === name.toLowerCase());

          let addedChars = 0;
          let updatedChars = 0;
          let addedLocs = 0;
          let addedRels = 0;

          for (const char of extracted.characters || []) {
            const existing = findExisting(characters, char.name);
            if (!existing) {
              const r = await fetch("/api/characters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...char, world_id: worldId }),
              });
              if (r.ok) addedChars++;
            } else {
              const mergedTraits = Array.isArray(existing.traits)
                ? [...existing.traits]
                : [];
              for (const t of char.traits || []) {
                if (
                  !mergedTraits.some(
                    (m: string) => m.toLowerCase() === t.toLowerCase(),
                  )
                ) {
                  mergedTraits.push(t);
                }
              }

              const updates: any = { traits: mergedTraits };
              if (
                char.personality &&
                (!existing.personality ||
                  String(existing.personality).length <
                    String(char.personality).length)
              ) {
                updates.personality = char.personality;
              }
              if (
                char.description &&
                (!existing.description ||
                  existing.description.length < char.description.length)
              ) {
                updates.description = char.description;
              }
              if (char.goals && !existing.goals) {
                updates.goals = char.goals;
              }

              const r = await fetch(`/api/characters/${existing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
              });
              if (r.ok) updatedChars++;
            }
          }

          for (const rel of extracted.relationships || []) {
            const char1 = findExisting(characters, rel.character_1);
            const char2 = findExisting(characters, rel.character_2);
            if (char1 && char2) {
              const r = await fetch("/api/characters?action=add-relationship", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  character_1_id: char1.id,
                  character_2_id: char2.id,
                  relationship_type:
                    rel.relationship_type || rel.type || "unknown",
                  description: rel.dynamic || rel.description || "",
                }),
              });
              if (r.ok) addedRels++;
            }
          }

          for (const loc of extracted.locations || []) {
            if (!findExisting(locations, loc.name)) {
              const r = await fetch("/api/locations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...loc, world_id: worldId }),
              });
              if (r.ok) addedLocs++;
            }
          }

          await fetchCharacters();
          await fetchLocations();

          const parts = [];
          if (addedChars > 0)
            parts.push(
              `${addedChars} new character${addedChars > 1 ? "s" : ""}`,
            );
          if (updatedChars > 0) parts.push(`${updatedChars} updated`);
          if (addedRels > 0)
            parts.push(`${addedRels} relationship${addedRels > 1 ? "s" : ""}`);
          if (addedLocs > 0)
            parts.push(`${addedLocs} location${addedLocs > 1 ? "s" : ""}`);
          if (parts.length > 0) entitySummary = ` (${parts.join(", ")})`;
        }
      } catch {
        // Entity extraction failing should not block story insertion
      }

      // Step 2: Insert the story part
      setStatus("Saving to story...");

      const partsResponse = await fetch(
        `/api/story-parts${worldId ? `?world_id=${worldId}` : ""}`,
      );
      const allParts = await partsResponse.json();

      let partNumber: number;
      let chapterNumber: number;

      if (selectedPartNumber === "new" || availableParts.length === 0) {
        partNumber =
          allParts.length > 0
            ? Math.max(...allParts.map((p: any) => p.part_number)) + 1
            : 1;
        chapterNumber = 1;
      } else {
        partNumber = selectedPartNumber as number;
        const chaptersInPart = allParts.filter(
          (p: any) => p.part_number === partNumber,
        );
        chapterNumber =
          chaptersInPart.length > 0
            ? Math.max(
                ...chaptersInPart.map((p: any) => p.chapter_number || 1),
              ) + 1
            : 1;
      }

      const response = await fetch("/api/story-parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          part_number: partNumber,
          chapter_number: chapterNumber,
          title: `Part ${partNumber} — Chapter ${chapterNumber}`,
          content: continuation,
          word_count: continuation.split(/\s+/).length,
          world_id: worldId,
        }),
      });

      if (!response.ok) throw new Error("Failed to insert into story");

      setSuccess(
        `Part ${partNumber}, Chapter ${chapterNumber} saved${entitySummary}.`,
      );
      setContinuation(null);
      setContextNotes([]);
      setStatus("Ready");
      fetchAvailableParts();
    } catch (err: any) {
      setError(err.message || "Failed to insert into story");
      setStatus("Ready");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setContinuation(null);
    setContextNotes([]);
    setError(null);
    setSuccess(null);
  };

  // ─── Auto-Continue ───
  const handleAutoContinue = async () => {
    if (!userPrompt.trim()) {
      setError("Please enter a prompt first");
      return;
    }
    setAutoContinueRunning(true);
    setAutoContinueStop(false);
    setAutoContinueProgress(0);
    setError(null);

    for (let i = 0; i < autoContinueCount; i++) {
      if (autoContinueStop) break;
      setAutoContinueProgress(i + 1);
      setStatus(
        `Auto-continue: generating chapter ${i + 1} of ${autoContinueCount}...`,
      );

      try {
        // Generate
        const genRes = await fetch("/api/continue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "generate",
            userPrompt:
              i === 0
                ? userPrompt
                : `Continue the story naturally from where the previous chapter left off. ${userPrompt}`,
            characterFocus: characterFocus || null,
            model: selectedModel,
            generationStyle,
            maxTokens,
            worldId,
          }),
        });

        if (!genRes.ok) {
          const errData = await genRes.json();
          throw new Error(errData.error || "Generation failed");
        }

        const genResult = await genRes.json();
        const text = genResult.continuation;
        if (!text) throw new Error("Empty generation");

        // Auto-insert
        setStatus(`Auto-continue: inserting chapter ${i + 1}...`);

        // Extract entities
        try {
          await fetch("/api/extract-entities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
        } catch {}

        // Determine part/chapter
        const partsRes = await fetch(
          `/api/story-parts?action=list-parts${worldId ? `&world_id=${worldId}` : ""}`,
        );
        let partNumber = 1;
        let chapterNumber = 1;
        if (partsRes.ok) {
          const partsData = await partsRes.json();
          if (partsData.length > 0) {
            const lastPart = partsData[partsData.length - 1];
            partNumber = lastPart.part_number;
            chapterNumber = (lastPart.max_chapter || 0) + 1;
          }
        }

        // Insert
        const insertRes = await fetch("/api/story-parts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            part_number: partNumber,
            chapter_number: chapterNumber,
            world_id: worldId,
          }),
        });

        if (!insertRes.ok) throw new Error("Failed to insert chapter");
      } catch (err: any) {
        setError(`Auto-continue stopped at chapter ${i + 1}: ${err.message}`);
        break;
      }
    }

    setAutoContinueRunning(false);
    setStatus("Ready");
    setSuccess(
      `Auto-continue finished! Generated ${autoContinueProgress} chapter(s).`,
    );
    fetchAvailableParts();
  };

  // ─── Consistency Check ───
  const handleConsistencyCheck = async () => {
    if (!continuation) return;
    setConsistencyLoading(true);
    setConsistencyResult(null);
    try {
      const res = await fetch("/api/continue-story/consistency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: continuation,
          worldId,
          model: selectedModel,
        }),
      });
      if (!res.ok) throw new Error("Consistency check failed");
      const result = await res.json();
      setConsistencyResult(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConsistencyLoading(false);
    }
  };

  // ─── Render ───

  return (
    <div style={{ maxWidth: 1536, margin: "0 auto", padding: "0 12px" }}>
      <div style={{ margin: "16px 0 24px" }}>
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThunderboltOutlined
              style={{ fontSize: 20, color: token.colorPrimary }}
            />
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Continue Story
            </Title>
          </div>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={loading}
          />
        </div>

        {/* Story Memory — compact bar */}
        <Card
          size="small"
          style={{
            marginBottom: 16,
            borderColor: storyMemory ? token.colorPrimary : undefined,
          }}
          styles={{ body: { padding: 0 } }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              cursor: storyMemory ? "pointer" : "default",
            }}
            onClick={() => storyMemory && setMemoryExpanded((v) => !v)}
          >
            <Text type="secondary" style={{ fontSize: 13 }}>
              {storyMemory
                ? `Story Memory active — ${storyMemory.part_count} parts condensed`
                : "Story Memory — not generated"}
            </Text>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {storyMemory && (
                <Button
                  size="small"
                  type="text"
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearMemory();
                  }}
                >
                  Clear
                </Button>
              )}
              <Button
                size="small"
                type={storyMemory ? "text" : "default"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleGenerateMemory();
                }}
                disabled={memoryLoading}
              >
                {memoryLoading
                  ? "Generating…"
                  : storyMemory
                    ? "Regenerate"
                    : "Generate"}
              </Button>
              {storyMemory && (
                <Button
                  type="text"
                  size="small"
                  icon={memoryExpanded ? <UpOutlined /> : <DownOutlined />}
                />
              )}
            </div>
          </div>
          {memoryExpanded && storyMemory && (
            <div
              style={{
                padding: "0 16px 12px",
                borderTop: `1px solid ${sc.border}`,
              }}
            >
              <Text
                type="secondary"
                style={{
                  whiteSpace: "pre-wrap",
                  display: "block",
                  marginTop: 8,
                  fontSize: "0.8rem",
                }}
              >
                {storyMemory?.content}
              </Text>
            </div>
          )}
        </Card>

        <Row gutter={[16, 16]}>
          {/* ─── Main Column ─── */}
          <Col xs={24} lg={16}>
            {/* Prompt Card */}
            <Card style={{ marginBottom: 16 }}>
              {/* Generation style toggle + character focus — single row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                <Segmented
                  value={generationStyle}
                  onChange={(v) =>
                    setGenerationStyle(v as "strict" | "creative")
                  }
                  disabled={loading}
                  options={[
                    {
                      label: (
                        <Tooltip title="AI renders your exact narrative intent as prose — no inventions">
                          <span>Reword</span>
                        </Tooltip>
                      ),
                      value: "strict",
                    },
                    {
                      label: (
                        <Tooltip title="AI uses your prompt as a starting point and expands freely">
                          <span>Expand</span>
                        </Tooltip>
                      ),
                      value: "creative",
                    },
                  ]}
                />

                <Select
                  value={characterFocus || undefined}
                  onChange={(v) => setCharacterFocus(v ?? "")}
                  placeholder="Play as"
                  allowClear
                  disabled={loading}
                  style={{ minWidth: 160 }}
                  options={[
                    ...characters.map((char) => ({
                      label: char.name,
                      value: char.name,
                    })),
                  ]}
                />

                <Button
                  size="small"
                  type="text"
                  onClick={() => setShowAdvanced((v) => !v)}
                  style={{ marginLeft: "auto" }}
                >
                  {showAdvanced ? "Hide settings" : "Settings"}
                </Button>
              </div>

              {/* Advanced settings (collapsible) */}
              {showAdvanced && (
                <div style={{ marginBottom: 16, paddingLeft: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Max Tokens: {maxTokens}
                  </Text>
                  <Slider
                    value={maxTokens}
                    onChange={(v) => setMaxTokens(v)}
                    min={100}
                    max={3000}
                    step={50}
                    disabled={loading}
                    marks={{
                      100: "100",
                      600: "600",
                      1500: "1500",
                      3000: "3000",
                    }}
                    tooltip={{ open: undefined }}
                    style={{ maxWidth: 400 }}
                  />

                  <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Temperature:{" "}
                      {temperature === null
                        ? `Auto (${generationStyle === "strict" ? "0.45" : "0.82"})`
                        : temperature.toFixed(2)}
                    </Text>
                    <Slider
                      value={
                        temperature ??
                        (generationStyle === "strict" ? 0.45 : 0.82)
                      }
                      onChange={(v) => setTemperature(v)}
                      min={0.1}
                      max={1.5}
                      step={0.05}
                      disabled={loading}
                      marks={{
                        0.1: "Precise",
                        0.45: "0.45",
                        0.82: "0.82",
                        1.2: "Wild",
                      }}
                      tooltip={{ open: undefined }}
                      style={{ maxWidth: 400 }}
                    />
                    {temperature !== null && (
                      <Button
                        size="small"
                        type="link"
                        onClick={() => setTemperature(null)}
                        style={{ padding: 0, fontSize: 12 }}
                      >
                        Reset to auto
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Prompt text area */}
              <TextArea
                rows={5}
                placeholder={
                  characterFocus
                    ? `Playing as ${characterFocus}. Describe what they do, say, or experience next...`
                    : generationStyle === "strict"
                      ? "Describe what happens next — the AI will render it as prose without adding anything extra."
                      : "Describe what should happen next — the AI will expand on it creatively..."
                }
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                disabled={loading}
                style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
              />

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 16,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <Button
                  type="primary"
                  onClick={handleGenerate}
                  disabled={loading || !userPrompt.trim()}
                  icon={<ThunderboltOutlined />}
                  style={{ paddingInline: 24 }}
                >
                  Generate
                </Button>
                <Tooltip title="Retry">
                  <Button
                    type="text"
                    onClick={handleGenerate}
                    disabled={loading || !userPrompt.trim()}
                    icon={<ReloadOutlined />}
                    size="small"
                  />
                </Tooltip>
                <Tooltip title="Clear output">
                  <Button
                    type="text"
                    onClick={handleClear}
                    disabled={loading || !continuation}
                    icon={<ClearOutlined />}
                    size="small"
                  />
                </Tooltip>
              </div>

              {/* Auto-Continue Section */}
              <Card size="small" style={{ marginTop: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <SyncOutlined style={{ color: token.colorTextSecondary }} />
                  <Text strong style={{ flex: 1, minWidth: 100 }}>
                    Auto-Continue
                  </Text>
                  <Input
                    size="small"
                    type="number"
                    placeholder="Chapters"
                    value={autoContinueCount}
                    onChange={(e) =>
                      setAutoContinueCount(
                        Math.max(1, Math.min(20, Number(e.target.value) || 1)),
                      )
                    }
                    style={{ width: 100 }}
                    min={1}
                    max={20}
                    disabled={autoContinueRunning}
                  />
                  {autoContinueRunning ? (
                    <Button
                      danger
                      icon={<StopOutlined />}
                      onClick={() => setAutoContinueStop(true)}
                    >
                      Stop
                    </Button>
                  ) : (
                    <Button
                      icon={<SyncOutlined />}
                      onClick={handleAutoContinue}
                      disabled={loading || !userPrompt.trim()}
                    >
                      Auto-Write
                    </Button>
                  )}
                </div>
                {autoContinueRunning && (
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={Math.round(
                        (autoContinueProgress / autoContinueCount) * 100,
                      )}
                      size="small"
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Chapter {autoContinueProgress} of {autoContinueCount}
                    </Text>
                  </div>
                )}
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginTop: 4 }}
                >
                  Generates and auto-inserts multiple chapters sequentially
                  using your prompt as the base direction.
                </Text>
              </Card>
            </Card>

            {/* Generation Progress */}
            <GenerationProgress
              isGenerating={loading}
              status={status}
              contextNotes={contextNotes}
            />

            {/* Alerts */}
            {error && (
              <Alert
                type="error"
                title={error}
                closable
                onClose={() => setError(null)}
                style={{ marginBottom: 16 }}
              />
            )}
            {success && (
              <Alert
                type="success"
                title={success}
                closable
                onClose={() => setSuccess(null)}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Generated Output */}
            {continuation && (
              <Card style={{ marginBottom: 16 }}>
                <Text
                  type="secondary"
                  strong
                  style={{ display: "block", marginBottom: 12 }}
                >
                  Generated — edit as needed, then insert into your story:
                </Text>

                <TextArea
                  autoSize={{ minRows: 12 }}
                  value={continuation}
                  onChange={(e) => setContinuation(e.target.value)}
                  disabled={loading}
                  style={{
                    marginBottom: 16,
                    fontFamily: "Georgia, serif",
                    fontSize: "1rem",
                    lineHeight: 1.8,
                  }}
                />

                <Divider style={{ marginBottom: 16 }} />

                {/* Insert controls */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <Select
                    value={selectedPartNumber}
                    onChange={(v) =>
                      setSelectedPartNumber(v === "new" ? "new" : Number(v))
                    }
                    disabled={loading}
                    style={{ minWidth: 150 }}
                    placeholder="Insert into"
                    options={[
                      ...availableParts.map((num) => ({
                        label: `Part ${num}`,
                        value: num,
                      })),
                      { label: "+ New Part", value: "new" as any },
                    ]}
                  />

                  <Text type="secondary" style={{ flex: 1, fontSize: 12 }}>
                    {selectedPartNumber === "new"
                      ? "Creates new part, Chapter 1"
                      : `Adds next chapter to Part ${selectedPartNumber}`}
                  </Text>

                  <Button
                    icon={
                      consistencyLoading ? (
                        <LoadingOutlined />
                      ) : (
                        <AuditOutlined />
                      )
                    }
                    onClick={handleConsistencyCheck}
                    disabled={loading || consistencyLoading}
                  >
                    Check Consistency
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleInsertIntoStory}
                    disabled={loading}
                  >
                    Insert into Story
                  </Button>
                </div>

                {/* Consistency Results */}
                {consistencyResult && (
                  <div style={{ marginTop: 16 }}>
                    <Alert
                      type={
                        consistencyResult.issues.length === 0
                          ? "success"
                          : "warning"
                      }
                      title={consistencyResult.summary}
                      style={{ marginBottom: 8 }}
                    />
                    {consistencyResult.issues.map((issue, i) => (
                      <Card key={i} size="small" style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <Tag
                            color={
                              issue.severity === "high"
                                ? "error"
                                : issue.severity === "medium"
                                  ? "warning"
                                  : "default"
                            }
                          >
                            {issue.type}
                          </Tag>
                          <Tag>{issue.severity}</Tag>
                        </div>
                        <Text style={{ display: "block", marginBottom: 4 }}>
                          {issue.description}
                        </Text>
                        {issue.quote && (
                          <Text
                            type="secondary"
                            italic
                            style={{ display: "block", marginBottom: 4 }}
                          >
                            &ldquo;{issue.quote}&rdquo;
                          </Text>
                        )}
                        {issue.suggestion && (
                          <Text type="success">
                            Suggestion: {issue.suggestion}
                          </Text>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </Col>

          {/* ─── Sidebar ─── */}
          <Col xs={24} lg={8}>
            <EntityManager
              characters={characters}
              onCharactersChange={fetchCharacters}
            />
            <LocationManager
              locations={locations}
              onLocationsChange={fetchLocations}
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}

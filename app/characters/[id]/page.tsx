"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Typography,
  Card,
  Tabs,
  Tag,
  Avatar,
  Row,
  Col,
  Button,
  Spin,
  Input,
  Alert,
  Tooltip,
  Divider,
  Modal,
  Select,
} from "antd";
import {
  HighlightOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CharacterDetailPage() {
  const params = useParams();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Portrait generation
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // Editable fields
  const [traits, setTraits] = useState<string[]>([]);
  const [newTrait, setNewTrait] = useState("");
  const [physicalTraits, setPhysicalTraits] = useState<string[]>([]);
  const [newPhysicalTrait, setNewPhysicalTrait] = useState("");
  const [personality, setPersonality] = useState("");
  const [description, setDescription] = useState("");
  const [background, setBackground] = useState("");
  const [goals, setGoals] = useState("");
  const [role, setRole] = useState<string>("side");

  // Behavior fields
  const [behaviorNotes, setBehaviorNotes] = useState("");
  const [speechPatterns, setSpeechPatterns] = useState("");
  const [fears, setFears] = useState("");
  const [motivations, setMotivations] = useState("");
  const [arcNotes, setArcNotes] = useState("");

  // Voice profile fields
  const [dialogueStyle, setDialogueStyle] = useState("");
  const [vocabularyLevel, setVocabularyLevel] = useState("");
  const [catchphrases, setCatchphrases] = useState<string[]>([]);
  const [newCatchphrase, setNewCatchphrase] = useState("");

  // Relationships
  const [relationships, setRelationships] = useState<any[]>([]);
  const [allCharacters, setAllCharacters] = useState<any[]>([]);
  const [newRelDialog, setNewRelDialog] = useState(false);
  const [newRelCharId, setNewRelCharId] = useState("");
  const [newRelType, setNewRelType] = useState("");
  const [newRelDesc, setNewRelDesc] = useState("");
  const [deleteRelTarget, setDeleteRelTarget] = useState<string | null>(null);

  const handleGeneratePortrait = async () => {
    if (!character) return;
    setPortraitLoading(true);
    setPortraitError(null);
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: character.id,
          customPrompt: customPrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCharacter((prev: any) => ({ ...prev, avatar_url: data.portrait }));
    } catch (err: any) {
      setPortraitError(err.message || "Failed to generate portrait");
    } finally {
      setPortraitLoading(false);
    }
  };

  const populateFields = useCallback((char: any) => {
    setTraits(
      Array.isArray(char.traits)
        ? char.traits
        : typeof char.traits === "string"
          ? JSON.parse(char.traits || "[]")
          : [],
    );
    const pt = char.physical_traits
      ? typeof char.physical_traits === "string"
        ? JSON.parse(char.physical_traits)
        : Array.isArray(char.physical_traits)
          ? char.physical_traits.map((t: any) =>
              typeof t === "string" ? t : t.name || String(t),
            )
          : []
      : [];
    setPhysicalTraits(pt);
    setPersonality(
      typeof char.personality === "string"
        ? char.personality
        : char.personality
          ? JSON.stringify(char.personality)
          : "",
    );
    setDescription(char.description || "");
    setBackground(char.background || "");
    setGoals(char.goals || "");
    setRole(char.role || "side");
    setBehaviorNotes(char.behavior_notes || "");
    setSpeechPatterns(char.speech_patterns || "");
    setFears(char.fears || "");
    setMotivations(char.motivations || "");
    setArcNotes(char.arc_notes || "");
    setDialogueStyle(char.dialogue_style || "");
    setVocabularyLevel(char.vocabulary_level || "");
    setCatchphrases(char.catchphrases || []);
    setRelationships(char.relationships || []);
  }, []);

  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchCharacter(id);
      fetchAllCharacters();
    }
  }, [params]);

  const fetchCharacter = async (id: string) => {
    try {
      const response = await fetch(`/api/characters/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCharacter(data);
        populateFields(data);
      }
    } catch (err) {
      console.error("Failed to fetch character:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllCharacters = async () => {
    try {
      const res = await fetch("/api/characters");
      if (res.ok) setAllCharacters(await res.json());
    } catch {}
  };

  const handleSave = async () => {
    if (!character) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          traits,
          physical_traits: physicalTraits,
          personality,
          description,
          background,
          goals,
          behavior_notes: behaviorNotes,
          speech_patterns: speechPatterns,
          fears,
          motivations,
          arc_notes: arcNotes,
          dialogue_style: dialogueStyle,
          vocabulary_level: vocabularyLevel,
          catchphrases,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess("Character saved.");
      const updated = await res.json();
      setCharacter(updated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTrait = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
    clear: () => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!list.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setList([...list, trimmed]);
    }
    clear();
  };

  const removeTrait = (
    list: string[],
    setList: (v: string[]) => void,
    index: number,
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleAddRelationship = async () => {
    if (!newRelCharId || !newRelType) return;
    setSaving(true);
    try {
      const res = await fetch("/api/characters?action=add-relationship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character_1_id: character.id,
          character_2_id: newRelCharId,
          relationship_type: newRelType,
          description: newRelDesc,
        }),
      });
      if (!res.ok) throw new Error("Failed to add relationship");
      setNewRelDialog(false);
      setNewRelCharId("");
      setNewRelType("");
      setNewRelDesc("");
      // Refresh character to get updated relationships
      fetchCharacter(character.id);
      setSuccess("Relationship added.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelationship = async () => {
    if (!deleteRelTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/characters/${character.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _deleteRelationship: deleteRelTarget }),
      });
      // also directly delete from relationships table
      await fetch(
        `/api/characters?action=delete-relationship&id=${deleteRelTarget}`,
        {
          method: "POST",
        },
      );
      setDeleteRelTarget(null);
      fetchCharacter(character.id);
      setSuccess("Relationship removed.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!character) {
    return <Text>Character not found</Text>;
  }

  // Other characters for relationship picker (exclude self)
  const otherCharacters = allCharacters.filter((c) => c.id !== character.id);

  const tabItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <div style={{ padding: 24 }}>
          <Title level={5}>Description</Title>
          <TextArea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Physical appearance, key identifying features..."
            style={{ marginBottom: 24 }}
          />

          <Title level={5}>Background</Title>
          <TextArea
            rows={3}
            value={background}
            onChange={(e) => setBackground(e.target.value)}
            placeholder="Character history, backstory..."
            style={{ marginBottom: 24 }}
          />

          <Title level={5}>Goals</Title>
          <TextArea
            rows={2}
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="What does this character want?"
          />

          {character.first_appearance_part && (
            <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
              First appeared in Part {character.first_appearance_part}
            </Text>
          )}
        </div>
      ),
    },
    {
      key: "traits",
      label: "Traits",
      children: (
        <div style={{ padding: 24 }}>
          <Title level={5}>Personality</Title>
          <TextArea
            rows={2}
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="Describe the character's personality..."
            style={{ marginBottom: 24 }}
          />

          <Title level={5}>Character Traits</Title>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 8,
            }}
          >
            {traits.map((trait, i) => (
              <Tag
                key={i}
                color="blue"
                closable
                onClose={() => removeTrait(traits, setTraits, i)}
              >
                {trait}
              </Tag>
            ))}
            {traits.length === 0 && (
              <Text type="secondary">No traits yet.</Text>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            <Input
              size="small"
              placeholder="Add a trait..."
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTrait(traits, setTraits, newTrait, () => setNewTrait(""));
                }
              }}
              style={{ width: 200 }}
            />
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() =>
                addTrait(traits, setTraits, newTrait, () => setNewTrait(""))
              }
            >
              Add
            </Button>
          </div>

          <Divider />

          <Title level={5}>Physical Traits</Title>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 8,
            }}
          >
            {physicalTraits.map((trait, i) => (
              <Tag
                key={i}
                color="purple"
                closable
                onClose={() =>
                  removeTrait(physicalTraits, setPhysicalTraits, i)
                }
              >
                {trait}
              </Tag>
            ))}
            {physicalTraits.length === 0 && (
              <Text type="secondary">No physical traits yet.</Text>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Input
              size="small"
              placeholder="Add a physical trait..."
              value={newPhysicalTrait}
              onChange={(e) => setNewPhysicalTrait(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTrait(
                    physicalTraits,
                    setPhysicalTraits,
                    newPhysicalTrait,
                    () => setNewPhysicalTrait(""),
                  );
                }
              }}
              style={{ width: 200 }}
            />
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() =>
                addTrait(
                  physicalTraits,
                  setPhysicalTraits,
                  newPhysicalTrait,
                  () => setNewPhysicalTrait(""),
                )
              }
            >
              Add
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: "behavior",
      label: "Behavior",
      children: (
        <div style={{ padding: 24 }}>
          {[
            {
              label: "Behavior & Reactions",
              value: behaviorNotes,
              setter: setBehaviorNotes,
              placeholder:
                "How does this character react to stress, conflict, surprise?",
            },
            {
              label: "Speech Style",
              value: speechPatterns,
              setter: setSpeechPatterns,
              placeholder:
                "Formal, casual, uses slang, talks slowly, stutters...",
            },
            {
              label: "Fears",
              value: fears,
              setter: setFears,
              placeholder: "What scares this character?",
            },
            {
              label: "Motivations",
              value: motivations,
              setter: setMotivations,
              placeholder: "What drives this character forward?",
            },
            {
              label: "Story Arc Notes",
              value: arcNotes,
              setter: setArcNotes,
              placeholder: "How should this character develop over the story?",
            },
          ].map(({ label, value, setter, placeholder }) => (
            <div key={label} style={{ marginBottom: 24 }}>
              <Title level={5}>{label}</Title>
              <TextArea
                rows={2}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}

          {/* Voice Profile Section */}
          <div style={{ marginTop: 32, marginBottom: 16 }}>
            <Title level={4}>Voice Profile</Title>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 16 }}
            >
              These fields shape how the AI writes dialogue for this character.
            </Text>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Dialogue Style</Title>
            <TextArea
              rows={2}
              value={dialogueStyle}
              onChange={(e) => setDialogueStyle(e.target.value)}
              placeholder="e.g. Short clipped sentences, lots of questions, poetic and flowery, sarcastic undertone..."
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Vocabulary Level</Title>
            <Input
              value={vocabularyLevel}
              onChange={(e) => setVocabularyLevel(e.target.value)}
              placeholder="e.g. Academic, street slang, archaic/medieval, child-like, technical jargon..."
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <Title level={5}>Catchphrases</Title>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 8 }}
            >
              Signature phrases or expressions this character often uses.
            </Text>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 8,
              }}
            >
              {catchphrases.map((phrase, i) => (
                <Tag
                  key={i}
                  closable
                  onClose={() =>
                    setCatchphrases(catchphrases.filter((_, idx) => idx !== i))
                  }
                >
                  {phrase}
                </Tag>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                size="small"
                value={newCatchphrase}
                onChange={(e) => setNewCatchphrase(e.target.value)}
                placeholder='Add a catchphrase, e.g. "By the old gods..."'
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCatchphrase.trim()) {
                    setCatchphrases([...catchphrases, newCatchphrase.trim()]);
                    setNewCatchphrase("");
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button
                size="small"
                disabled={!newCatchphrase.trim()}
                onClick={() => {
                  setCatchphrases([...catchphrases, newCatchphrase.trim()]);
                  setNewCatchphrase("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "relationships",
      label: "Relationships",
      children: (
        <div style={{ padding: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Title level={5} style={{ margin: 0 }}>
              Relationships
            </Title>
            <Button
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setNewRelDialog(true)}
            >
              Add Relationship
            </Button>
          </div>

          {relationships && relationships.length > 0 ? (
            relationships.map((rel: any) => {
              // Find the other character's name
              const otherId =
                rel.character_1_id === character.id
                  ? rel.character_2_id
                  : rel.character_1_id;
              const other = allCharacters.find((c) => c.id === otherId);
              return (
                <Card key={rel.id} size="small" style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div style={{ flexGrow: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <Tag color="blue">
                          {rel.relationship_type || "unknown"}
                        </Tag>
                        <Text strong>{other?.name || "Unknown character"}</Text>
                      </div>
                      {rel.description && (
                        <Text type="secondary">{rel.description}</Text>
                      )}
                    </div>
                    <Tooltip title="Remove relationship">
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => setDeleteRelTarget(rel.id)}
                      />
                    </Tooltip>
                  </div>
                </Card>
              );
            })
          ) : (
            <Text type="secondary">No relationships recorded.</Text>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 16, marginBottom: 32 }}>
        {/* Alerts */}
        {success && (
          <Alert
            type="success"
            title={success}
            closable
            onClose={() => setSuccess(null)}
            style={{ marginBottom: 16 }}
          />
        )}
        {error && (
          <Alert
            type="error"
            title={error}
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Header card */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col flex="none">
              <div style={{ position: "relative", display: "inline-block" }}>
                <Avatar
                  src={character.avatar_url}
                  alt={character.name}
                  size={160}
                  style={{ minWidth: 100 }}
                >
                  {character.name[0]}
                </Avatar>
              </div>
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ marginTop: 0 }}>
                {character.name}
              </Title>
              <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                {(["main", "side", "bg"] as const).map((r) => (
                  <Tag
                    key={r}
                    color={role === r ? "blue" : undefined}
                    style={{ cursor: "pointer" }}
                    onClick={() => setRole(r)}
                  >
                    {r === "bg"
                      ? "Background"
                      : r.charAt(0).toUpperCase() + r.slice(1)}
                  </Tag>
                ))}
              </div>
              {character.description && (
                <Paragraph>{character.description}</Paragraph>
              )}

              {/* Portrait generation */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Button
                  size="small"
                  icon={
                    portraitLoading ? (
                      <LoadingOutlined spin />
                    ) : (
                      <HighlightOutlined />
                    )
                  }
                  onClick={handleGeneratePortrait}
                  disabled={portraitLoading}
                >
                  {portraitLoading
                    ? "Generating portrait…"
                    : character.avatar_url
                      ? "Regenerate Portrait"
                      : "Generate Portrait"}
                </Button>
                <Button
                  size="small"
                  type="text"
                  onClick={() => setShowCustomPrompt((v) => !v)}
                >
                  {showCustomPrompt ? "Hide custom prompt" : "Custom prompt"}
                </Button>
              </div>
              {showCustomPrompt && (
                <div style={{ marginTop: 8 }}>
                  <TextArea
                    rows={2}
                    placeholder="e.g. long silver hair, red eyes, school uniform, confident pose"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    style={{ maxWidth: 480 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Override the auto-generated prompt with your own SD
                      description
                    </Text>
                  </div>
                </div>
              )}
              {portraitError && (
                <Alert
                  type="error"
                  title={portraitError}
                  closable
                  onClose={() => setPortraitError(null)}
                  style={{ marginTop: 8 }}
                />
              )}
            </Col>
          </Row>
        </Card>

        {/* Tabs */}
        <Card styles={{ body: { padding: 0 } }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingRight: 16,
            }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key)}
              items={tabItems}
              style={{ flex: 1 }}
              tabBarExtraContent={
                <Button
                  type="primary"
                  size="small"
                  icon={saving ? <LoadingOutlined spin /> : <SaveOutlined />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save
                </Button>
              }
            />
          </div>
        </Card>
      </div>

      {/* Add Relationship Modal */}
      <Modal
        title="Add Relationship"
        open={newRelDialog}
        onCancel={() => setNewRelDialog(false)}
        onOk={handleAddRelationship}
        okText="Add"
        okButtonProps={{ disabled: !newRelCharId || !newRelType || saving }}
        width={400}
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Character</Text>
          <Select
            style={{ width: "100%", marginTop: 4 }}
            placeholder="Select a character..."
            value={newRelCharId || undefined}
            onChange={(value) => setNewRelCharId(value)}
            options={otherCharacters.map((c) => ({
              value: c.id,
              label: c.name,
            }))}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Text>Relationship type</Text>
          <Input
            style={{ marginTop: 4 }}
            placeholder="e.g. romantic, friendship, rivalry, family, mentor"
            value={newRelType}
            onChange={(e) => setNewRelType(e.target.value)}
          />
        </div>
        <div>
          <Text>Description (optional)</Text>
          <TextArea
            rows={2}
            style={{ marginTop: 4 }}
            placeholder="Describe the dynamic between them..."
            value={newRelDesc}
            onChange={(e) => setNewRelDesc(e.target.value)}
          />
        </div>
      </Modal>

      {/* Delete Relationship Modal */}
      <Modal
        title="Remove Relationship?"
        open={!!deleteRelTarget}
        onCancel={() => setDeleteRelTarget(null)}
        onOk={handleDeleteRelationship}
        okText="Remove"
        okButtonProps={{ danger: true, disabled: saving }}
        width={400}
      >
        <Text>This will permanently remove this relationship. Continue?</Text>
      </Modal>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Tabs,
  Card,
  Input,
  Button,
  Select,
  Row,
  Col,
  Slider,
  Alert,
  Spin,
  Image,
  Tag,
  Space,
  Divider,
  Modal,
  Tooltip,
  Empty,
  Badge,
  Segmented,
  App,
} from "antd";
import {
  PictureOutlined,
  ThunderboltOutlined,
  SaveOutlined,
  StarOutlined,
  StarFilled,
  DeleteOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  UserOutlined,
  EnvironmentOutlined,
  BookOutlined,
  SettingOutlined,
  ExpandOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";
import { useWorld } from "@/components/WorldProvider";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";
import type { GeneratedImage, CharacterDesign } from "@/lib/types";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

/* ──────────────────────────── preset sizes (SDXL) ───────────────────── */

const SIZE_PRESETS = [
  { label: "Portrait (832×1216)", width: 832, height: 1216 },
  { label: "Landscape (1216×832)", width: 1216, height: 832 },
  { label: "Square (1024×1024)", width: 1024, height: 1024 },
  { label: "Wide (1344×768)", width: 1344, height: 768 },
  { label: "Tall (768×1344)", width: 768, height: 1344 },
  { label: "Cinematic (1536×640)", width: 1536, height: 640 },
  { label: "9:7 (1152×896)", width: 1152, height: 896 },
  { label: "7:9 (896×1152)", width: 896, height: 1152 },
];

const CATEGORIES = [
  { value: "custom", label: "Custom" },
  { value: "scene", label: "Scene" },
  { value: "character_design", label: "Character Design" },
  { value: "environment", label: "Environment" },
  { value: "item", label: "Item / Object" },
];

/* ────────────────────── prompt templates ─────────────────────────── */

const PROMPT_TEMPLATES = [
  // ── Character Design ──
  {
    label: "Design Sheet",
    hint: "Full character reference sheet with multiple angles and expressions",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, character sheet, multiple views, front view, side view, back view, close-up face, expression chart, white background, full body, turnaround, clean linework, consistent design",
  },
  {
    label: "Expression Sheet",
    hint: "Facial expression studies for a character",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, expression chart, multiple expressions, happy, angry, surprised, sad, smirk, blush, close-up, head focus, white background, consistent art style",
  },
  // ── Outfit / Fashion ──
  {
    label: "Outfit Design",
    hint: "Detailed outfit breakdown with clothing layers, accessories, and styling notes",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, character sheet, outfit breakdown, clothing layers, full body, standing, fashion illustration, accessories, annotated, texture detail, soft colors, clean layout",
  },
  {
    label: "Casual Outfit",
    hint: "Everyday casual wear for a character",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, full body, standing, casual clothes, relaxed, comfortable, layered outfit, simple background, soft lighting",
  },
  {
    label: "Formal Outfit",
    hint: "Formal/elegant wear for a character",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, full body, standing, formal clothes, elegant, dress, sophisticated, simple background, studio lighting",
  },
  // ── Footwear ──
  {
    label: "Shoes (Front)",
    hint: "Detailed front/top-down view of footwear",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, shoes focus, pair of shoes, three-quarter view, on floor, detailed material, stitching detail, soft studio lighting, product photography, clean composition",
  },
  {
    label: "Shoes (Back)",
    hint: "Rear view of heels/shoes showing back details",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, shoes focus, from behind, heel detail, glossy material, low angle, sharp focus, studio lighting, product photography",
  },
  {
    label: "Character + Shoes",
    hint: "Character wearing or showcasing specific footwear",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, legs focus, feet, detailed footwear, shoes, lower body, standing, anime style, clean linework, stylish pose",
  },
  // ── Interior / Environment ──
  {
    label: "Interior",
    hint: "Detailed anime-style interior room with lived-in atmosphere",
    text: "masterpiece, best quality, very aesthetic, absurdres, newest, no humans, indoors, detailed room, warm lighting, sunlight, window, kitchen OR bedroom OR living room, cozy, household items, tile floor OR wooden floor, slice of life, background art",
  },
  {
    label: "Exterior",
    hint: "Outdoor environment or building exterior",
    text: "masterpiece, best quality, very aesthetic, absurdres, newest, no humans, outdoors, scenery, building, architectural detail, atmospheric lighting, sky, scenic composition, background art",
  },
  // ── Scene / Composition ──
  {
    label: "Landscape",
    hint: "Wide cinematic establishing shot",
    text: "masterpiece, best quality, very aesthetic, absurdres, newest, no humans, scenery, landscape, wide shot, atmospheric perspective, dramatic sky, nature, detailed environment, painterly",
  },
  {
    label: "Action Scene",
    hint: "Dynamic action composition",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, dynamic pose, action, motion blur, intense lighting, speed lines, dramatic angle, detailed",
  },
  // ── Item / Object ──
  {
    label: "Item",
    hint: "Focused item or object concept art",
    text: "masterpiece, best quality, very aesthetic, absurdres, newest, no humans, still life, object focus, concept art, simple background, multiple views, material detail, annotated",
  },
  {
    label: "Weapon",
    hint: "Weapon or tool design concept",
    text: "masterpiece, best quality, very aesthetic, absurdres, newest, no humans, weapon focus, concept art, multiple views, white background, material detail, sharp rendering, fantasy",
  },
  // ── Feet / Footwear detail ──
  {
    label: "Bare Feet",
    hint: "Detailed close-up of character's bare feet",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, barefoot, feet focus, close-up, toes, detailed skin, soft lighting, from above",
  },
  {
    label: "Feet (Soles)",
    hint: "View of bare feet soles, from below",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, barefoot, soles, feet up, from below, pov, toes, detailed, high contrast",
  },
  {
    label: "Dirty Soles",
    hint: "Worn shoe soles showing dirt and scuff marks",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, shoes, soles, from below, dirty, worn, scuff marks, grime, well-worn, low angle, detailed texture",
  },
  {
    label: "Worn Shoes",
    hint: "Used/scuffed shoes showing age and wear",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, shoes focus, worn, used, scuff marks, creases, aged material, detailed texture, studio lighting",
  },
  // ── Domination / Power-pose scenes ──
  // TIP: Use format: 1girl, name, 1boy, name, [click template]
  {
    label: "Standing On",
    hint: "One character's foot on another's face \u2014 use: 1girl, name, 1boy, name",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, 2others, standing over, foot on face, person lying on floor, dominant, looking down, shoe sole on cheek, full body, indoors, dramatic angle, detailed",
  },
  {
    label: "Foot on Face",
    hint: "Close-up of foot/shoe pressing on a face",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, foot on face, shoe sole pressing on cheek, close-up, pinned down, detailed expression, dominant, dramatic lighting",
  },
  {
    label: "Face as Footrest",
    hint: "Sitting on sofa, feet resting on someone's face",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, 2others, sitting, couch, legs crossed, feet on face, person on floor, footrest, relaxed, living room, indoors, detailed interior",
  },
  {
    label: "Kitchen Trampling",
    hint: "Standing on someone in the kitchen",
    text: "masterpiece, best quality, very aesthetic, absurdres, explicit, nsfw, newest, 2others, standing, kitchen, foot stepping on face, person lying on floor, tile floor, kitchen cabinets, warm lighting, looking down, full body, domestic, detailed",
  },
];

/* ═══════════════════════════════════════════════════════════════════════ */

export default function ImageStudioPage() {
  const { message } = App.useApp();
  const { worldId } = useWorld();
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);

  // ── ComfyUI status ──
  const [comfyAvailable, setComfyAvailable] = useState<boolean | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // ── Generation form ──
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState(0); // index into SIZE_PRESETS
  const [steps, setSteps] = useState(28);
  const [cfg, setCfg] = useState(6);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState("custom");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [genMeta, setGenMeta] = useState<any>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // ── Story context inclusion ──
  const [characters, setCharacters] = useState<any[]>([]);
  const [storyParts, setStoryParts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<string[]>(
    [],
  );
  const [selectedStoryPartId, setSelectedStoryPartId] = useState<
    string | undefined
  >(undefined);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  // ── Gallery ──
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState("all");

  // ── Character Designs ──
  const [designs, setDesigns] = useState<CharacterDesign[]>([]);
  const [designsLoading, setDesignsLoading] = useState(false);

  // ── Save modal ──
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveTags, setSaveTags] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Design modal ──
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [designCharacterId, setDesignCharacterId] = useState<string>("");
  const [designNotes, setDesignNotes] = useState("");
  const [designImageUrl, setDesignImageUrl] = useState("");
  const [settingDesign, setSettingDesign] = useState(false);

  // ── Reference images (auto-fetched for selected characters) ──
  const [characterRefs, setCharacterRefs] = useState<
    Array<{
      characterId: string;
      characterName: string;
      imageUrl: string;
      source: "design" | "gallery";
    }>
  >([]);
  const [denoise, setDenoise] = useState(0.65);
  const [refsLoading, setRefsLoading] = useState(false);

  // ── Active tab ──
  const [activeTab, setActiveTab] = useState("generate");

  /* ────────────────────── Fetch data on mount ────────────────────── */

  useEffect(() => {
    checkComfyUI();
    fetchEntities();
  }, []);

  useEffect(() => {
    if (activeTab === "gallery") fetchGallery();
    if (activeTab === "designs") fetchDesigns();
  }, [activeTab, worldId]);

  // Auto-fetch reference images whenever selected characters change
  useEffect(() => {
    if (selectedCharacterIds.length === 0) {
      setCharacterRefs([]);
      return;
    }
    fetchCharacterRefs(selectedCharacterIds);
  }, [selectedCharacterIds]);

  const fetchCharacterRefs = async (charIds: string[]) => {
    setRefsLoading(true);
    try {
      const res = await fetch(
        `/api/image-studio/generate?action=references&characterIds=${charIds.join(",")}`,
      );
      const data = await res.json();
      setCharacterRefs(data.references || []);
    } catch {
      setCharacterRefs([]);
    } finally {
      setRefsLoading(false);
    }
  };

  const checkComfyUI = async () => {
    try {
      const res = await fetch("/api/image-studio/generate?action=status");
      const data = await res.json();
      setComfyAvailable(data.available);

      if (data.available) {
        const modelsRes = await fetch(
          "/api/image-studio/generate?action=models",
        );
        const modelsData = await modelsRes.json();
        setAvailableModels(modelsData.models || []);
      }
    } catch {
      setComfyAvailable(false);
    }
  };

  const fetchEntities = async () => {
    try {
      const [charRes, partsRes, locRes] = await Promise.all([
        fetch("/api/characters"),
        fetch("/api/story-parts"),
        fetch("/api/locations"),
      ]);
      if (charRes.ok) {
        const d = await charRes.json();
        setCharacters(Array.isArray(d) ? d : d.characters || []);
      }
      if (partsRes.ok) {
        const d = await partsRes.json();
        setStoryParts(Array.isArray(d) ? d : d.storyParts || d.parts || []);
      }
      if (locRes.ok) {
        const d = await locRes.json();
        setLocations(Array.isArray(d) ? d : d.locations || []);
      }
    } catch (e) {
      console.error("Failed to fetch entities:", e);
    }
  };

  const fetchGallery = async () => {
    setGalleryLoading(true);
    try {
      const params = new URLSearchParams();
      if (worldId) params.set("worldId", worldId);
      if (galleryFilter !== "all") params.set("category", galleryFilter);

      const res = await fetch(`/api/image-studio/gallery?${params}`);
      const data = await res.json();
      setGallery(data.images || []);
    } catch (e) {
      console.error("Failed to fetch gallery:", e);
    } finally {
      setGalleryLoading(false);
    }
  };

  const fetchDesigns = async () => {
    setDesignsLoading(true);
    try {
      const res = await fetch("/api/image-studio/designs");
      const data = await res.json();
      setDesigns(data.designs || []);
    } catch (e) {
      console.error("Failed to fetch designs:", e);
    } finally {
      setDesignsLoading(false);
    }
  };

  /* ────────────────────── Generation ────────────────────── */

  /**
   * Auto-build a Danbooru-style prompt from selected characters, story part,
   * and locations. The user's manual prompt (if any) is appended at the end.
   */
  const buildAutoPrompt = useCallback((): string => {
    const tags: string[] = [
      "masterpiece",
      "best quality",
      "very aesthetic",
      "absurdres",
      "newest",
    ];

    const selChars = characters.filter((c) =>
      selectedCharacterIds.includes(c.id),
    );

    // Character count tag
    if (selChars.length === 1) {
      tags.push("1girl"); // default — user can override via manual prompt
    } else if (selChars.length === 2) {
      tags.push("2others");
    } else if (selChars.length >= 3) {
      tags.push("multiple others");
    }

    // Character descriptions → tags
    for (const c of selChars) {
      if (c.name) tags.push(c.name);
      if (c.physical_traits) {
        const traits =
          typeof c.physical_traits === "string"
            ? c.physical_traits
            : Object.values(c.physical_traits).flat().join(", ");
        tags.push(traits);
      }
      if (c.description) {
        // Take short description keywords, not whole sentences
        tags.push(c.description);
      }
    }

    // Story part → scene context
    if (selectedStoryPartId) {
      const part = storyParts.find((p) => p.id === selectedStoryPartId);
      if (part) {
        if (part.summary) tags.push(part.summary);
        else if (part.title) tags.push(part.title);
      }
    }

    // Locations
    const selLocs = locations.filter((l) => selectedLocationIds.includes(l.id));
    for (const l of selLocs) {
      if (l.description) tags.push(l.description);
      else if (l.name) tags.push(l.name);
    }

    // Append manual prompt if present
    if (prompt.trim()) {
      tags.push(prompt.trim());
    }

    return tags.join(", ");
  }, [
    characters,
    storyParts,
    locations,
    selectedCharacterIds,
    selectedStoryPartId,
    selectedLocationIds,
    prompt,
  ]);

  const handleGenerate = async () => {
    // Must have at least characters selected OR a manual prompt
    const hasSelections =
      selectedCharacterIds.length > 0 || selectedStoryPartId;
    if (!hasSelections && !prompt.trim()) {
      message.warning("Select characters/story part or write a prompt");
      return;
    }

    setGenerating(true);
    setGeneratedImage(null);
    setGenMeta(null);

    try {
      const finalPrompt = buildAutoPrompt();
      const size = SIZE_PRESETS[selectedSize];
      const hasRefs = characterRefs.length > 0;
      const res = await fetch("/api/image-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          negativePrompt: negativePrompt.trim() || undefined,
          width: size.width,
          height: size.height,
          steps,
          cfg,
          seed: seed || undefined,
          model: selectedModel || undefined,
          characterIds: selectedCharacterIds,
          useReference: hasRefs,
          denoise: hasRefs ? denoise : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const data = await res.json();
      setGeneratedImage(data.image);
      setGenMeta({ ...data, prompt: finalPrompt });
      message.success("Image generated!");
    } catch (e: any) {
      message.error(e.message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  /* ────────────────────── Save image ────────────────────── */

  const handleSaveImage = async () => {
    if (!generatedImage) return;
    setSaving(true);

    try {
      const res = await fetch("/api/image-studio/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: generatedImage,
          prompt: genMeta?.prompt || prompt.trim(),
          negativePrompt: negativePrompt.trim() || undefined,
          title: saveTitle.trim() || undefined,
          category,
          characterIds: selectedCharacterIds,
          storyPartIds: selectedStoryPartId ? [selectedStoryPartId] : [],
          locationIds: selectedLocationIds,
          modelUsed: genMeta?.model,
          seed: genMeta?.seed,
          steps: genMeta?.steps,
          cfgScale: genMeta?.cfg,
          width: genMeta?.width,
          height: genMeta?.height,
          tags: saveTags
            ? saveTags.split(",").map((t: string) => t.trim())
            : [],
          notes: saveNotes.trim() || undefined,
          worldId: worldId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Save failed (${res.status})`);
      }
      message.success("Image saved to gallery!");
      setSaveModalOpen(false);
      setSaveTitle("");
      setSaveTags("");
      setSaveNotes("");
    } catch (e: any) {
      console.error("Save error:", e);
      message.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  /* ────────────────── Set official design ────────────────── */

  const openDesignModal = (imageUrl: string) => {
    setDesignImageUrl(imageUrl);
    setDesignCharacterId("");
    setDesignNotes("");
    setDesignModalOpen(true);
  };

  const handleSetDesign = async () => {
    if (!designCharacterId || !designImageUrl) return;
    setSettingDesign(true);

    try {
      const res = await fetch("/api/image-studio/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterId: designCharacterId,
          imageUrl: designImageUrl,
          designNotes: designNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.error || `Failed to set design (${res.status})`,
        );
      }
      message.success("Official character design set!");
      setDesignModalOpen(false);
      fetchDesigns();
    } catch (e: any) {
      console.error("Design error:", e);
      message.error(e.message || "Failed to set design");
    } finally {
      setSettingDesign(false);
    }
  };

  /* ────────────────── Delete gallery image ────────────────── */

  const handleDeleteGalleryImage = async (id: string) => {
    try {
      await fetch(`/api/image-studio/gallery?id=${id}`, { method: "DELETE" });
      setGallery((prev) => prev.filter((img) => img.id !== id));
      message.success("Image deleted");
    } catch {
      message.error("Failed to delete");
    }
  };

  /* ────────────────── Delete design ────────────────── */

  const handleDeleteDesign = async (id: string) => {
    try {
      await fetch(`/api/image-studio/designs?id=${id}`, { method: "DELETE" });
      setDesigns((prev) => prev.filter((d) => d.id !== id));
      message.success("Design removed");
    } catch {
      message.error("Failed to delete design");
    }
  };

  /* ═══════════════════════════ Glass card style ═══════════════════════ */

  const glassCard: React.CSSProperties = {
    background: isDark ? "rgba(25,25,42,0.65)" : "rgba(255,255,255,0.72)",
    border: `1px solid ${sc.border}`,
    borderRadius: 12,
    backdropFilter: "blur(12px)",
  };

  /* ═══════════════════════════ RENDER ═══════════════════════════════ */

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0 }}>
            <PictureOutlined style={{ marginRight: 10 }} />
            Image Studio
          </Title>
          <Text type="secondary">
            Generate images for your story — characters, scenes, environments,
            items, or anything you imagine
          </Text>
        </div>
        <Space>
          {comfyAvailable === null ? (
            <Spin size="small" />
          ) : comfyAvailable ? (
            <Tag color="green">ComfyUI Connected</Tag>
          ) : (
            <Tag color="red">ComfyUI Offline</Tag>
          )}
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={checkComfyUI}
          />
        </Space>
      </div>

      {comfyAvailable === false && (
        <Alert
          message="ComfyUI is not running"
          description="Start ComfyUI to enable image generation: python main.py --listen 0.0.0.0"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "generate",
            label: (
              <span>
                <ThunderboltOutlined /> Generate
              </span>
            ),
            children: renderGenerateTab(),
          },
          {
            key: "gallery",
            label: (
              <span>
                <AppstoreOutlined /> Gallery{" "}
                {gallery.length > 0 && (
                  <Badge count={gallery.length} size="small" />
                )}
              </span>
            ),
            children: renderGalleryTab(),
          },
          {
            key: "designs",
            label: (
              <span>
                <StarOutlined /> Character Designs{" "}
                {designs.length > 0 && (
                  <Badge count={designs.length} size="small" />
                )}
              </span>
            ),
            children: renderDesignsTab(),
          },
        ]}
      />

      {/* ── Save Modal ── */}
      <Modal
        title="Save Image to Gallery"
        open={saveModalOpen}
        onCancel={() => setSaveModalOpen(false)}
        onOk={handleSaveImage}
        confirmLoading={saving}
        okText="Save"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Title (optional)</Text>
            <Input
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Give this image a name..."
            />
          </div>
          <div>
            <Text strong>Category</Text>
            <Select
              value={category}
              onChange={setCategory}
              options={CATEGORIES}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <Text strong>Tags (comma-separated)</Text>
            <Input
              value={saveTags}
              onChange={(e) => setSaveTags(e.target.value)}
              placeholder="e.g. action, night scene, dramatic"
            />
          </div>
          <div>
            <Text strong>Notes</Text>
            <TextArea
              value={saveNotes}
              onChange={(e) => setSaveNotes(e.target.value)}
              rows={2}
              placeholder="Any notes about this image..."
            />
          </div>
          {selectedCharacterIds.length > 0 && (
            <Text type="secondary">
              Linked to {selectedCharacterIds.length} character(s)
            </Text>
          )}
        </Space>
      </Modal>

      {/* ── Set Official Design Modal ── */}
      <Modal
        title="Set as Official Character Design"
        open={designModalOpen}
        onCancel={() => setDesignModalOpen(false)}
        onOk={handleSetDesign}
        confirmLoading={settingDesign}
        okText="Set Official Design"
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <Text strong>Choose Character</Text>
            <Select
              value={designCharacterId}
              onChange={setDesignCharacterId}
              placeholder="Select a character..."
              style={{ width: "100%" }}
              showSearch
              optionFilterProp="label"
              options={characters.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.role || "unknown"})`,
              }))}
            />
          </div>
          <div>
            <Text strong>Design Notes (optional)</Text>
            <Input
              value={designNotes}
              onChange={(e) => setDesignNotes(e.target.value)}
              placeholder="e.g. default look, battle outfit, casual..."
            />
          </div>
          <Alert
            type="info"
            message="This will become the character's official design. Their avatar will be updated to this image. Only clothes and hairstyle changes should be treated as variations."
            showIcon
          />
          {designImageUrl && (
            <div style={{ textAlign: "center" }}>
              <Image
                src={designImageUrl}
                alt="Design preview"
                style={{ maxHeight: 200, borderRadius: 8 }}
              />
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );

  /* ═══════════════════════ GENERATE TAB ═══════════════════════════════ */

  function renderGenerateTab() {
    const hasRefs = characterRefs.length > 0;
    const canGenerate =
      comfyAvailable &&
      (selectedCharacterIds.length > 0 || selectedStoryPartId || prompt.trim());

    return (
      <Row gutter={[20, 20]}>
        {/* Left: Story selections */}
        <Col xs={24} lg={12}>
          <Card style={glassCard} styles={{ body: { padding: 20 } }}>
            {/* ── 1. Characters ── */}
            <Title level={5} style={{ marginTop: 0 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              Characters
            </Title>
            <Select
              mode="multiple"
              value={selectedCharacterIds}
              onChange={setSelectedCharacterIds}
              placeholder="Select characters involved..."
              style={{ width: "100%", marginBottom: 8 }}
              optionFilterProp="label"
              options={characters.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.role || "?"})`,
              }))}
            />

            {/* Reference thumbnails (auto) */}
            {selectedCharacterIds.length > 0 && (
              <div
                style={{
                  marginBottom: 12,
                  padding: 8,
                  background: sc.subtleBg,
                  borderRadius: 8,
                  border: `1px solid ${sc.border}`,
                }}
              >
                {refsLoading ? (
                  <Spin size="small" />
                ) : hasRefs ? (
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {characterRefs.map((ref) => (
                      <Tooltip
                        key={ref.characterId}
                        title={`${ref.characterName} — ${ref.source === "design" ? "Official Design" : "Gallery Image"} (will be used as reference)`}
                      >
                        <div
                          style={{
                            position: "relative",
                            border: `2px solid ${token.colorPrimary}`,
                            borderRadius: 6,
                            overflow: "hidden",
                          }}
                        >
                          <img
                            src={ref.imageUrl}
                            alt={ref.characterName}
                            style={{
                              width: 56,
                              height: 70,
                              objectFit: "cover",
                              display: "block",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 0,
                              right: 0,
                              background: "rgba(0,0,0,0.7)",
                              fontSize: 9,
                              color: "#fff",
                              textAlign: "center",
                              padding: "1px 2px",
                            }}
                          >
                            {ref.characterName}
                          </div>
                        </div>
                      </Tooltip>
                    ))}
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Designs will keep characters consistent
                    </Text>
                  </div>
                ) : (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    No designs found — image will be generated from description
                    only. Save a generated image as an official design to enable
                    consistency.
                  </Text>
                )}
              </div>
            )}

            {/* ── 2. Story Part ── */}
            <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
              <BookOutlined style={{ marginRight: 8 }} />
              Story Part
            </Title>
            <Select
              value={selectedStoryPartId}
              onChange={setSelectedStoryPartId}
              allowClear
              placeholder="Select a story part for scene context..."
              style={{ width: "100%", marginBottom: 12 }}
              optionFilterProp="label"
              options={storyParts.map((p) => ({
                value: p.id,
                label: `Part ${p.part_number}${p.title ? ": " + p.title : ""}`,
              }))}
            />

            {/* Story part summary preview */}
            {selectedStoryPartId &&
              (() => {
                const part = storyParts.find(
                  (p) => p.id === selectedStoryPartId,
                );
                return part?.summary ? (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "8px 12px",
                      background: sc.subtleBg,
                      borderRadius: 8,
                      fontSize: 12,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      <BookOutlined /> {part.summary}
                    </Text>
                  </div>
                ) : null;
              })()}

            {/* ── 3. Location (optional) ── */}
            <Title level={5} style={{ marginTop: 8, marginBottom: 8 }}>
              <EnvironmentOutlined style={{ marginRight: 8 }} />
              Location{" "}
              <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                (optional)
              </Text>
            </Title>
            <Select
              mode="multiple"
              value={selectedLocationIds}
              onChange={setSelectedLocationIds}
              placeholder="Select location..."
              style={{ width: "100%", marginBottom: 16 }}
              optionFilterProp="label"
              options={locations.map((l) => ({
                value: l.id,
                label: l.name,
              }))}
            />

            {/* ── 4. Extra prompt (optional) ── */}
            <TextArea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={2}
              placeholder="Extra details / style tags (optional) — e.g. kitchen, dramatic lighting, action pose..."
              style={{ marginBottom: 12 }}
            />

            {/* ── Quick templates ── */}
            <div
              style={{
                display: "flex",
                gap: 4,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {PROMPT_TEMPLATES.map((tpl) => (
                <Tooltip title={tpl.hint} key={tpl.label}>
                  <Button
                    size="small"
                    type="dashed"
                    onClick={() =>
                      setPrompt((p) => (p ? `${p}, ${tpl.text}` : tpl.text))
                    }
                    style={{ fontSize: 11 }}
                  >
                    {tpl.label}
                  </Button>
                </Tooltip>
              ))}
            </div>

            {/* ── GENERATE BUTTON ── */}
            <Button
              type="primary"
              size="large"
              block
              icon={<ThunderboltOutlined />}
              onClick={handleGenerate}
              loading={generating}
              disabled={!canGenerate}
            >
              {generating ? "Generating..." : "Generate Image"}
            </Button>

            {/* ── Advanced (collapsed) ── */}
            <Divider style={{ margin: "16px 0 8px" }}>
              <Button
                type="text"
                size="small"
                icon={<SettingOutlined />}
                onClick={() => setShowAdvanced(!showAdvanced)}
                style={{ fontSize: 12, color: sc.textSecondary }}
              >
                {showAdvanced ? "Hide" : "Show"} Advanced Settings
              </Button>
            </Divider>

            {showAdvanced && (
              <div style={{ marginTop: 8 }}>
                {/* Negative prompt */}
                <Text
                  type="secondary"
                  style={{ fontSize: 12, display: "block", marginBottom: 4 }}
                >
                  Negative Prompt
                </Text>
                <TextArea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                  placeholder="Defaults to Animagine quality negatives if empty"
                  style={{ marginBottom: 12 }}
                />

                {/* Reference denoise */}
                {hasRefs && (
                  <div style={{ marginBottom: 12 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Design Influence: {denoise.toFixed(2)}{" "}
                      <Tooltip title="Lower = closer to character design. Higher = more creative freedom. 0.65 is balanced.">
                        <InfoCircleOutlined />
                      </Tooltip>
                    </Text>
                    <Slider
                      min={0.2}
                      max={1.0}
                      step={0.05}
                      value={denoise}
                      onChange={setDenoise}
                    />
                  </div>
                )}

                {/* Model */}
                {availableModels.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Model
                    </Text>
                    <Select
                      value={selectedModel}
                      onChange={setSelectedModel}
                      style={{ width: "100%" }}
                      options={[
                        { value: "", label: "Default" },
                        ...availableModels.map((m) => ({
                          value: m,
                          label: m,
                        })),
                      ]}
                    />
                  </div>
                )}

                {/* Size */}
                <div style={{ marginBottom: 12 }}>
                  <Text
                    type="secondary"
                    style={{ fontSize: 12, display: "block", marginBottom: 4 }}
                  >
                    Size
                  </Text>
                  <Select
                    value={selectedSize}
                    onChange={(v) => setSelectedSize(v as number)}
                    options={SIZE_PRESETS.map((p, i) => ({
                      label: p.label,
                      value: i,
                    }))}
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Steps + CFG */}
                <Row gutter={16}>
                  <Col span={12}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Steps: {steps}
                    </Text>
                    <Slider
                      min={10}
                      max={80}
                      value={steps}
                      onChange={setSteps}
                    />
                  </Col>
                  <Col span={12}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      CFG: {cfg}
                    </Text>
                    <Slider
                      min={1}
                      max={20}
                      step={0.5}
                      value={cfg}
                      onChange={setCfg}
                    />
                  </Col>
                </Row>

                {/* Seed + Category */}
                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col span={12}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Seed
                    </Text>
                    <Input
                      type="number"
                      value={seed ?? ""}
                      onChange={(e) =>
                        setSeed(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      placeholder="Random"
                      style={{ width: "100%" }}
                    />
                  </Col>
                  <Col span={12}>
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                        display: "block",
                        marginBottom: 4,
                      }}
                    >
                      Category
                    </Text>
                    <Select
                      value={category}
                      onChange={setCategory}
                      options={CATEGORIES}
                      style={{ width: "100%" }}
                    />
                  </Col>
                </Row>
              </div>
            )}
          </Card>
        </Col>

        {/* Right: Preview */}
        <Col xs={24} lg={12}>
          <Card
            style={{ ...glassCard, minHeight: 500 }}
            styles={{ body: { padding: 20, textAlign: "center" } }}
          >
            <Title level={5} style={{ marginTop: 0, textAlign: "left" }}>
              Preview
            </Title>

            {generating ? (
              <div
                style={{
                  padding: "100px 0",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                />
                <Text type="secondary">
                  Generating image... this may take 30-90 seconds
                </Text>
              </div>
            ) : generatedImage ? (
              <div>
                <Image
                  src={generatedImage}
                  alt="Generated image"
                  style={{
                    maxWidth: "100%",
                    borderRadius: 8,
                    marginBottom: 16,
                  }}
                />

                {genMeta && (
                  <div
                    style={{
                      textAlign: "left",
                      marginBottom: 16,
                      padding: "8px 12px",
                      background: sc.subtleBg,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <Text type="secondary">
                      Seed: {genMeta.seed} | Model: {genMeta.model} |{" "}
                      {genMeta.width}×{genMeta.height} | Steps: {genMeta.steps}{" "}
                      | CFG: {genMeta.cfg}
                      {genMeta.referenceUsed && (
                        <> | Ref: {genMeta.referenceUsed}</>
                      )}
                    </Text>
                  </div>
                )}

                <Space wrap>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => setSaveModalOpen(true)}
                  >
                    Save to Gallery
                  </Button>
                  <Button
                    icon={<StarOutlined />}
                    onClick={() => openDesignModal(generatedImage)}
                  >
                    Set as Character Design
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleGenerate}
                    disabled={generating}
                  >
                    Regenerate
                  </Button>
                  <Tooltip title="Copy seed for reproducibility">
                    <Button
                      icon={<CopyOutlined />}
                      onClick={() => {
                        if (genMeta?.seed) {
                          navigator.clipboard.writeText(String(genMeta.seed));
                          message.success("Seed copied!");
                        }
                      }}
                    />
                  </Tooltip>
                </Space>
              </div>
            ) : (
              <div style={{ padding: "120px 0" }}>
                <PictureOutlined
                  style={{ fontSize: 64, color: sc.textSecondary }}
                />
                <br />
                <Text type="secondary" style={{ marginTop: 12 }}>
                  Your generated image will appear here
                </Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    );
  }

  /* ═══════════════════════ GALLERY TAB ═══════════════════════════════ */

  function renderGalleryTab() {
    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Segmented
            value={galleryFilter}
            onChange={(v) => {
              setGalleryFilter(v as string);
              setTimeout(fetchGallery, 0);
            }}
            options={[
              { label: "All", value: "all" },
              ...CATEGORIES.map((c) => ({
                label: c.label,
                value: c.value,
              })),
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchGallery}>
            Refresh
          </Button>
        </div>

        {galleryLoading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : gallery.length === 0 ? (
          <Empty description="No saved images yet. Generate and save some!" />
        ) : (
          <Row gutter={[16, 16]}>
            {gallery.map((img) => (
              <Col key={img.id} xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={glassCard}
                  styles={{ body: { padding: 0 } }}
                  cover={
                    <Image
                      src={img.image_url}
                      alt={img.title || "Generated image"}
                      style={{
                        width: "100%",
                        borderRadius: "12px 12px 0 0",
                        objectFit: "cover",
                        maxHeight: 300,
                      }}
                    />
                  }
                  actions={[
                    <Tooltip title="Set as character design" key="design">
                      <StarOutlined
                        onClick={() => openDesignModal(img.image_url)}
                      />
                    </Tooltip>,
                    <Tooltip title="Delete" key="delete">
                      <DeleteOutlined
                        onClick={() =>
                          Modal.confirm({
                            title: "Delete this image?",
                            onOk: () => handleDeleteGalleryImage(img.id!),
                          })
                        }
                      />
                    </Tooltip>,
                  ]}
                >
                  <div style={{ padding: "12px 16px" }}>
                    {img.title && (
                      <Text strong style={{ display: "block" }}>
                        {img.title}
                      </Text>
                    )}
                    <Text
                      type="secondary"
                      style={{
                        fontSize: 11,
                        display: "block",
                        marginTop: 4,
                      }}
                      ellipsis
                    >
                      {img.prompt}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Tag>{img.category || "custom"}</Tag>
                      {(img.tags || []).map((t) => (
                        <Tag key={t} color="blue">
                          {t}
                        </Tag>
                      ))}
                    </div>
                    {img.character_ids && img.character_ids.length > 0 && (
                      <Text
                        type="secondary"
                        style={{ fontSize: 11, display: "block", marginTop: 4 }}
                      >
                        <UserOutlined /> {img.character_ids.length} character(s)
                        linked
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    );
  }

  /* ═══════════════════ CHARACTER DESIGNS TAB ═══════════════════════ */

  function renderDesignsTab() {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Official character designs. Once set, a design becomes the
            character&apos;s canonical look — only outfits and hairstyles should
            vary.
          </Text>
        </div>

        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDesigns}
          style={{ marginBottom: 16 }}
        >
          Refresh
        </Button>

        {designsLoading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : designs.length === 0 ? (
          <Empty description="No official character designs yet. Generate images and mark them as official designs." />
        ) : (
          <Row gutter={[16, 16]}>
            {designs.map((d) => {
              const charName =
                (d as any).characters?.name || "Unknown Character";
              const charRole = (d as any).characters?.role || "";
              return (
                <Col key={d.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    style={glassCard}
                    styles={{ body: { padding: 0 } }}
                    cover={
                      <div style={{ position: "relative" }}>
                        <Image
                          src={d.image_url}
                          alt={`${charName} design`}
                          style={{
                            width: "100%",
                            borderRadius: "12px 12px 0 0",
                            objectFit: "cover",
                            maxHeight: 300,
                          }}
                        />
                        {d.is_active && (
                          <Tag
                            color="gold"
                            style={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                            }}
                          >
                            <StarFilled /> Active
                          </Tag>
                        )}
                      </div>
                    }
                    actions={[
                      <Tooltip title="Delete design" key="delete">
                        <DeleteOutlined
                          onClick={() =>
                            Modal.confirm({
                              title: "Remove this design?",
                              content:
                                "The character's avatar will not be changed.",
                              onOk: () => handleDeleteDesign(d.id!),
                            })
                          }
                        />
                      </Tooltip>,
                    ]}
                  >
                    <div style={{ padding: "12px 16px" }}>
                      <Text strong style={{ display: "block" }}>
                        {charName}
                      </Text>
                      {charRole && (
                        <Tag style={{ marginTop: 4 }}>{charRole}</Tag>
                      )}
                      {d.design_notes && (
                        <Text
                          type="secondary"
                          style={{
                            fontSize: 12,
                            display: "block",
                            marginTop: 4,
                          }}
                        >
                          {d.design_notes}
                        </Text>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>
    );
  }
}

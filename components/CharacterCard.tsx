"use client";

import { Card, Typography, Tag, Avatar, Button, Tooltip, Spin } from "antd";
import {
  ToolOutlined,
  HighlightOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Text, Title } = Typography;

interface CharacterCardProps {
  character: {
    id: string;
    name: string;
    role: string;
    description?: string;
    avatar_url?: string;
    personality?: any;
  };
  onClick?: () => void;
  onRefine?: (character: any) => void;
}

export default function CharacterCard({
  character,
  onClick,
  onRefine,
}: CharacterCardProps) {
  const [portraitLoading, setPortraitLoading] = useState(false);
  const [portrait, setPortrait] = useState<string | null>(
    character.avatar_url?.startsWith("data:") ? character.avatar_url : null,
  );

  const handleGeneratePortrait = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPortraitLoading(true);
    try {
      const res = await fetch("/api/generate-portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id }),
      });
      const data = await res.json();
      if (data.portrait) {
        setPortrait(data.portrait);
        character.avatar_url = data.portrait;
      }
    } catch {
      // silent — user can retry
    } finally {
      setPortraitLoading(false);
    }
  };

  const getRoleColor = (role: string): string => {
    switch (role) {
      case "main":
        return "blue";
      case "side":
        return "purple";
      default:
        return "default";
    }
  };

  return (
    <Card
      hoverable={!!onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        position: "relative",
      }}
    >
      {/* AI Refine button — top-right corner, stops card click propagation */}
      {onRefine && (
        <Tooltip title="Build character with AI">
          <Button
            type="text"
            size="small"
            icon={<ToolOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onRefine(character);
            }}
            style={{ position: "absolute", top: 8, right: 8 }}
          />
        </Tooltip>
      )}

      {/* Generate portrait button */}
      <Tooltip
        title={
          portraitLoading ? "Generating portrait…" : "Generate AI portrait"
        }
      >
        <span
          style={{ position: "absolute", top: 8, right: onRefine ? 40 : 8 }}
        >
          <Button
            type="text"
            size="small"
            icon={
              portraitLoading ? (
                <Spin
                  indicator={<LoadingOutlined style={{ fontSize: 16 }} />}
                />
              ) : (
                <HighlightOutlined />
              )
            }
            onClick={handleGeneratePortrait}
            disabled={portraitLoading}
          />
        </span>
      </Tooltip>

      <div onClick={onClick}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 16,
            paddingRight: onRefine ? 24 : 0,
          }}
        >
          <Avatar
            src={portrait || character.avatar_url}
            alt={character.name}
            size={56}
            style={{ marginRight: 16 }}
          >
            {character.name[0]}
          </Avatar>
          <div>
            <Title level={5} style={{ margin: 0 }}>
              {character.name}
            </Title>
            <Tag color={getRoleColor(character.role)}>{character.role}</Tag>
          </div>
        </div>
        {character.description && (
          <Text type="secondary" style={{ marginBottom: 8, display: "block" }}>
            {character.description.slice(0, 100)}
            {character.description.length > 100 ? "..." : ""}
          </Text>
        )}
      </div>
    </Card>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Card, Typography } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import { theme as antdTheme } from "antd";

const { Title, Text } = Typography;

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export default function FileUpload({
  onFileSelect,
  accept = ".docx,.md,.markdown,.txt,.gdoc",
  maxSize = 52428800, // 50MB
}: FileUploadProps) {
  const { token } = antdTheme.useToken();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        validateAndSelectFile(file);
      }
    },
    [maxSize, accept, onFileSelect],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const validateAndSelectFile = (file: File) => {
    if (file.size > maxSize) {
      alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Check if file matches accepted extensions
    const acceptedExtensions = accept.split(",");
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidExtension = acceptedExtensions.some(
      (ext) => ext.trim().toLowerCase() === fileExtension,
    );

    if (accept && !isValidExtension) {
      alert(`Only ${accept} files are supported`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  return (
    <Card
      style={{
        border: dragActive
          ? `2px dashed ${token.colorPrimary}`
          : `2px dashed ${token.colorBorder}`,
        borderRadius: 8,
        padding: 32,
        textAlign: "center",
        background: dragActive ? "rgba(22, 119, 255, 0.04)" : undefined,
        cursor: "pointer",
      }}
      styles={{ body: { padding: 0 } }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="file-upload"
        accept={accept}
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <label htmlFor="file-upload" style={{ cursor: "pointer" }}>
        <CloudUploadOutlined
          style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }}
        />
        <Title level={5} style={{ marginBottom: 8 }}>
          {selectedFile
            ? selectedFile.name
            : "Drop your file here or click to browse"}
        </Title>
        <Text type="secondary">
          Supported format: {accept} (Max size: {maxSize / 1024 / 1024}MB)
        </Text>
      </label>
    </Card>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Box, Button, Typography, LinearProgress, Paper } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
}

export default function FileUpload({
  onFileSelect,
  accept = ".docx,.md,.markdown",
  maxSize = 52428800, // 50MB
}: FileUploadProps) {
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
        if (file.size > maxSize) {
          alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
          return;
        }

        if (accept && !file.name.endsWith(accept.replace("*", ""))) {
          alert(`Only ${accept} files are supported`);
          return;
        }

        setSelectedFile(file);
        onFileSelect(file);
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

    if (accept && !file.name.endsWith(accept.replace("*", ""))) {
      alert(`Only ${accept} files are supported`);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  return (
    <Paper
      sx={{
        border: dragActive ? "2px dashed #1976d2" : "2px dashed #ccc",
        borderRadius: 2,
        p: 4,
        textAlign: "center",
        bgcolor: dragActive ? "action.hover" : "background.paper",
        cursor: "pointer",
      }}
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
        <CloudUploadIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {selectedFile
            ? selectedFile.name
            : "Drop your file here or click to browse"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported format: {accept} (Max size: {maxSize / 1024 / 1024}MB)
        </Typography>
      </label>
    </Paper>
  );
}

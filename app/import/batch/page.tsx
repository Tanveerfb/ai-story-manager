"use client";

import { useState } from "react";
import {
  Typography,
  Button,
  Alert,
  Card,
  Checkbox,
  Tag,
  InputNumber,
  Progress,
  Spin,
} from "antd";
import {
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";

const { Title, Text } = Typography;

interface FileWithStatus {
  file: File;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
  extracted?: {
    characters: number;
    locations: number;
    events: number;
    relationships: number;
    themes: number;
  };
}

export default function BatchImportPage() {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [startingPartNumber, setStartingPartNumber] = useState(1);
  const [skipExtraction, setSkipExtraction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setError(null);
  };

  const handleBatchImport = async () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setLoading(true);
    setError(null);
    setProgress({ current: 0, total: files.length });

    try {
      const formData = new FormData();
      files.forEach((fileWithStatus, index) => {
        formData.append(`file_${index}`, fileWithStatus.file);
      });
      formData.append("startingPartNumber", startingPartNumber.toString());
      formData.append("skipExtraction", skipExtraction.toString());

      const response = await fetch("/api/import-story/batch", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Batch import failed");
      }

      const result = await response.json();

      // Update file statuses based on results
      setFiles((prev) =>
        prev.map((fileWithStatus, index) => {
          const fileResult = result.results[index];
          return {
            ...fileWithStatus,
            status: fileResult.success ? "completed" : "error",
            error: fileResult.error,
            extracted: fileResult.extracted,
          };
        }),
      );

      setProgress({ current: result.totalFiles, total: result.totalFiles });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { token } = antdTheme.useToken();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <ClockCircleOutlined />;
      case "processing":
        return <ClockCircleOutlined style={{ color: token.colorPrimary }} />;
      case "completed":
        return <CheckCircleOutlined style={{ color: token.colorSuccess }} />;
      case "error":
        return <CloseCircleOutlined style={{ color: token.colorError }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const completedCount = files.filter((f) => f.status === "completed").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const estimatedTime = skipExtraction ? files.length * 2 : files.length * 30;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 32, marginBottom: 32 }}>
        <Title level={2}>Batch Import Stories</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Upload multiple files (.docx, .md, .markdown, .txt) to import them
          sequentially. Each file will be assigned a part number automatically.
        </Text>

        <div style={{ marginTop: 32 }}>
          <Card style={{ marginBottom: 24 }}>
            <input
              type="file"
              id="batch-file-upload"
              accept=".docx,.md,.markdown,.txt"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <label htmlFor="batch-file-upload">
              <Button
                icon={<CloudUploadOutlined />}
                disabled={loading}
                block
                onClick={() =>
                  document.getElementById("batch-file-upload")?.click()
                }
              >
                Select Files
              </Button>
            </label>
          </Card>

          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Text style={{ display: "block", marginBottom: 4 }}>
                Starting Part Number
              </Text>
              <InputNumber
                style={{ width: "100%" }}
                value={startingPartNumber}
                onChange={(value) => setStartingPartNumber(value || 1)}
                disabled={loading}
                min={1}
              />
            </div>
            <Checkbox
              checked={skipExtraction}
              onChange={(e) => setSkipExtraction(e.target.checked)}
              disabled={loading}
            >
              Skip AI extraction (add entities manually later)
            </Checkbox>
          </div>

          {files.length > 0 && (
            <Card
              style={{ marginBottom: 24 }}
              styles={{ body: { padding: 0 } }}
            >
              <div
                style={{
                  padding: 16,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <Text strong style={{ fontSize: 16 }}>
                    Files ({files.length})
                  </Text>
                  {completedCount > 0 && (
                    <Tag color="success" style={{ marginLeft: 8 }}>
                      {completedCount} completed
                    </Tag>
                  )}
                  {errorCount > 0 && (
                    <Tag color="error" style={{ marginLeft: 4 }}>
                      {errorCount} failed
                    </Tag>
                  )}
                </div>
                <Button size="small" onClick={clearAllFiles} disabled={loading}>
                  Clear All
                </Button>
              </div>

              {loading && (
                <div style={{ padding: "0 16px 16px" }}>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    Processing {progress.current} of {progress.total} files...
                  </Text>
                  <Progress
                    percent={
                      progress.total > 0
                        ? Math.round((progress.current / progress.total) * 100)
                        : 0
                    }
                    showInfo={false}
                  />
                </div>
              )}

              <div>
                {files.map((fileWithStatus, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {getStatusIcon(fileWithStatus.status)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong style={{ display: "block" }}>
                        {fileWithStatus.file.name}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        Part {startingPartNumber + index}
                        {fileWithStatus.error && (
                          <Text type="danger" style={{ display: "block" }}>
                            Error: {fileWithStatus.error}
                          </Text>
                        )}
                        {fileWithStatus.extracted && (
                          <Text type="secondary" style={{ display: "block" }}>
                            Extracted: {fileWithStatus.extracted.characters}{" "}
                            chars, {fileWithStatus.extracted.locations} locs,{" "}
                            {fileWithStatus.extracted.events} events
                          </Text>
                        )}
                      </Text>
                    </div>
                    {!loading && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeFile(index)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {files.length > 0 && !loading && (
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">
                Estimated time: ~{Math.ceil(estimatedTime / 60)} minutes
              </Text>
            </div>
          )}

          <Button
            type="primary"
            size="large"
            block
            onClick={handleBatchImport}
            disabled={files.length === 0 || loading}
            loading={loading}
          >
            {loading
              ? "Processing Files..."
              : `Import ${files.length} File${files.length !== 1 ? "s" : ""}`}
          </Button>
        </div>

        {error && (
          <Alert
            type="error"
            title={error}
            style={{ marginTop: 24 }}
            showIcon
          />
        )}

        {completedCount > 0 && !loading && (
          <Alert
            type="success"
            title={`Successfully imported ${completedCount} of ${files.length} files!`}
            style={{ marginTop: 24 }}
            showIcon
          />
        )}
      </div>
    </div>
  );
}

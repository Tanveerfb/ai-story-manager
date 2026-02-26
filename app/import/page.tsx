"use client";

import { useState } from "react";
import {
  Typography,
  Input,
  InputNumber,
  Button,
  Alert,
  Spin,
  Card,
  Checkbox,
} from "antd";
import FileUpload from "@/components/FileUpload";

const { Title, Text } = Typography;

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [partNumber, setPartNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [skipExtraction, setSkipExtraction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("partNumber", partNumber.toString());
      formData.append("title", title);
      formData.append("skipExtraction", skipExtraction.toString());

      const response = await fetch("/api/import-story", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Import failed");
      }

      const result = await response.json();
      setSuccess(result);
      setFile(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 32, marginBottom: 32 }}>
        <Title level={3}>Import Story</Title>
        <Text type="secondary">
          Upload a .docx, .md, .markdown, .txt, or .gdoc file containing your
          story. The AI will automatically extract characters, locations,
          events, and relationships.
        </Text>

        <div style={{ marginTop: 32 }}>
          <FileUpload onFileSelect={setFile} />
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Part Number
            </label>
            <InputNumber
              style={{ width: "100%" }}
              value={partNumber}
              onChange={(value) => setPartNumber(value ?? 1)}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 4 }}>
              Title (Optional)
            </label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Checkbox
              checked={skipExtraction}
              onChange={(e) => setSkipExtraction(e.target.checked)}
            >
              Skip AI extraction (add entities manually later)
            </Checkbox>
          </div>
        </div>

        <div style={{ marginTop: 24 }}>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleImport}
            disabled={!file || loading}
          >
            {loading ? (
              <>
                <Spin size="small" style={{ marginRight: 8 }} />
                Processing...
              </>
            ) : (
              "Import Story"
            )}
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

        {success && (
          <Card style={{ marginTop: 24 }}>
            <Alert
              type="success"
              title="Story imported successfully!"
              style={{ marginBottom: 16 }}
              showIcon
            />
            <Title level={5}>Extracted Entities:</Title>
            <Text>• Characters: {success.extracted.characters}</Text>
            <br />
            <Text>• Locations: {success.extracted.locations}</Text>
            <br />
            <Text>• Events: {success.extracted.events}</Text>
            <br />
            <Text>• Relationships: {success.extracted.relationships}</Text>
            <br />
            <Text>• Themes: {success.extracted.themes}</Text>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Input,
  Select,
  Button,
  Alert,
  Spin,
} from "antd";

const { Title, Text } = Typography;

export default function LocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    let filtered = locations;

    if (searchTerm) {
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (typeFilter) {
      filtered = filtered.filter((loc) => loc.type === typeFilter);
    }

    setFilteredLocations(filtered);
  }, [locations, searchTerm, typeFilter]);

  const fetchLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
        setFilteredLocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error);
    }
  };

  const handleExtractFromStory = async () => {
    setExtracting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/locations?action=extract", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to extract locations");
      }

      const result = await response.json();

      console.log("Location extraction result:", result);

      let message = `Successfully extracted ${result.newLocations} new location(s) and updated ${result.updatedLocations} existing location(s)!`;

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

      // Refresh the locations list
      await fetchLocations();
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
            Locations
          </Title>
          <Button
            type="primary"
            onClick={handleExtractFromStory}
            disabled={extracting}
            icon={extracting ? <Spin size="small" /> : undefined}
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
            />
          </Col>
          <Col xs={24} md={8}>
            <Select
              style={{ width: "100%" }}
              placeholder="Filter by Type"
              value={typeFilter || undefined}
              onChange={(value) => setTypeFilter(value || "")}
              allowClear
              options={[
                { value: "", label: "All" },
                { value: "indoor", label: "Indoor" },
                { value: "outdoor", label: "Outdoor" },
                { value: "private", label: "Private" },
                { value: "public", label: "Public" },
              ]}
            />
          </Col>
        </Row>

        {filteredLocations.length === 0 ? (
          <Text type="secondary">
            No locations found. Import a story to extract locations.
          </Text>
        ) : (
          <Row gutter={[24, 24]}>
            {filteredLocations.map((location) => (
              <Col xs={24} sm={12} md={8} key={location.id}>
                <Card>
                  <Title level={5} style={{ marginTop: 0 }}>
                    {location.name}
                  </Title>
                  <Text
                    type="secondary"
                    style={{ display: "block", marginBottom: 8 }}
                  >
                    {location.description || "No description available"}
                  </Text>
                  <Text style={{ display: "block", fontSize: 12 }}>
                    Type: {location.type || "Unknown"}
                  </Text>
                  <Text style={{ display: "block", fontSize: 12 }}>
                    Importance: {location.importance || "Unknown"}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}

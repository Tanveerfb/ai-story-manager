"use client";

import { useState } from "react";
import {
  Card,
  Typography,
  Input,
  Button,
  List,
  Tag,
  Modal,
  Tooltip,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { theme as antdTheme } from "antd";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * Location Manager Component
 * Allows live creation, editing, and deletion of story locations
 */

interface Location {
  id: string;
  name: string;
  type?: string;
  description?: string;
  atmosphere?: string;
}

interface LocationManagerProps {
  locations: Location[];
  onLocationsChange: () => void;
}

export default function LocationManager({
  locations,
  onLocationsChange,
}: LocationManagerProps) {
  const { token } = antdTheme.useToken();
  const { mode } = useThemeMode();
  const sc = getSemanticColors(mode === "dark");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: "",
    type: "indoor",
    description: "",
    atmosphere: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Opens dialog for creating a new location
   */
  const handleOpenCreate = () => {
    setEditingLocation(null);
    setNewLocation({
      name: "",
      type: "indoor",
      description: "",
      atmosphere: "",
    });
    setDialogOpen(true);
  };

  /**
   * Opens dialog for editing an existing location
   */
  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      name: location.name,
      type: location.type || "indoor",
      description: location.description || "",
      atmosphere: location.atmosphere || "",
    });
    setDialogOpen(true);
  };

  /**
   * Closes the create/edit dialog
   */
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
    setError(null);
  };

  /**
   * Saves a new location or updates an existing one
   */
  const handleSaveLocation = async () => {
    if (!newLocation.name.trim()) {
      setError("Location name is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = editingLocation
        ? `/api/locations/${editingLocation.id}`
        : "/api/locations";

      const method = editingLocation ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLocation),
      });

      if (!response.ok) {
        throw new Error("Failed to save location");
      }

      handleCloseDialog();
      onLocationsChange();
    } catch (err: any) {
      setError(err.message || "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Deletes a location
   */
  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) {
      return;
    }

    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete location");
      }

      onLocationsChange();
    } catch (err: any) {
      console.error("Failed to delete location:", err);
    }
  };

  return (
    <Card style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EnvironmentOutlined style={{ color: "#1890ff", fontSize: 18 }} />
          <Title level={5} style={{ margin: 0 }}>
            Locations
          </Title>
        </div>
        <Tooltip title="Create new location">
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
          >
            Add
          </Button>
        </Tooltip>
      </div>

      {locations.length === 0 ? (
        <Text
          type="secondary"
          style={{ display: "block", padding: "16px 0", textAlign: "center" }}
        >
          No locations yet. Create your first location to get started!
        </Text>
      ) : (
        <List
          size="small"
          dataSource={locations.slice(0, 5)}
          renderItem={(location) => (
            <List.Item
              key={location.id}
              actions={[
                <Tooltip title="Edit location" key="edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleOpenEdit(location)}
                  />
                </Tooltip>,
                <Tooltip title="Delete location" key="delete">
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteLocation(location.id)}
                  />
                </Tooltip>,
              ]}
              style={{ borderBottom: `1px solid ${sc.border}` }}
            >
              <List.Item.Meta
                title={
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {location.name}
                    {location.type && <Tag>{location.type}</Tag>}
                  </div>
                }
                description={location.description || "No description"}
              />
            </List.Item>
          )}
        />
      )}

      {locations.length > 5 && (
        <Text
          type="secondary"
          style={{
            marginTop: 8,
            display: "block",
            textAlign: "center",
            fontSize: 12,
          }}
        >
          Showing 5 of {locations.length} locations
        </Text>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={dialogOpen}
        onCancel={handleCloseDialog}
        title={editingLocation ? "Edit Location" : "Create New Location"}
        width={560}
        footer={[
          <Button key="cancel" onClick={handleCloseDialog}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSaveLocation}
            disabled={loading || !newLocation.name.trim()}
            loading={loading}
          >
            Save
          </Button>,
        ]}
      >
        {error && (
          <Text type="danger" style={{ display: "block", marginBottom: 16 }}>
            {error}
          </Text>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Location Name *
          </label>
          <Input
            value={newLocation.name}
            onChange={(e) =>
              setNewLocation({ ...newLocation, name: e.target.value })
            }
            placeholder="Location Name"
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>Type</label>
          <Select
            style={{ width: "100%" }}
            value={newLocation.type}
            onChange={(value) =>
              setNewLocation({ ...newLocation, type: value })
            }
            options={[
              { value: "indoor", label: "Indoor" },
              { value: "outdoor", label: "Outdoor" },
              { value: "public", label: "Public Place" },
              { value: "private", label: "Private Place" },
              { value: "natural", label: "Natural Setting" },
              { value: "urban", label: "Urban Setting" },
            ]}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Description
          </label>
          <TextArea
            value={newLocation.description}
            onChange={(e) =>
              setNewLocation({ ...newLocation, description: e.target.value })
            }
            rows={3}
            placeholder="Describe the location..."
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", marginBottom: 4 }}>
            Atmosphere
          </label>
          <Input
            value={newLocation.atmosphere}
            onChange={(e) =>
              setNewLocation({ ...newLocation, atmosphere: e.target.value })
            }
            placeholder="e.g., tense, peaceful, mysterious"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            The mood or feeling of this location
          </Text>
        </div>
      </Modal>
    </Card>
  );
}

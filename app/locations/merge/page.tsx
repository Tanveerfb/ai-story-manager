"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Row,
  Col,
  Input,
  Button,
  Alert,
  Spin,
  Modal,
  Card,
  Tag,
  Checkbox,
  Tabs,
  List,
  theme as antdTheme,
} from "antd";
import { DeleteOutlined, MergeCellsOutlined } from "@ant-design/icons";
import { useThemeMode } from "@/components/ThemeProvider";
import { getSemanticColors } from "@/lib/theme";

const { Title, Text } = Typography;

interface Location {
  id: string;
  name: string;
  description?: string;
  type?: string;
  importance?: string;
  usageCount?: number;
}

interface LocationGroup {
  locations: Location[];
  similarityScore: number;
}

export default function LocationsMergePage() {
  const { mode } = useThemeMode();
  const { token } = antdTheme.useToken();
  const isDark = mode === "dark";
  const sc = getSemanticColors(isDark);
  const [tabValue, setTabValue] = useState("0");
  const [locations, setLocations] = useState<Location[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<Location[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [suggestedGroups, setSuggestedGroups] = useState<LocationGroup[]>([]);
  const [unusedLocations, setUnusedLocations] = useState<Location[]>([]);
  const [selectedUnusedIds, setSelectedUnusedIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = locations;

    if (searchTerm) {
      filtered = filtered.filter((loc) =>
        loc.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredLocations(filtered);
  }, [locations, searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [locationsRes, suggestionsRes, unusedRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/locations/suggestions"),
        fetch("/api/locations/unused"),
      ]);

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setLocations(data);
        setFilteredLocations(data);
      }

      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestedGroups(data);
      }

      if (unusedRes.ok) {
        const data = await unusedRes.json();
        setUnusedLocations(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        if (id === primaryId) {
          setPrimaryId(null);
        }
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSetPrimary = (id: string) => {
    if (selectedIds.includes(id)) {
      setPrimaryId(id);
    }
  };

  const handleMergeClick = () => {
    if (selectedIds.length < 2) {
      setError("Please select at least 2 locations to merge");
      return;
    }

    if (!primaryId) {
      setError("Please set a primary location");
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleConfirmMerge = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const duplicateIds = selectedIds.filter((id) => id !== primaryId);

      const response = await fetch("/api/locations/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryLocationId: primaryId,
          duplicateLocationIds: duplicateIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Merge failed");
      }

      const result = await response.json();
      setSuccess(result.message);
      setSelectedIds([]);
      setPrimaryId(null);

      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/locations?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

      setSuccess("Location deleted successfully");
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestedGroup = (group: LocationGroup) => {
    const ids = group.locations.map((loc) => loc.id);
    setSelectedIds(ids);
    setPrimaryId(ids[0]);
    setTabValue("0"); // Switch to main tab
  };

  const toggleUnusedSelection = (id: string) => {
    setSelectedUnusedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const toggleAllUnused = () => {
    if (selectedUnusedIds.length === unusedLocations.length) {
      setSelectedUnusedIds([]);
    } else {
      setSelectedUnusedIds(unusedLocations.map((loc) => loc.id));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedUnusedIds.length === 0) {
      setError("Please select at least one location to delete");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setBulkDeleteDialogOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/locations/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedUnusedIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Bulk delete failed");
      }

      const result = await response.json();
      setSuccess(`Successfully deleted ${result.deletedCount} location(s)`);
      setSelectedUnusedIds([]);
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const primaryLocation = locations.find((l) => l.id === primaryId);
  const duplicateLocations = locations.filter(
    (l) => selectedIds.includes(l.id) && l.id !== primaryId,
  );

  const canMerge = selectedIds.length >= 2 && primaryId !== null;

  const tabItems = [
    {
      key: "0",
      label: "All Locations",
      children: (
        <>
          <div style={{ marginBottom: 24 }}>
            <Input
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            {selectedIds.length > 0 && (
              <Card style={{ marginBottom: 16 }}>
                <Title level={5} style={{ marginTop: 0 }}>
                  Selected Locations ({selectedIds.length})
                </Title>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedIds.map((id) => {
                    const loc = locations.find((l) => l.id === id);
                    return loc ? (
                      <Tag
                        key={id}
                        closable
                        onClose={() => toggleSelection(id)}
                        color={id === primaryId ? "blue" : "default"}
                      >
                        {loc.name}
                      </Tag>
                    ) : null;
                  })}
                </div>
              </Card>
            )}

            <Button
              type="primary"
              size="large"
              block
              onClick={handleMergeClick}
              disabled={!canMerge || loading}
              icon={<MergeCellsOutlined />}
              style={{ marginBottom: 16 }}
            >
              {loading ? (
                <>
                  <Spin size="small" style={{ marginRight: 16 }} />
                  Merging...
                </>
              ) : (
                "Merge Selected Locations"
              )}
            </Button>
          </div>

          {loading ? (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "32px 0",
              }}
            >
              <Spin />
            </div>
          ) : filteredLocations.length === 0 ? (
            <Text type="secondary">
              No locations found. Import a story to extract locations.
            </Text>
          ) : (
            <Row gutter={[24, 24]}>
              {filteredLocations.map((location) => {
                const isSelected = selectedIds.includes(location.id);
                const isPrimary = location.id === primaryId;

                return (
                  <Col xs={24} sm={12} md={8} key={location.id}>
                    <Card
                      style={{
                        cursor: "pointer",
                        border: isPrimary
                          ? `3px solid ${token.colorPrimary}`
                          : isSelected
                            ? `2px solid ${token.colorPrimary}`
                            : `1px solid ${sc.border}`,
                      }}
                      hoverable
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          marginBottom: 16,
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => toggleSelection(location.id)}
                        />
                        <div style={{ flexGrow: 1, marginLeft: 8 }}>
                          <Title level={5} style={{ margin: 0 }}>
                            {location.name}
                          </Title>
                          {location.type && (
                            <Tag style={{ marginTop: 8 }}>{location.type}</Tag>
                          )}
                          {isPrimary && (
                            <Tag color="blue" style={{ marginTop: 8 }}>
                              PRIMARY
                            </Tag>
                          )}
                        </div>
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteLocation(location.id)}
                        />
                      </div>

                      {location.description && (
                        <Text
                          type="secondary"
                          style={{ display: "block", marginBottom: 8 }}
                        >
                          {location.description.slice(0, 100)}
                          {location.description.length > 100 ? "..." : ""}
                        </Text>
                      )}

                      {isSelected && !isPrimary && (
                        <Button
                          size="small"
                          block
                          onClick={() => handleSetPrimary(location.id)}
                        >
                          Set as Primary
                        </Button>
                      )}
                    </Card>
                  </Col>
                );
              })}
            </Row>
          )}
        </>
      ),
    },
    {
      key: "1",
      label: "Suggested Merges",
      children: (
        <div>
          {suggestedGroups.length === 0 ? (
            <Alert type="info" title="No duplicate locations detected!" />
          ) : (
            <Row gutter={[24, 24]}>
              {suggestedGroups.map((group, idx) => (
                <Col xs={24} key={idx}>
                  <Card>
                    <Title level={5} style={{ marginTop: 0 }}>
                      Possible Duplicates (
                      {(group.similarityScore * 100).toFixed(0)}% similar)
                    </Title>
                    <List
                      dataSource={group.locations}
                      renderItem={(loc) => (
                        <List.Item key={loc.id}>
                          <List.Item.Meta
                            title={loc.name}
                            description={loc.description}
                          />
                        </List.Item>
                      )}
                    />
                    <Button
                      type="primary"
                      onClick={() => handleSelectSuggestedGroup(group)}
                    >
                      Select for Merge
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      ),
    },
    {
      key: "2",
      label: `Unused (${unusedLocations.length})`,
      children: (
        <div>
          {unusedLocations.length === 0 ? (
            <Alert type="success" title="All locations are in use!" />
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <Card style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 16 }}
                    >
                      <Checkbox
                        checked={
                          selectedUnusedIds.length === unusedLocations.length
                        }
                        indeterminate={
                          selectedUnusedIds.length > 0 &&
                          selectedUnusedIds.length < unusedLocations.length
                        }
                        onChange={toggleAllUnused}
                      />
                      <Title level={5} style={{ margin: 0 }}>
                        {selectedUnusedIds.length === 0
                          ? "Select locations to delete"
                          : `${selectedUnusedIds.length} location(s) selected`}
                      </Title>
                    </div>
                    <Button
                      type="primary"
                      danger
                      onClick={handleBulkDeleteClick}
                      disabled={selectedUnusedIds.length === 0 || loading}
                      icon={<DeleteOutlined />}
                    >
                      {loading
                        ? "Deleting..."
                        : `Delete Selected (${selectedUnusedIds.length})`}
                    </Button>
                  </div>
                </Card>
              </div>

              <Row gutter={[24, 24]}>
                {unusedLocations.map((location) => {
                  const isSelected = selectedUnusedIds.includes(location.id);

                  return (
                    <Col xs={24} sm={12} md={8} key={location.id}>
                      <Card
                        style={{
                          border: isSelected
                            ? "2px solid #ff4d4f"
                            : `1px solid ${sc.border}`,
                        }}
                        hoverable
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            marginBottom: 8,
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleUnusedSelection(location.id)}
                          />
                          <div style={{ flexGrow: 1, marginLeft: 8 }}>
                            <Title level={5} style={{ margin: 0 }}>
                              {location.name}
                            </Title>
                            <Tag
                              color={
                                location.usageCount === 0 ? "error" : "warning"
                              }
                              style={{ marginTop: 8 }}
                            >
                              {`Used ${location.usageCount || 0} time${(location.usageCount || 0) === 1 ? "" : "s"}`}
                            </Tag>
                          </div>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteLocation(location.id)}
                          />
                        </div>
                        {location.description && (
                          <Text
                            type="secondary"
                            style={{ display: "block", marginTop: 8 }}
                          >
                            {location.description}
                          </Text>
                        )}
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 32, marginBottom: 32 }}>
        <Title level={2}>Locations Merge &amp; Review</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 16 }}>
          Merge duplicate locations, review unused locations, and clean up your
          location database.
        </Text>

        <Tabs
          activeKey={tabValue}
          onChange={(key) => setTabValue(key)}
          items={tabItems}
          style={{ marginBottom: 24 }}
        />

        {error && (
          <Alert type="error" title={error} style={{ marginBottom: 24 }} />
        )}

        {success && (
          <Alert type="success" title={success} style={{ marginBottom: 24 }} />
        )}
      </div>

      {/* Confirmation Dialog */}
      <Modal
        title="Confirm Location Merge"
        open={confirmDialogOpen}
        onCancel={() => setConfirmDialogOpen(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmMerge}>
            Confirm Merge
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          title="This action cannot be undone. The duplicate locations will be permanently deleted."
          style={{ marginBottom: 16 }}
        />

        {primaryLocation && (
          <Card
            style={{
              marginBottom: 16,
              background: sc.successBg,
              borderColor: sc.successBorder,
            }}
          >
            <Text strong style={{ display: "block" }}>
              Primary Location (KEEP)
            </Text>
            <Title level={5} style={{ marginTop: 4, marginBottom: 4 }}>
              {primaryLocation.name}
            </Title>
            <Text type="secondary">Type: {primaryLocation.type}</Text>
          </Card>
        )}

        <Card style={{ background: sc.errorBg, borderColor: sc.errorBorder }}>
          <Text strong style={{ display: "block" }}>
            Locations to Delete ({duplicateLocations.length})
          </Text>
          {duplicateLocations.map((loc) => (
            <Text key={loc.id} style={{ display: "block" }}>
              • {loc.name}
            </Text>
          ))}
        </Card>
      </Modal>

      {/* Bulk Delete Dialog */}
      <Modal
        title="Confirm Bulk Delete"
        open={bulkDeleteDialogOpen}
        onCancel={() => setBulkDeleteDialogOpen(false)}
        width={600}
        footer={[
          <Button key="cancel" onClick={() => setBulkDeleteDialogOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleConfirmBulkDelete}
          >
            Delete {selectedUnusedIds.length} Location(s)
          </Button>,
        ]}
      >
        <Alert
          type="error"
          title={`This action cannot be undone. ${selectedUnusedIds.length} location(s) will be permanently deleted.`}
          style={{ marginBottom: 16 }}
        />

        <Card style={{ background: sc.errorBg, borderColor: sc.errorBorder }}>
          <Text strong style={{ display: "block", marginBottom: 8 }}>
            Locations to Delete ({selectedUnusedIds.length})
          </Text>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {unusedLocations
              .filter((loc) => selectedUnusedIds.includes(loc.id))
              .map((loc) => (
                <Text key={loc.id} style={{ display: "block" }}>
                  • {loc.name} (used {loc.usageCount || 0} time
                  {(loc.usageCount || 0) === 1 ? "" : "s"})
                </Text>
              ))}
          </div>
        </Card>
      </Modal>
    </div>
  );
}

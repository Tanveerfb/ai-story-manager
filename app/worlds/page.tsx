"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Card,
  Button,
  Input,
  Modal,
  Form,
  Table,
  Tag,
  Space,
  Popconfirm,
  Alert,
  Empty,
  theme,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { useWorld } from "@/components/WorldProvider";
import { getSemanticColors } from "@/lib/theme";
import { useThemeMode } from "@/components/ThemeProvider";

const { Title, Text, Paragraph } = Typography;

interface World {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  created_at: string;
  updated_at: string;
}

export default function WorldsPage() {
  const { token } = theme.useToken();
  const { mode } = useThemeMode();
  const sc = getSemanticColors(mode === "dark");
  const { worldId, switchWorld, refreshWorlds } = useWorld();

  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<World | null>(null);
  const [error, setError] = useState("");
  const [form] = Form.useForm();

  const fetchWorlds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/worlds");
      if (res.ok) {
        const data = await res.json();
        setWorlds(data);
      }
    } catch {
      setError("Failed to load worlds");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorlds();
  }, [fetchWorlds]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (world: World) => {
    setEditing(world);
    form.setFieldsValue({
      name: world.name,
      description: world.description || "",
      genre: world.genre || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setError("");

      if (editing) {
        const res = await fetch("/api/worlds", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...values }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update world");
        }
      } else {
        const res = await fetch("/api/worlds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to create world");
        }
      }

      setModalOpen(false);
      form.resetFields();
      setEditing(null);
      await fetchWorlds();
      await refreshWorlds();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error
      setError(err.message || "Something went wrong");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/worlds?id=${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete world");
      }
      await fetchWorlds();
      await refreshWorlds();
    } catch (err: any) {
      setError(err.message || "Failed to delete world");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: World) => (
        <Space direction="vertical" size={4}>
          <Space wrap>
            <GlobalOutlined style={{ color: token.colorPrimary }} />
            <Text strong>{name}</Text>
            {record.id === worldId && (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Active
              </Tag>
            )}
          </Space>
          {/* Show genre inline on mobile */}
          {record.genre && (
            <Tag
              color="blue"
              className="mobile-only-genre"
              style={{ margin: 0 }}
            >
              {record.genre}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Genre",
      dataIndex: "genre",
      key: "genre",
      responsive: ["md"] as any,
      render: (genre: string) =>
        genre ? (
          <Tag color="blue">{genre}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      responsive: ["lg"] as any,
      render: (desc: string) =>
        desc ? (
          <Text style={{ maxWidth: 300 }} ellipsis={{ tooltip: desc }}>
            {desc}
          </Text>
        ) : (
          <Text type="secondary">No description</Text>
        ),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      responsive: ["sm"] as any,
      render: (date: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 160,
      render: (_: any, record: World) => (
        <Space wrap size={4}>
          {record.id !== worldId && (
            <Button
              size="small"
              type="primary"
              onClick={() => switchWorld(record.id)}
            >
              Switch
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this world?"
            description="All associated story parts, characters, and locations will lose their world reference."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={3} style={{ margin: 0 }}>
              Worlds
            </Title>
            <Text type="secondary">
              Create and manage story universes. Each world has its own
              characters, locations, and story parts.
            </Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New World
          </Button>
        </div>

        {error && (
          <Alert
            type="error"
            title={error}
            closable
            onClose={() => setError("")}
            style={{ marginBottom: 16 }}
          />
        )}

        <Card>
          {worlds.length === 0 && !loading ? (
            <Empty
              description="No worlds yet. Create your first world to get started."
              style={{ padding: 40 }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreate}
              >
                Create World
              </Button>
            </Empty>
          ) : (
            <Table
              dataSource={worlds}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              scroll={{ x: "max-content" }}
            />
          )}
        </Card>
      </div>

      <Modal
        title={editing ? "Edit World" : "Create New World"}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => {
          setModalOpen(false);
          setEditing(null);
          form.resetFields();
        }}
        okText={editing ? "Save Changes" : "Create"}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="World Name"
            rules={[{ required: true, message: "Please enter a world name" }]}
          >
            <Input placeholder="e.g. Middle Earth, Neo Tokyo, Victorian London" />
          </Form.Item>
          <Form.Item name="genre" label="Genre">
            <Input placeholder="e.g. Fantasy, Sci-Fi, Mystery, Romance" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="A brief description of this world's setting, tone, and key elements..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

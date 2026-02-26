"use client";

import { useEffect, useState } from "react";
import { Typography, Card, Select, Row, Col, Tag } from "antd";

const { Title, Text } = Typography;

export default function TimelinePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    if (eventTypeFilter) {
      filtered = filtered.filter(
        (event) => event.event_type === eventTypeFilter,
      );
    }

    setFilteredEvents(filtered);
  }, [events, eventTypeFilter]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const getEventColor = (type: string): string => {
    switch (type) {
      case "dialogue":
        return "blue";
      case "action":
        return "purple";
      case "revelation":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Title level={3}>Events Timeline</Title>

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Filter by Event Type
            </Text>
            <Select
              style={{ width: "100%" }}
              value={eventTypeFilter}
              onChange={(value) => setEventTypeFilter(value)}
              options={[
                { value: "", label: "All" },
                { value: "dialogue", label: "Dialogue" },
                { value: "action", label: "Action" },
                { value: "revelation", label: "Revelation" },
              ]}
            />
          </Col>
        </Row>

        {filteredEvents.length === 0 ? (
          <Card style={{ textAlign: "center" }}>
            <Text type="secondary">
              No events found. Import a story to extract events.
            </Text>
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredEvents.map((event) => (
              <Col xs={24} key={event.id}>
                <Card>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    <Tag color={getEventColor(event.event_type)}>
                      {event.event_type}
                    </Tag>
                    {event.timestamp_in_story && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {event.timestamp_in_story}
                      </Text>
                    )}
                  </div>
                  <Title level={5} style={{ marginBottom: 8 }}>
                    {event.description}
                  </Title>
                  {event.content && (
                    <Text
                      type="secondary"
                      style={{ display: "block", marginBottom: 16 }}
                    >
                      {event.content}
                    </Text>
                  )}
                  <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
                    {event.characters && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Character: {event.characters.name}
                      </Text>
                    )}
                    {event.locations && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Location: {event.locations.name}
                      </Text>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
}

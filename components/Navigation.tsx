"use client";

import { useState, useMemo } from "react";
import { Layout, Menu, Select, Button, Typography, theme } from "antd";
import {
  MenuOutlined,
  EditOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  BookOutlined,
  AppstoreOutlined,
  LineChartOutlined,
  FieldTimeOutlined,
  SearchOutlined,
  BarChartOutlined,
  SettingOutlined,
  GlobalOutlined,
  SunOutlined,
  MoonOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { useThemeMode } from "./ThemeProvider";
import { useWorld } from "./WorldProvider";

const { Header, Content } = Layout;
const { Text, Title } = Typography;

const SIDER_WIDTH = 250;
const COLLAPSED_WIDTH = 72;

const menuItems = [
  { key: "/continue", icon: <EditOutlined />, label: "Continue Story" },
  { key: "/characters", icon: <TeamOutlined />, label: "Characters" },
  { key: "/locations", icon: <EnvironmentOutlined />, label: "Locations" },
  { key: "/worlds", icon: <GlobalOutlined />, label: "Worlds" },
  { key: "/story", icon: <BookOutlined />, label: "Story Viewer" },
  { key: "/scenes", icon: <AppstoreOutlined />, label: "Scene Planner" },
  { key: "/image-studio", icon: <PictureOutlined />, label: "Image Studio" },
  { key: "/arcs", icon: <LineChartOutlined />, label: "Character Arcs" },
  { key: "/timeline", icon: <FieldTimeOutlined />, label: "Timeline" },
  { key: "/search", icon: <SearchOutlined />, label: "Search" },
  { key: "/stats", icon: <BarChartOutlined />, label: "Statistics" },
  { key: "/settings", icon: <SettingOutlined />, label: "Settings" },
];

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { mode, toggleTheme } = useThemeMode();
  const { worldId, worlds, switchWorld } = useWorld();
  const { token } = theme.useToken();
  const isDark = mode === "dark";

  const handleNavigation = (info: { key: string }) => {
    router.push(info.key);
    setMobileOpen(false);
  };

  const selectedKey =
    menuItems.find((item) => pathname?.startsWith(item.key))?.key ||
    "/continue";

  // Glass effect colours
  const glass = useMemo(
    () =>
      isDark
        ? {
            bg: "rgba(25, 25, 42, 0.78)",
            border: "rgba(255, 255, 255, 0.08)",
            headerBg: "rgba(25, 25, 42, 0.88)",
            headerBorder: "rgba(255, 255, 255, 0.08)",
            titleColor: "rgba(255, 255, 255, 0.92)",
            subtitleColor: "rgba(255, 255, 255, 0.50)",
            brandAccent: token.colorPrimary,
          }
        : {
            bg: "rgba(255, 255, 255, 0.62)",
            border: "rgba(0, 0, 0, 0.06)",
            headerBg: "rgba(255, 255, 255, 0.78)",
            headerBorder: "rgba(0, 0, 0, 0.06)",
            titleColor: "rgba(0, 0, 0, 0.88)",
            subtitleColor: "rgba(0, 0, 0, 0.45)",
            brandAccent: token.colorPrimary,
          },
    [isDark, token.colorPrimary],
  );

  const currentWidth = collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH;

  const siderContent = (isMobile = false) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Brand header */}
      <div
        style={{
          padding: collapsed && !isMobile ? "20px 0 12px" : "20px 20px 12px",
          textAlign: collapsed && !isMobile ? "center" : "left",
        }}
      >
        <Title
          level={5}
          style={{
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: glass.titleColor,
            fontSize: collapsed && !isMobile ? 14 : 16,
            fontWeight: 700,
            letterSpacing: "-0.01em",
          }}
        >
          {collapsed && !isMobile ? "AI" : "AI Authoring Suite"}
        </Title>
        {!(collapsed && !isMobile) && (
          <Text
            style={{
              fontSize: 11,
              color: glass.subtitleColor,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}
          >
            Story Engine
          </Text>
        )}
      </div>

      {/* World selector */}
      {!(collapsed && !isMobile) && worlds.length > 0 && (
        <div style={{ padding: "0 16px 12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 6,
            }}
          >
            <GlobalOutlined
              style={{ fontSize: 11, color: glass.brandAccent }}
            />
            <Text
              style={{
                fontSize: 11,
                color: glass.subtitleColor,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              World
            </Text>
          </div>
          <Select
            size="small"
            style={{ width: "100%" }}
            value={worldId || undefined}
            onChange={(val) => switchWorld(val)}
            options={worlds.map((w) => ({ value: w.id, label: w.name }))}
          />
        </div>
      )}

      {/* Divider */}
      <div
        style={{
          height: 1,
          margin: "0 16px 8px",
          background: glass.border,
        }}
      />

      {/* Navigation menu */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={handleNavigation}
          items={menuItems}
          style={{
            background: "transparent",
            borderRight: 0,
            fontSize: 13,
            fontWeight: 500,
          }}
          inlineCollapsed={collapsed && !isMobile}
        />
      </div>

      {/* Bottom section - theme toggle */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: `1px solid ${glass.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed && !isMobile ? "center" : "space-between",
        }}
      >
        {!(collapsed && !isMobile) && (
          <Text
            style={{
              fontSize: 12,
              color: glass.subtitleColor,
              fontWeight: 500,
            }}
          >
            {isDark ? "Dark" : "Light"} mode
          </Text>
        )}
        <Button
          type="text"
          size="small"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{
            color: glass.subtitleColor,
            borderRadius: 8,
          }}
        />
      </div>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Desktop Glass Sidebar */}
      <aside
        className="glass-sidebar hide-on-mobile"
        style={{
          width: currentWidth,
          minWidth: currentWidth,
          maxWidth: currentWidth,
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          background: glass.bg,
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderRight: `1px solid ${glass.border}`,
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        {siderContent()}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            transition: "opacity 0.3s ease",
          }}
          onClick={() => setMobileOpen(false)}
        >
          <aside
            style={{
              width: SIDER_WIDTH,
              height: "100%",
              background: glass.bg,
              backdropFilter: "blur(24px) saturate(1.5)",
              WebkitBackdropFilter: "blur(24px) saturate(1.5)",
              borderRight: `1px solid ${glass.border}`,
              overflow: "auto",
              boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {siderContent(true)}
          </aside>
        </div>
      )}

      <Layout
        style={{
          marginLeft: currentWidth,
          transition: "margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          background: "transparent",
        }}
      >
        <Header
          style={{
            padding: "0 16px",
            height: 56,
            lineHeight: "56px",
            display: "flex",
            alignItems: "center",
            background: glass.headerBg,
            backdropFilter: "blur(16px) saturate(1.3)",
            WebkitBackdropFilter: "blur(16px) saturate(1.3)",
            borderBottom: `1px solid ${glass.headerBorder}`,
            position: "sticky",
            top: 0,
            zIndex: 99,
            gap: 12,
          }}
        >
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => {
              if (window.innerWidth < 992) {
                setMobileOpen(!mobileOpen);
              } else {
                setCollapsed(!collapsed);
              }
            }}
            style={{ borderRadius: 8 }}
          />
          <Text
            strong
            style={{
              flex: 1,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            AI-First Story Creation
          </Text>
          <Button
            type="text"
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            style={{ borderRadius: 8 }}
          />
        </Header>
        <Content style={{ padding: "16px 12px", minHeight: 280 }}>
          {children}
        </Content>
      </Layout>

      <style jsx global>{`
        @media (max-width: 991px) {
          .hide-on-mobile {
            display: none !important;
          }
          .ant-layout {
            margin-left: 0 !important;
          }
        }

        /* Glass sidebar menu overrides */
        .glass-sidebar .ant-menu {
          background: transparent !important;
        }
        .glass-sidebar .ant-menu-item {
          margin: 2px 8px !important;
          padding-left: 16px !important;
          border-radius: 8px !important;
          color: ${glass.subtitleColor} !important;
          transition: all 0.2s ease !important;
        }
        .glass-sidebar .ant-menu-item:hover {
          background: ${isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.04)"} !important;
          color: ${glass.titleColor} !important;
        }
        .glass-sidebar .ant-menu-item-selected {
          background: ${isDark
            ? "rgba(144, 202, 249, 0.12)"
            : "rgba(25, 118, 210, 0.08)"} !important;
          color: ${token.colorPrimary} !important;
          font-weight: 600 !important;
        }
        .glass-sidebar .ant-menu-item-selected::after {
          display: none !important;
        }
        .glass-sidebar .ant-menu-inline-collapsed .ant-menu-item {
          padding-left: 0 !important;
          text-align: center;
          margin: 2px 6px !important;
        }

        /* Glass select styling */
        .glass-sidebar .ant-select-selector {
          background: ${isDark
            ? "rgba(255,255,255,0.06)"
            : "rgba(0,0,0,0.04)"} !important;
          border-color: ${glass.border} !important;
          border-radius: 8px !important;
        }
      `}</style>
    </Layout>
  );
}

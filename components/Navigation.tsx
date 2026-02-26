"use client";

import { useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Toolbar,
  AppBar,
  Box,
  Typography,
  Select,
  MenuItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CreateIcon from "@mui/icons-material/Create";
import PeopleIcon from "@mui/icons-material/People";
import PlaceIcon from "@mui/icons-material/Place";
import TimelineIcon from "@mui/icons-material/Timeline";
import SettingsIcon from "@mui/icons-material/Settings";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import MergeTypeIcon from "@mui/icons-material/MergeType";
import LinkOffIcon from "@mui/icons-material/LinkOff";
import MovieFilterIcon from "@mui/icons-material/MovieFilter";
import BarChartIcon from "@mui/icons-material/BarChart";
import SearchIcon from "@mui/icons-material/Search";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import PublicIcon from "@mui/icons-material/Public";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { useRouter } from "next/navigation";
import { useThemeMode } from "./ThemeProvider";
import { useWorld } from "./WorldProvider";

const drawerWidth = 240;

/**
 * AI-First Authoring Suite Navigation Menu
 * Simplified menu focused on story creation workflow
 * Import-related items are hidden to enforce AI-first creation from scratch
 */
const menuItems = [
  { text: "Continue Story", icon: <CreateIcon />, path: "/continue" },
  { text: "Characters", icon: <PeopleIcon />, path: "/characters" },
  { text: "Locations", icon: <PlaceIcon />, path: "/locations" },
  { text: "Story Viewer", icon: <MenuBookIcon />, path: "/story" },
  { text: "Scene Planner", icon: <ViewKanbanIcon />, path: "/scenes" },
  { text: "Character Arcs", icon: <ShowChartIcon />, path: "/arcs" },
  { text: "Timeline", icon: <TimelineIcon />, path: "/timeline" },
  { text: "Search", icon: <SearchIcon />, path: "/search" },
  { text: "Statistics", icon: <BarChartIcon />, path: "/stats" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Navigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { mode, toggleTheme } = useThemeMode();
  const { worldId, worldName, worlds, switchWorld } = useWorld();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          AI Authoring Suite
        </Typography>
      </Toolbar>
      {/* World Selector */}
      {worlds.length > 0 && (
        <Box sx={{ px: 2, pb: 1 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
          >
            <PublicIcon fontSize="small" color="primary" />
            <Typography variant="caption" color="text.secondary">
              Story World
            </Typography>
          </Box>
          <Select
            fullWidth
            size="small"
            value={worldId || ""}
            onChange={(e) => switchWorld(e.target.value)}
            sx={{ fontSize: "0.85rem" }}
          >
            {worlds.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
      )}
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => handleNavigation(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            AI-First Story Creation
          </Typography>
          <IconButton onClick={toggleTheme} color="inherit">
            {mode === "dark" ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0, // prevent overflow
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

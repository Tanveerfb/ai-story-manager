"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

const WORLD_STORAGE_KEY = "ai_story_manager_world_id";

interface World {
  id: string;
  name: string;
  description?: string;
  genre?: string;
}

interface WorldContextType {
  worldId: string | null;
  worldName: string;
  worlds: World[];
  loading: boolean;
  switchWorld: (id: string) => void;
  refreshWorlds: () => Promise<void>;
}

const WorldContext = createContext<WorldContextType>({
  worldId: null,
  worldName: "",
  worlds: [],
  loading: true,
  switchWorld: () => {},
  refreshWorlds: async () => {},
});

export const useWorld = () => useContext(WorldContext);

export function WorldProvider({ children }: { children: ReactNode }) {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [worldName, setWorldName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWorlds = useCallback(async () => {
    try {
      const res = await fetch("/api/worlds");
      if (res.ok) {
        const data: World[] = await res.json();
        setWorlds(data);
        return data;
      }
    } catch {
      // silent
    }
    return [];
  }, []);

  useEffect(() => {
    (async () => {
      const data = await fetchWorlds();
      if (data.length > 0) {
        const stored = localStorage.getItem(WORLD_STORAGE_KEY);
        const match = data.find((w) => w.id === stored) || data[0];
        setWorldId(match.id);
        setWorldName(match.name);
      }
      setLoading(false);
    })();
  }, [fetchWorlds]);

  const switchWorld = useCallback(
    (id: string) => {
      const world = worlds.find((w) => w.id === id);
      if (world) {
        localStorage.setItem(WORLD_STORAGE_KEY, id);
        setWorldId(id);
        setWorldName(world.name);
      }
    },
    [worlds],
  );

  const refreshWorlds = useCallback(async () => {
    const data = await fetchWorlds();
    // If current world was deleted, switch to first
    if (worldId && !data.find((w) => w.id === worldId) && data.length > 0) {
      switchWorld(data[0].id);
    }
  }, [fetchWorlds, worldId, switchWorld]);

  return (
    <WorldContext.Provider
      value={{
        worldId,
        worldName,
        worlds,
        loading,
        switchWorld,
        refreshWorlds,
      }}
    >
      {children}
    </WorldContext.Provider>
  );
}

export { WORLD_STORAGE_KEY };

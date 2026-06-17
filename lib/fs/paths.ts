/**
 * Low-level filesystem helpers for the local story data layer (plan §6).
 * SERVER-ONLY. All story data lives under a single root, overridable with the
 * STORY_DATA_PATH env var (plan §16). Generic raw-path access is intentionally
 * NOT exposed — callers operate through the typed helpers in lib/fs/* to avoid
 * path traversal.
 */

import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { STORY_DATA_DIR } from "@/lib/constants";

export function storyRoot(): string {
  return process.env.STORY_DATA_PATH
    ? path.resolve(process.env.STORY_DATA_PATH)
    : path.join(process.cwd(), STORY_DATA_DIR);
}

function isNotFound(error: unknown): boolean {
  return (error as NodeJS.ErrnoException)?.code === "ENOENT";
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

export async function readText(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function writeText(file: string, content: string): Promise<void> {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, content, "utf8");
}

/** Sorted names of immediate subdirectories ([] when the dir is missing). */
export async function listDirs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

/** Sorted file names matching a suffix ([] when the dir is missing). */
export async function listFiles(dir: string, suffix: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(suffix))
      .map((e) => e.name)
      .sort();
  } catch (error) {
    if (isNotFound(error)) return [];
    throw error;
  }
}

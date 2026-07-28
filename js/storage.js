import { defaultFolders, folderColors, STORAGE_KEYS } from "./config.js";
import { isFolderColor, normalizeFolderHierarchy } from "./folders.js";

const encoder = new TextEncoder();

export function loadNotes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function loadFolders() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.folders) || "[]");
    const valid = Array.isArray(saved)
      ? saved
          .filter((folder) => folder?.id && folder?.name?.trim())
          .map((folder, index) => ({
            id: folder.id,
            name: folder.name.trim(),
            color: isFolderColor(folder.color, folderColors)
              ? folder.color
              : folderColors[index % folderColors.length].value,
            parentId: typeof folder.parentId === "string" ? folder.parentId : null,
          }))
      : [];
    return valid.length
      ? normalizeFolderHierarchy(valid)
      : defaultFolders.map((folder) => ({ ...folder }));
  } catch {
    return defaultFolders.map((folder) => ({ ...folder }));
  }
}

export function loadCollapsedFolders() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.collapsedFolders) || "[]",
    );
    return new Set(
      Array.isArray(saved)
        ? saved.filter((folderId) => typeof folderId === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

export function persistCollapsedFolders(collapsedFolderIds) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.collapsedFolders,
      JSON.stringify([...collapsedFolderIds]),
    );
  } catch {
    // Keep the current-session tree state when storage is unavailable.
  }
}

export function getLocalStorageUsage() {
  let bytes = 0;
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || "";
      const value = localStorage.getItem(key) || "";
      bytes += encoder.encode(key).length + encoder.encode(value).length;
    }
  } catch {
    return 0;
  }
  return bytes;
}

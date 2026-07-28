export const STORAGE_KEYS = Object.freeze({
  notes: "vimnote.notes.v1",
  activeNote: "vimnote.active.v1",
  theme: "vimnote.theme.v1",
  folders: "vimnote.folders.v1",
  sidebarCollapsed: "vimnote.sidebar-collapsed.v1",
  noteDensity: "vimnote.note-density.v1",
  collapsedFolders: "vimnote.collapsed-folders.v1",
});

export const themes = Object.freeze([
  { id: "paper", name: "Paper", description: "Soft and warm", colors: ["#f5f1e8", "#252421", "#e7644b"] },
  { id: "midnight", name: "Midnight", description: "Deep night blue", colors: ["#10141c", "#edf1f7", "#ff7a66"] },
  { id: "charcoal", name: "Charcoal", description: "Quiet graphite", colors: ["#171717", "#f1eee8", "#e78b61"] },
  { id: "forest", name: "Forest", description: "Deep woodland", colors: ["#13201b", "#eef3e8", "#e3a65a"] },
  { id: "ocean", name: "Ocean", description: "Calm blue water", colors: ["#0e1c24", "#e9f3f5", "#6dc5d6"] },
  { id: "plum", name: "Plum", description: "Dark violet", colors: ["#211725", "#f4edf3", "#d987b8"] },
  { id: "sepia", name: "Sepia", description: "Aged notebook", colors: ["#eee3cf", "#392e23", "#a75638"] },
  { id: "slate", name: "Slate", description: "Clean blue gray", colors: ["#e8edf0", "#253039", "#4f7596"] },
  { id: "sakura", name: "Sakura", description: "Soft cherry pink", colors: ["#f8ecef", "#382b31", "#c95078"] },
  { id: "solarized", name: "Solarized", description: "Low contrast", colors: ["#fdf6e3", "#073642", "#cb4b16"] },
]);

export const folderColors = Object.freeze([
  { value: "#e7644b", name: "Coral" },
  { value: "#d98b3e", name: "Orange" },
  { value: "#c5a332", name: "Yellow" },
  { value: "#629167", name: "Green" },
  { value: "#3e9183", name: "Teal" },
  { value: "#3d91a8", name: "Cyan" },
  { value: "#4f7596", name: "Blue" },
  { value: "#626ca8", name: "Indigo" },
  { value: "#8765a6", name: "Purple" },
  { value: "#c05f87", name: "Pink" },
  { value: "#906c52", name: "Brown" },
  { value: "#747b81", name: "Gray" },
]);

export const defaultFolders = Object.freeze([
  { id: "folder-inbox", name: "Inbox", color: "#e7644b", parentId: null },
  { id: "folder-work", name: "Work", color: "#4f7596", parentId: null },
  { id: "folder-personal", name: "Personal", color: "#629167", parentId: null },
]);

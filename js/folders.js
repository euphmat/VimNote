export function isFolderColor(value, colors) {
  return colors.some((color) => color.value === value);
}

export function normalizeFolderHierarchy(folders) {
  const ids = new Set(folders.map((folder) => folder.id));
  const byId = new Map(folders.map((folder) => [folder.id, folder]));

  folders.forEach((folder) => {
    if (!folder.parentId || !ids.has(folder.parentId) || folder.parentId === folder.id) {
      folder.parentId = null;
      return;
    }

    const visited = new Set([folder.id]);
    let currentId = folder.parentId;
    while (currentId) {
      if (visited.has(currentId)) {
        folder.parentId = null;
        break;
      }
      visited.add(currentId);
      currentId = byId.get(currentId)?.parentId || null;
    }
  });

  return folders;
}

export function findFolder(folders, folderId) {
  return folders.find((folder) => folder.id === folderId) || null;
}

export function collectFolderTreeIds(folders, folderId) {
  const ids = new Set();
  const visit = (id) => {
    if (ids.has(id)) return;
    ids.add(id);
    folders
      .filter((folder) => folder.parentId === id)
      .forEach((folder) => visit(folder.id));
  };
  visit(folderId);
  return ids;
}

export function flattenFolders(
  folders,
  collapsedFolderIds,
  { respectCollapsed = false } = {},
) {
  const rows = [];
  const visited = new Set();
  const byId = new Map(folders.map((folder) => [folder.id, folder]));

  const append = (folder, depth) => {
    if (visited.has(folder.id)) return;
    visited.add(folder.id);
    const hasChildren = folders.some((item) => item.parentId === folder.id);
    const collapsed = hasChildren && collapsedFolderIds.has(folder.id);
    rows.push({ folder, depth, hasChildren, collapsed });
    if (!respectCollapsed || !collapsed) visit(folder.id, depth + 1);
  };

  const visit = (parentId, depth) => {
    folders
      .filter((folder) => folder.parentId === parentId)
      .forEach((folder) => append(folder, depth));
  };

  visit(null, 0);

  // Preserve malformed or cyclic data without resurfacing children hidden by
  // a collapsed ancestor as root folders.
  folders.forEach((folder) => {
    if (visited.has(folder.id)) return;
    const ancestors = new Set([folder.id]);
    let ancestorId = folder.parentId;
    while (ancestorId && !ancestors.has(ancestorId)) {
      if (visited.has(ancestorId)) return;
      ancestors.add(ancestorId);
      ancestorId = byId.get(ancestorId)?.parentId || null;
    }
    append(folder, 0);
  });

  return rows;
}

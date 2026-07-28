import { folderColors, STORAGE_KEYS, themes } from "./js/config.js";
import {
  collectFolderTreeIds,
  findFolder,
  flattenFolders,
  isFolderColor,
} from "./js/folders.js";
import {
  escapeHtml,
  formatBytes,
  formatListDate,
  formatLongDate,
  safeFilename,
} from "./js/formatters.js";
import {
  displayTitle,
  firstLineH1Title,
  firstMeaningfulLine,
  hasFirstLineH1,
  plainExcerpt,
} from "./js/notes.js";
import {
  getLocalStorageUsage,
  loadCollapsedFolders,
  loadFolders,
  loadNotes,
  persistCollapsedFolders,
} from "./js/storage.js";

const {
  activeNote: ACTIVE_KEY,
  collapsedFolders: COLLAPSED_FOLDERS_KEY,
  folders: FOLDERS_KEY,
  noteDensity: NOTE_DENSITY_KEY,
  notes: STORAGE_KEY,
  sidebarCollapsed: SIDEBAR_KEY,
  theme: THEME_KEY,
} = STORAGE_KEYS;

(() => {
  "use strict";

  const state = {
    notes: loadNotes(),
    folders: loadFolders(),
    activeId: localStorage.getItem(ACTIVE_KEY),
    filter: "all",
    folderFilter: null,
    query: "",
    sortAscending: false,
    view: "edit",
    noteDensity:
      document.documentElement.dataset.noteDensity === "compact"
        ? "compact"
        : "comfortable",
    collapsedFolderIds: loadCollapsedFolders(),
    sidebarCollapsed: document.documentElement.dataset.sidebar === "collapsed",
    theme: themes.some((theme) => theme.id === document.documentElement.dataset.theme)
      ? document.documentElement.dataset.theme
      : "paper",
    draggedNoteId: null,
    draggedFolderId: null,
    colorPickerFolderId: null,
    renamingFolderId: null,
    deletingFolderId: null,
    contextFolderId: null,
    contextMenuMode: "actions",
    contextMenuX: 0,
    contextMenuY: 0,
    contextNoteId: null,
    noteContextMode: "actions",
    noteContextX: 0,
    noteContextY: 0,
    pendingDeleteNoteId: null,
    saveTimer: null,
    lastEscapeAt: 0,
  };

  const el = {
    notesList: document.querySelector("#notes-list"),
    emptyList: document.querySelector("#empty-list"),
    emptyEditor: document.querySelector("#empty-editor"),
    editorShell: document.querySelector("#editor-shell"),
    updatedAt: document.querySelector("#updated-at"),
    folderChip: document.querySelector("#folder-chip"),
    folderList: document.querySelector("#folder-list"),
    allCount: document.querySelector("#all-count"),
    pinnedCount: document.querySelector("#pinned-count"),
    search: document.querySelector("#search-input"),
    listTitle: document.querySelector("#list-title"),
    listEyebrow: document.querySelector("#list-eyebrow"),
    pin: document.querySelector("#pin-button"),
    remove: document.querySelector("#delete-button"),
    editorWrap: document.querySelector("#editor-wrap"),
    preview: document.querySelector("#preview"),
    vimMode: document.querySelector("#vim-mode"),
    cursor: document.querySelector("#cursor-position"),
    wordCount: document.querySelector("#word-count"),
    syncState: document.querySelector("#sync-state"),
    storagePercentage: document.querySelector("#storage-percentage"),
    storageRemaining: document.querySelector("#storage-remaining"),
    storageMeter: document.querySelector(".storage-meter"),
    storageMeterBar: document.querySelector("#storage-meter-bar"),
    storageDetail: document.querySelector("#storage-detail"),
    navigation: document.querySelector("#navigation"),
    sidebarToggle: document.querySelector("#sidebar-toggle-button"),
    backdrop: document.querySelector("#mobile-backdrop"),
    editorPanel: document.querySelector("#editor-panel"),
    shortcutsDialog: document.querySelector("#shortcuts-dialog"),
    folderDialog: document.querySelector("#folder-dialog"),
    folderForm: document.querySelector("#folder-form"),
    folderInput: document.querySelector("#folder-input"),
    editableFolders: document.querySelector("#editable-folders"),
    folderContextMenu: document.querySelector("#folder-context-menu"),
    noteContextMenu: document.querySelector("#note-context-menu"),
    deleteNoteDialog: document.querySelector("#delete-note-dialog"),
    deleteNoteName: document.querySelector("#delete-note-name"),
    confirmDeleteNote: document.querySelector("#confirm-delete-note"),
    themeDialog: document.querySelector("#theme-dialog"),
    themeGrid: document.querySelector("#theme-grid"),
    toastRegion: document.querySelector("#toast-region"),
  };

  removeLegacyStarterNotes();
  migrateNoteTitles();
  migrateLegacyFolders();
  if (!state.notes.some((note) => note.id === state.activeId)) {
    state.activeId = state.notes[0]?.id ?? null;
  }

  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  const editor = CodeMirror.fromTextArea(document.querySelector("#markdown-editor"), {
    mode: "markdown",
    theme: "default",
    keyMap: "vim",
    lineNumbers: true,
    lineWrapping: true,
    tabSize: 2,
    indentUnit: 2,
    indentWithTabs: false,
    smartIndent: true,
    showCursorWhenSelecting: true,
    inputStyle: "textarea",
    extraKeys: {
      Tab(cm) {
        cm.replaceSelection("  ", "end");
      },
    },
  });

  CodeMirror.Vim.map("jj", "<Esc>", "insert");
  CodeMirror.Vim.defineEx("write", "w", () => {
    saveActiveNow();
    toast("Note saved");
  });
  CodeMirror.Vim.defineEx("nohlsearch", "noh", () => clearSearchHighlight());

  // Data migration and persistence -------------------------------------------
  function migrateLegacyFolders() {
    let changed = false;
    const legacyDefaultNames = {
      "folder-inbox": "\u53d7\u4fe1\u30c8\u30ec\u30a4",
      "folder-work": "\u4ed5\u4e8b",
      "folder-personal": "\u500b\u4eba",
    };
    const englishDefaultNames = {
      "folder-inbox": "Inbox",
      "folder-work": "Work",
      "folder-personal": "Personal",
    };
    state.folders.forEach((folder) => {
      if (folder.name === legacyDefaultNames[folder.id]) {
        folder.name = englishDefaultNames[folder.id];
        changed = true;
      }
    });
    state.notes.forEach((note) => {
      if (!note.folderId) {
        const legacyName = note.tags?.[0]?.trim() || "Inbox";
        let folder = state.folders.find((item) => item.name === legacyName);
        if (!folder) {
          folder = {
            id: crypto.randomUUID(),
            name: legacyName,
            color: folderColors[state.folders.length % folderColors.length].value,
            parentId: null,
          };
          state.folders.push(folder);
        }
        note.folderId = folder.id;
        changed = true;
      }
      if (!state.folders.some((folder) => folder.id === note.folderId)) {
        note.folderId = state.folders[0].id;
        changed = true;
      }
      if ("tags" in note) {
        delete note.tags;
        changed = true;
      }
    });
    if (changed) persist();
  }

  function removeLegacyStarterNotes() {
    const legacySamples = [
      {
        title: "VimNote \u3078\u3088\u3046\u3053\u305d",
        phrases: [
          "VimNote \u3078\u3088\u3046\u3053\u305d",
          "Vim \u3067\u7de8\u96c6\u3059\u308b",
        ],
      },
      {
        title: "\u4eca\u9031\u306e\u30d5\u30a9\u30fc\u30ab\u30b9",
        phrases: [
          "\u4eca\u9031\u3084\u308b\u3053\u3068",
          "\u5927\u304d\u306a\u76ee\u6a19\u3092\u3001\u4eca\u65e5\u3067\u304d\u308b\u5358\u4f4d\u307e\u3067\u5c0f\u3055\u304f\u3059\u308b\u3002",
        ],
      },
      {
        title: "\u8aad\u307f\u305f\u3044\u672c",
        phrases: [
          "\u8aad\u66f8\u30ea\u30b9\u30c8",
          "\u5c0f\u3055\u306a\u7fd2\u6163\u306b\u3064\u3044\u3066",
        ],
      },
    ];
    const previousLength = state.notes.length;
    state.notes = state.notes.filter(
      (note) =>
        !legacySamples.some(
          (sample) =>
            note.title === sample.title &&
            sample.phrases.every((phrase) => note.content?.includes(phrase)),
        ),
    );
    if (state.notes.length !== previousLength) persist();
  }

  function migrateNoteTitles() {
    let changed = false;
    state.notes.forEach((note) => {
      const originalContent = typeof note.content === "string" ? note.content : "";
      let content = originalContent;
      if (!hasFirstLineH1(content)) {
        const legacyTitle = note.title?.trim() || firstMeaningfulLine(content);
        if (legacyTitle) {
          const lines = content.split("\n");
          if (lines[0]?.trim() === legacyTitle) {
            lines[0] = `# ${legacyTitle}`;
            content = lines.join("\n");
          } else {
            content = `# ${legacyTitle}${content ? `\n\n${content}` : "\n"}`;
          }
        }
      }
      const title = firstLineH1Title(content);
      if (note.content !== content || note.title !== title) {
        note.content = content;
        note.title = title;
        changed = true;
      }
    });
    if (changed) persist();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(state.folders));
      if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
      setSavedState(true);
      void updateStorageStatus();
    } catch (error) {
      setSavedState(false);
      toast("Not enough storage space");
      console.error(error);
    }
  }

  function setSavedState(saved) {
    if (!el.syncState) return;
    el.syncState.querySelector("span:last-child").textContent = saved
      ? "Saved on this device"
      : "Could not save";
    el.syncState.querySelector(".save-dot").style.background = saved
      ? "var(--success)"
      : "var(--danger)";
    el.syncState.querySelector(".save-dot").style.boxShadow = saved
      ? "0 0 0 3px var(--success-soft)"
      : "0 0 0 3px var(--danger-soft)";
  }

  // Note commands and filtering ----------------------------------------------
  function getActiveNote() {
    return state.notes.find((note) => note.id === state.activeId) || null;
  }

  function saveActiveNow() {
    const note = getActiveNote();
    if (!note || editor._loadingNote) return;
    note.content = editor.getValue();
    note.title = firstLineH1Title(note.content);
    note.updatedAt = Date.now();
    persist();
    renderNoteList();
    updateMeta(note);
  }

  function scheduleSave() {
    setSavedState(false);
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveActiveNow, 260);
  }

  function createNote() {
    saveActiveNow();
    const now = Date.now();
    const note = {
      id: crypto.randomUUID(),
      title: "",
      content: "# ",
      folderId: state.folderFilter || state.folders[0].id,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    state.notes.unshift(note);
    state.activeId = note.id;
    state.filter = "all";
    persist();
    render();
    openEditorOnMobile();
    setTimeout(() => {
      editor.setCursor({ line: 0, ch: 2 });
      editor.focus();
      if (!editor.state.vim?.insertMode) CodeMirror.Vim.handleKey(editor, "i");
    }, 0);
    toast("New note created");
  }

  function openDeleteNoteDialog(noteId = state.activeId) {
    saveActiveNow();
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    state.pendingDeleteNoteId = note.id;
    el.deleteNoteName.textContent = displayTitle(note);
    el.deleteNoteDialog.showModal();
  }

  function deleteActiveNote() {
    const noteId = state.pendingDeleteNoteId || state.activeId;
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    el.deleteNoteDialog.close();
    const index = state.notes.findIndex((item) => item.id === note.id);
    state.notes.splice(index, 1);
    if (state.activeId === note.id) {
      state.activeId = state.notes[index]?.id || state.notes[index - 1]?.id || null;
    }
    state.pendingDeleteNoteId = null;
    persist();
    render();
    if (!state.activeId) closeEditorOnMobile();
    toast("Note deleted");
  }

  function togglePin(noteId = state.activeId) {
    saveActiveNow();
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    persist();
    renderNavigation();
    renderNoteList();
    const activeNote = getActiveNote();
    if (activeNote) updateMeta(activeNote);
    lucide.createIcons();
    toast(note.pinned ? "Note pinned" : "Note unpinned");
  }

  function selectNote(id) {
    if (id === state.activeId) {
      openEditorOnMobile();
      return;
    }
    saveActiveNow();
    state.activeId = id;
    localStorage.setItem(ACTIVE_KEY, id);
    loadActiveNote();
    renderNoteList();
    openEditorOnMobile();
  }

  function filteredNotes() {
    const query = state.query.trim().toLocaleLowerCase("en-US");
    const visibleFolderIds = state.folderFilter
      ? getFolderTreeIds(state.folderFilter)
      : null;
    const list = state.notes.filter((note) => {
      const matchesType = state.filter === "all" || note.pinned;
      const matchesFolder = !visibleFolderIds || visibleFolderIds.has(note.folderId);
      const folderName = getFolder(note.folderId)?.name || "";
      const haystack = `${displayTitle(note)} ${note.content} ${folderName}`.toLocaleLowerCase(
        "en-US",
      );
      return matchesType && matchesFolder && (!query || haystack.includes(query));
    });
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return state.sortAscending ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt;
    });
  }

  // Top-level rendering and appearance ---------------------------------------
  function render() {
    applyTheme(state.theme, false);
    syncNoteDensity();
    syncSidebar();
    renderNavigation();
    renderNoteList();
    loadActiveNote();
    renderThemeChoices();
    void updateStorageStatus();
    lucide.createIcons();
  }

  async function updateStorageStatus() {
    const fallbackQuota = 5 * 1024 * 1024;
    let usage = getLocalStorageUsage();
    let quota = fallbackQuota;
    let estimatedByBrowser = false;

    try {
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        if (Number.isFinite(estimate.quota) && estimate.quota > 0) {
          quota = estimate.quota;
          usage = Math.max(usage, Number(estimate.usage) || 0);
          estimatedByBrowser = true;
        }
      }
    } catch {
      // Fall back to the measured localStorage payload and a 5 MiB reference quota.
    }

    const remaining = Math.max(0, quota - usage);
    const percentage = Math.min(100, quota ? (usage / quota) * 100 : 0);
    const visiblePercentage = usage > 0 ? Math.max(2, percentage) : 0;
    const percentageLabel =
      percentage > 0 && percentage < 0.1 ? "<0.1%" : `${percentage.toFixed(1)}%`;

    el.storageRemaining.textContent = `${formatBytes(remaining)} available`;
    el.storagePercentage.textContent = percentageLabel;
    el.storageDetail.textContent = `${formatBytes(usage)} used / ${formatBytes(quota)} ${
      estimatedByBrowser ? "available" : "estimated"
    }`;
    el.storageMeterBar.style.width = `${visiblePercentage}%`;
    el.storageMeter.setAttribute("aria-valuenow", String(Math.round(percentage)));
    el.storageMeter.setAttribute(
      "aria-valuetext",
      `${percentageLabel} used, ${formatBytes(remaining)} available`,
    );
  }

  function applyTheme(themeId, announce = true) {
    const theme = themes.find((item) => item.id === themeId) || themes[0];
    state.theme = theme.id;
    document.documentElement.dataset.theme = theme.id;
    try {
      localStorage.setItem(THEME_KEY, theme.id);
    } catch {
      // The visual theme still works for this session when storage is unavailable.
    }
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme.colors[0]);
    renderThemeChoices();
    if (announce) toast(`Theme changed to ${theme.name}`);
  }

  function setNoteDensity(density, announce = true) {
    state.noteDensity = density === "compact" ? "compact" : "comfortable";
    document.documentElement.dataset.noteDensity = state.noteDensity;
    try {
      localStorage.setItem(NOTE_DENSITY_KEY, state.noteDensity);
    } catch {
      // Keep the current-session density when storage is unavailable.
    }
    syncNoteDensity();
    if (announce) {
      toast(
        state.noteDensity === "compact"
          ? "Compact note list enabled"
          : "Comfortable note list enabled",
      );
    }
  }

  function syncNoteDensity() {
    document.documentElement.dataset.noteDensity = state.noteDensity;
    document
      .querySelectorAll("[data-note-density-option]")
      .forEach((button) => {
        const active = button.dataset.noteDensityOption === state.noteDensity;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });
  }

  function renderThemeChoices() {
    if (!el.themeGrid) return;
    el.themeGrid.replaceChildren(
      ...themes.map((theme) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `theme-choice${state.theme === theme.id ? " is-active" : ""}`;
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", String(state.theme === theme.id));
        button.innerHTML = `
          <span class="theme-preview" aria-hidden="true" style="--swatch-bg:${theme.colors[0]};--swatch-ink:${theme.colors[1]};--swatch-accent:${theme.colors[2]}">
            <span></span><span></span><span></span>
          </span>
          <span class="min-w-0 text-left">
            <strong>${theme.name}</strong>
            <small>${theme.description}</small>
          </span>
          <i data-lucide="check" aria-hidden="true"></i>`;
        button.addEventListener("click", () => {
          applyTheme(theme.id);
          lucide.createIcons();
        });
        return button;
      }),
    );
    lucide.createIcons();
  }

  // Navigation, note list, and editor rendering ------------------------------
  function renderNavigation() {
    el.allCount.textContent = state.notes.length;
    el.pinnedCount.textContent = state.notes.filter((note) => note.pinned).length;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.filter === state.filter && !state.folderFilter,
      );
    });

    el.folderList.replaceChildren(
      ...flattenedFolders({ respectCollapsed: true })
        .map(({ folder, depth, hasChildren, collapsed }) => ({
          ...folder,
          depth,
          hasChildren,
          collapsed,
          count: folderTreeNoteCount(folder.id),
        }))
        .map((folder) => {
          const row = document.createElement("div");
          row.className = "folder-tree-row";
          row.style.setProperty("--folder-color", folder.color);
          row.style.setProperty("--folder-indent", `${folder.depth * 12}px`);
          row.dataset.depth = folder.depth;
          row.dataset.folderId = folder.id;

          const button = document.createElement("button");
          button.type = "button";
          button.draggable = true;
          button.className = `nav-item folder-nav-item${
            state.folderFilter === folder.id ? " is-active" : ""
          }`;
          button.dataset.folderId = folder.id;
          button.setAttribute(
            "aria-label",
            `${folder.name}, ${folder.count} ${
              folder.count === 1 ? "note" : "notes"
            }. Drag to move this folder. Drop a note or folder here to move it`,
          );
          button.innerHTML = `
            <span class="folder-tree-label">
              <i data-lucide="${
                folder.hasChildren && !folder.collapsed ? "folder-open" : "folder"
              }" aria-hidden="true"></i>
              <span>${escapeHtml(folder.name)}</span>
            </span>
            <span class="nav-count">${folder.count}</span>`;
          const disclosure = document.createElement(
            folder.hasChildren ? "button" : "span",
          );
          disclosure.className = `folder-disclosure${
            folder.hasChildren ? "" : " is-placeholder"
          }`;
          if (folder.hasChildren) {
            disclosure.type = "button";
            disclosure.setAttribute(
              "aria-label",
              `${folder.collapsed ? "Expand" : "Collapse"} ${folder.name}`,
            );
            disclosure.setAttribute("aria-expanded", String(!folder.collapsed));
            disclosure.innerHTML = `<i data-lucide="chevron-${
              folder.collapsed ? "right" : "down"
            }" aria-hidden="true"></i>`;
            disclosure.addEventListener("click", (event) => {
              event.stopPropagation();
              toggleFolderCollapsed(folder.id);
            });
          }
          row.append(disclosure, button);
          button.addEventListener("click", () => {
            state.folderFilter = folder.id;
            state.filter = "all";
            renderNavigation();
            renderNoteList();
            closeMobileMenu();
            lucide.createIcons();
          });
          row.addEventListener("contextmenu", (event) => {
            event.preventDefault();
            event.stopPropagation();
            openFolderContextMenu(folder.id, event.clientX, event.clientY);
          });
          button.addEventListener("dragstart", (event) => {
            closeFolderContextMenu();
            closeNoteContextMenu();
            state.draggedFolderId = folder.id;
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("application/x-vimnote-folder", folder.id);
            event.dataTransfer.setData("text/plain", `folder:${folder.id}`);
            document.documentElement.classList.add("is-folder-dragging");
            requestAnimationFrame(() => row.classList.add("is-folder-dragging-source"));
          });
          button.addEventListener("dragend", cleanupFolderDrag);
          row.addEventListener("dragenter", (event) => {
            if (!state.draggedFolderId) return;
            event.preventDefault();
            const invalid = Boolean(
              folderMoveError(state.draggedFolderId, folder.id),
            );
            row.classList.toggle("is-folder-drop-target", !invalid);
            row.classList.toggle("is-folder-drop-invalid", invalid);
          });
          row.addEventListener("dragover", (event) => {
            if (!state.draggedFolderId) return;
            event.preventDefault();
            event.stopPropagation();
            const invalid = Boolean(
              folderMoveError(state.draggedFolderId, folder.id),
            );
            event.dataTransfer.dropEffect = invalid ? "none" : "move";
            row.classList.toggle("is-folder-drop-target", !invalid);
            row.classList.toggle("is-folder-drop-invalid", invalid);
          });
          row.addEventListener("dragleave", (event) => {
            if (!row.contains(event.relatedTarget)) {
              row.classList.remove(
                "is-folder-drop-target",
                "is-folder-drop-invalid",
              );
            }
          });
          row.addEventListener("drop", (event) => {
            if (!state.draggedFolderId) return;
            event.preventDefault();
            event.stopPropagation();
            const folderId = state.draggedFolderId;
            cleanupFolderDrag();
            moveFolderToParent(folderId, folder.id);
          });
          button.addEventListener("dragenter", (event) => {
            if (!state.draggedNoteId) return;
            event.preventDefault();
            button.classList.add("is-drop-target");
          });
          button.addEventListener("dragover", (event) => {
            if (!state.draggedNoteId) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            button.classList.add("is-drop-target");
          });
          button.addEventListener("dragleave", (event) => {
            if (!button.contains(event.relatedTarget)) {
              button.classList.remove("is-drop-target");
            }
          });
          button.addEventListener("drop", (event) => {
            if (!state.draggedNoteId) return;
            event.preventDefault();
            const noteId = state.draggedNoteId || event.dataTransfer.getData("text/plain");
            cleanupNoteDrag();
            moveNoteToFolder(noteId, folder.id);
          });
          return row;
        }),
    );
  }

  function renderNoteList() {
    const notes = filteredNotes();
    el.notesList.replaceChildren(
      ...notes.map((note) => {
        const card = document.createElement("button");
        card.type = "button";
        card.draggable = true;
        card.className = `note-card${note.id === state.activeId ? " is-active" : ""}${
          note.id === state.contextNoteId ? " is-context-target" : ""
        }`;
        card.dataset.id = note.id;
        const pin = note.pinned ? '<i data-lucide="pin" aria-hidden="true"></i>' : "";
        const folder = getFolder(note.folderId);
        card.innerHTML = `
          <div class="note-title-row">
            <h3 class="note-card-title">${pin}${escapeHtml(displayTitle(note))}</h3>
            <time class="note-date">${formatListDate(note.updatedAt)}</time>
          </div>
          <p class="note-excerpt">${escapeHtml(plainExcerpt(note.content))}</p>
          ${folder ? `<span class="note-folder" style="--folder-color:${folder.color}"><i data-lucide="folder" aria-hidden="true"></i>${escapeHtml(folder.name)}</span>` : ""}
        `;
        card.addEventListener("click", () => selectNote(note.id));
        card.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          event.stopPropagation();
          openNoteContextMenu(note.id, event.clientX, event.clientY);
          card.classList.add("is-context-target");
        });
        card.addEventListener("dragstart", (event) => {
          state.draggedNoteId = note.id;
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", note.id);
          document.documentElement.classList.add("is-note-dragging");
          requestAnimationFrame(() => card.classList.add("is-dragging"));
        });
        card.addEventListener("dragend", cleanupNoteDrag);
        return card;
      }),
    );
    el.emptyList.classList.toggle("hidden", notes.length > 0);

    if (state.folderFilter) {
      el.listEyebrow.textContent = "Folder";
      el.listTitle.textContent = getFolder(state.folderFilter)?.name || "Folder";
    } else if (state.filter === "pinned") {
      el.listEyebrow.textContent = "Pinned";
      el.listTitle.textContent = "Pinned";
    } else {
      el.listEyebrow.textContent = "All notes";
      el.listTitle.textContent = "All notes";
    }
    lucide.createIcons();
  }

  function loadActiveNote() {
    const note = getActiveNote();
    el.emptyEditor.classList.toggle("hidden", Boolean(note));
    el.editorShell.classList.toggle("hidden", !note);
    if (!note) return;

    editor._loadingNote = true;
    editor.setValue(note.content || "");
    editor.clearHistory();
    editor.setCursor({ line: 0, ch: 0 });
    editor._loadingNote = false;
    updateMeta(note);
    renderFolderChip(note);
    renderPreview(note);
    requestAnimationFrame(() => editor.refresh());
  }

  function updateMeta(note) {
    el.updatedAt.textContent = `Updated ${formatLongDate(note.updatedAt)}`;
    el.pin.classList.toggle("is-active", note.pinned);
    el.pin.setAttribute("aria-pressed", String(note.pinned));
    const length = [...(editor.getValue() || "")].length;
    el.wordCount.textContent = `${length.toLocaleString("en-US")} characters`;
  }

  // Folder tree operations ---------------------------------------------------
  function getFolder(folderId) {
    return findFolder(state.folders, folderId);
  }

  function getFolderTreeIds(folderId) {
    return collectFolderTreeIds(state.folders, folderId);
  }

  function flattenedFolders({ respectCollapsed = false } = {}) {
    return flattenFolders(state.folders, state.collapsedFolderIds, {
      respectCollapsed,
    });
  }

  function toggleFolderCollapsed(folderId) {
    const hasChildren = state.folders.some((folder) => folder.parentId === folderId);
    if (!hasChildren) return;
    if (state.collapsedFolderIds.has(folderId)) {
      state.collapsedFolderIds.delete(folderId);
    } else {
      state.collapsedFolderIds.add(folderId);
    }
    persistCollapsedFolders(state.collapsedFolderIds);
    renderNavigation();
    lucide.createIcons();
  }

  function folderTreeNoteCount(folderId) {
    const ids = getFolderTreeIds(folderId);
    return state.notes.filter((note) => ids.has(note.folderId)).length;
  }

  function renderFolderChip(note) {
    const folder = getFolder(note.folderId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "folder-chip";
    button.style.setProperty("--folder-color", folder?.color || "var(--coral)");
    button.innerHTML = `
      <i data-lucide="folder" aria-hidden="true"></i>
      <span>${escapeHtml(folder?.name || "Choose a folder")}</span>
      <i data-lucide="chevron-down" aria-hidden="true"></i>`;
    button.addEventListener("click", openFolderDialog);
    el.folderChip.replaceChildren(button);
    lucide.createIcons();
  }

  function renderPreview(note = getActiveNote()) {
    if (!note) return;
    const dirtyContent = editor.getValue();
    el.preview.innerHTML = DOMPurify.sanitize(marked.parse(dirtyContent));
    el.preview.querySelectorAll("pre code").forEach((block) => hljs.highlightElement(block));
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll("[data-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === view);
    });
    const previewing = view === "preview";
    el.editorWrap.classList.toggle("hidden", previewing);
    el.preview.classList.toggle("hidden", !previewing);
    if (previewing) {
      renderPreview();
    } else {
      requestAnimationFrame(() => {
        editor.refresh();
        editor.focus();
      });
    }
  }

  // Folder management --------------------------------------------------------
  function openFolderDialog() {
    state.colorPickerFolderId = null;
    state.renamingFolderId = null;
    state.deletingFolderId = null;
    renderEditableFolders();
    el.folderDialog.showModal();
    setTimeout(() => el.folderInput.focus(), 0);
  }

  function renderEditableFolders() {
    const note = getActiveNote();
    el.editableFolders.replaceChildren(
      ...flattenedFolders().map(({ folder, depth }) => {
        const count = folderTreeNoteCount(folder.id);
        const row = document.createElement("div");
        row.className = `folder-manager-row${note?.folderId === folder.id ? " is-current" : ""}`;
        row.style.setProperty("--folder-color", folder.color);
        row.style.setProperty("--folder-depth", depth);
        row.style.setProperty("--folder-indent", `${depth * 13}px`);
        row.dataset.depth = depth;
        row.addEventListener("contextmenu", (event) => {
          event.preventDefault();
          openFolderContextMenu(
            folder.id,
            event.clientX,
            event.clientY,
            el.folderDialog,
          );
        });
        const palette = folderColors
          .map(
            (color) => `
              <button
                class="folder-color-swatch${folder.color === color.value ? " is-selected" : ""}"
                type="button"
                data-color="${color.value}"
                style="--swatch:${color.value}"
                aria-label="${color.name}"
                title="${color.name}"
              ></button>`,
          )
          .join("");
        row.innerHTML = `
          <button class="folder-select" type="button" ${note ? "" : "disabled"}>
            <span class="folder-manager-indent" aria-hidden="true"></span>
            <i data-lucide="${note?.folderId === folder.id ? "folder-check" : "folder"}" aria-hidden="true"></i>
            <span class="min-w-0 flex-1 truncate text-left">${escapeHtml(folder.name)}</span>
            <span class="folder-count">${count}</span>
          </button>
          <button class="mini-icon-button folder-color-button" type="button" aria-label="Change ${escapeHtml(folder.name)} color" data-tooltip="Color">
            <i data-lucide="palette" aria-hidden="true"></i>
          </button>
          <button class="mini-icon-button rename-folder" type="button" aria-label="Rename ${escapeHtml(folder.name)}" data-tooltip="Rename">
            <i data-lucide="pencil" aria-hidden="true"></i>
          </button>
          <button class="mini-icon-button delete-folder danger-hover" type="button" aria-label="Delete ${escapeHtml(folder.name)}" data-tooltip="Delete folder">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
          ${
            state.colorPickerFolderId === folder.id
              ? `<div class="folder-color-palette" role="group" aria-label="${escapeHtml(folder.name)} color palette">${palette}</div>`
              : ""
          }
          ${
            state.renamingFolderId === folder.id
              ? `<form class="folder-rename-form">
                  <input class="text-input folder-rename-input" maxlength="32" aria-label="New name for ${escapeHtml(folder.name)}" />
                  <button class="secondary-button cancel-folder-action" type="button">Cancel</button>
                  <button class="primary-button" type="submit">Save</button>
                </form>`
              : ""
          }
          ${
            state.deletingFolderId === folder.id
              ? `<div class="folder-delete-confirm">
                  <p>${
                    count
                      ? `${count} ${count === 1 ? "note" : "notes"} in this folder tree will be moved safely.`
                      : "This folder tree is empty."
                  }</p>
                  <button class="secondary-button cancel-folder-action" type="button">Cancel</button>
                  <button class="destructive-button confirm-folder-delete" type="button">Delete</button>
                </div>`
              : ""
          }`;
        row.querySelector(".folder-select").addEventListener("click", () => {
          moveActiveToFolder(folder.id);
          renderEditableFolders();
        });
        row.querySelector(".folder-color-button").addEventListener("click", () => {
          state.colorPickerFolderId =
            state.colorPickerFolderId === folder.id ? null : folder.id;
          state.renamingFolderId = null;
          state.deletingFolderId = null;
          renderEditableFolders();
        });
        row.querySelectorAll(".folder-color-swatch").forEach((swatch) => {
          swatch.addEventListener("click", () => updateFolderColor(folder.id, swatch.dataset.color));
        });
        row.querySelector(".rename-folder").addEventListener("click", () => {
          state.renamingFolderId = folder.id;
          state.colorPickerFolderId = null;
          state.deletingFolderId = null;
          renderEditableFolders();
          const input = el.editableFolders.querySelector(".folder-rename-input");
          if (input) {
            input.value = folder.name;
            input.focus();
            input.select();
          }
        });
        row.querySelector(".delete-folder").addEventListener("click", () => {
          if (getFolderTreeIds(folder.id).size === state.folders.length) {
            toast("The last folder tree cannot be deleted");
            return;
          }
          state.deletingFolderId = folder.id;
          state.colorPickerFolderId = null;
          state.renamingFolderId = null;
          renderEditableFolders();
        });
        const renameForm = row.querySelector(".folder-rename-form");
        if (renameForm) {
          const input = renameForm.querySelector(".folder-rename-input");
          input.value = folder.name;
          renameForm.addEventListener("submit", (event) => {
            event.preventDefault();
            renameFolder(folder.id, input.value);
          });
        }
        row.querySelectorAll(".cancel-folder-action").forEach((button) => {
          button.addEventListener("click", () => {
            state.renamingFolderId = null;
            state.deletingFolderId = null;
            renderEditableFolders();
          });
        });
        row
          .querySelector(".confirm-folder-delete")
          ?.addEventListener("click", () => deleteFolder(folder.id));
        return row;
      }),
    );
    lucide.createIcons();
  }

  function addFolder(value, parentId = null, moveActiveNote = true) {
    const name = value.trim();
    if (!name) return null;
    const parent = parentId ? getFolder(parentId) : null;
    if (
      state.folders.some(
        (folder) =>
          folder.parentId === (parent?.id || null) &&
          folder.name.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US"),
      )
    ) {
      toast("A folder with that name already exists here");
      return null;
    }
    const folder = {
      id: crypto.randomUUID(),
      name,
      color:
        parent?.color ||
        folderColors[state.folders.length % folderColors.length].value,
      parentId: parent?.id || null,
    };
    state.folders.push(folder);
    if (parent) {
      state.collapsedFolderIds.delete(parent.id);
      persistCollapsedFolders(state.collapsedFolderIds);
    }
    const note = getActiveNote();
    if (note && moveActiveNote) {
      note.folderId = folder.id;
      note.updatedAt = Date.now();
      if (state.folderFilter) state.folderFilter = folder.id;
    }
    persist();
    renderNavigation();
    renderNoteList();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    toast(`Created “${name}”`);
    return folder;
  }

  function moveActiveToFolder(folderId) {
    moveNoteToFolder(state.activeId, folderId, true);
  }

  function updateFolderColor(folderId, color) {
    const folder = getFolder(folderId);
    if (
      !folder ||
      !isFolderColor(color, folderColors) ||
      folder.color === color
    ) {
      return;
    }
    folder.color = color;
    persist();
    renderNavigation();
    renderNoteList();
    const note = getActiveNote();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    toast(`Changed the color of “${folder.name}”`);
  }

  function moveNoteToFolder(noteId, folderId, followFolder = false) {
    const note = state.notes.find((item) => item.id === noteId);
    const folder = getFolder(folderId);
    if (!note || !folder || note.folderId === folderId) return;
    note.folderId = folderId;
    note.updatedAt = Date.now();
    if (followFolder && state.folderFilter) state.folderFilter = folderId;
    persist();
    renderNavigation();
    renderNoteList();
    if (note.id === state.activeId) renderFolderChip(note);
    toast(`Moved “${displayTitle(note)}” to “${folder.name}”`);
  }

  function folderMoveError(folderId, parentId) {
    const folder = getFolder(folderId);
    const parent = parentId ? getFolder(parentId) : null;
    if (!folder || (parentId && !parent)) return "Folder not found";
    if (folder.parentId === (parent?.id || null)) {
      return parent ? `“${folder.name}” is already in “${parent.name}”` : "Folder is already at root";
    }
    if (parent && getFolderTreeIds(folder.id).has(parent.id)) {
      return "A folder cannot be moved into itself or its subfolders";
    }
    const duplicate = state.folders.some(
      (item) =>
        item.id !== folder.id &&
        item.parentId === (parent?.id || null) &&
        item.name.toLocaleLowerCase("en-US") ===
          folder.name.toLocaleLowerCase("en-US"),
    );
    if (duplicate) {
      return `“${parent?.name || "Folders"}” already contains “${folder.name}”`;
    }
    return "";
  }

  function moveFolderToParent(folderId, parentId = null) {
    const folder = getFolder(folderId);
    if (!folder) return;
    const error = folderMoveError(folderId, parentId);
    if (error) {
      toast(error);
      return;
    }
    const parent = parentId ? getFolder(parentId) : null;
    folder.parentId = parent?.id || null;
    if (parent) state.collapsedFolderIds.delete(parent.id);
    persistCollapsedFolders(state.collapsedFolderIds);
    persist();
    renderNavigation();
    renderEditableFolders();
    lucide.createIcons();
    toast(
      parent
        ? `Moved “${folder.name}” into “${parent.name}”`
        : `Moved “${folder.name}” to root`,
    );
  }

  function cleanupFolderDrag() {
    state.draggedFolderId = null;
    document.documentElement.classList.remove("is-folder-dragging");
    document
      .querySelectorAll(
        ".is-folder-dragging-source, .is-folder-drop-target, .is-folder-drop-invalid, .is-root-drop-target",
      )
      .forEach((element) =>
        element.classList.remove(
          "is-folder-dragging-source",
          "is-folder-drop-target",
          "is-folder-drop-invalid",
          "is-root-drop-target",
        ),
      );
  }

  function cleanupNoteDrag() {
    state.draggedNoteId = null;
    document.documentElement.classList.remove("is-note-dragging");
    document
      .querySelectorAll(".is-dragging, .is-drop-target")
      .forEach((element) => element.classList.remove("is-dragging", "is-drop-target"));
  }

  function renameFolder(folderId, value) {
    const folder = getFolder(folderId);
    if (!folder) return;
    const name = value?.trim();
    if (!name || name === folder.name) return;
    if (
      state.folders.some(
        (item) =>
          item.id !== folder.id &&
          item.parentId === folder.parentId &&
          item.name.toLocaleLowerCase("en-US") === name.toLocaleLowerCase("en-US"),
      )
    ) {
      toast("A folder with that name already exists here");
      return;
    }
    folder.name = name;
    state.renamingFolderId = null;
    persist();
    renderNavigation();
    renderNoteList();
    const note = getActiveNote();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    toast("Folder renamed");
  }

  function deleteFolder(folderId) {
    const folder = getFolder(folderId);
    if (!folder) return;
    const treeIds = getFolderTreeIds(folderId);
    if (treeIds.size === state.folders.length) {
      toast("The last folder tree cannot be deleted");
      return;
    }
    const fallback =
      state.folders.find((item) => item.id === folder.parentId && !treeIds.has(item.id)) ||
      state.folders.find((item) => !treeIds.has(item.id));
    state.notes.forEach((note) => {
      if (treeIds.has(note.folderId)) note.folderId = fallback.id;
    });
    state.folders = state.folders.filter((item) => !treeIds.has(item.id));
    treeIds.forEach((id) => state.collapsedFolderIds.delete(id));
    persistCollapsedFolders(state.collapsedFolderIds);
    if (treeIds.has(state.colorPickerFolderId)) state.colorPickerFolderId = null;
    if (treeIds.has(state.renamingFolderId)) state.renamingFolderId = null;
    state.deletingFolderId = null;
    if (treeIds.has(state.folderFilter)) state.folderFilter = fallback.id;
    persist();
    renderNavigation();
    renderNoteList();
    const note = getActiveNote();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    closeFolderContextMenu();
    toast(`Deleted “${folder.name}” and its subfolders`);
  }

  function uniqueFolderName(baseName, parentId) {
    const existing = new Set(
      state.folders
        .filter((folder) => folder.parentId === parentId)
        .map((folder) => folder.name.toLocaleLowerCase("en-US")),
    );
    if (!existing.has(baseName.toLocaleLowerCase("en-US"))) return baseName;
    let suffix = 2;
    while (existing.has(`${baseName} ${suffix}`.toLocaleLowerCase("en-US"))) suffix += 1;
    return `${baseName} ${suffix}`;
  }

  function duplicateFolderTree(folderId) {
    const source = getFolder(folderId);
    if (!source) return;
    saveActiveNow();
    const treeIds = getFolderTreeIds(folderId);
    const idMap = new Map();
    const clones = [];
    flattenedFolders()
      .map(({ folder }) => folder)
      .filter((folder) => treeIds.has(folder.id))
      .forEach((folder) => {
        const id = crypto.randomUUID();
        idMap.set(folder.id, id);
        clones.push({
          id,
          name:
            folder.id === source.id
              ? uniqueFolderName(`${source.name} copy`, source.parentId)
              : folder.name,
          color: folder.color,
          parentId:
            folder.id === source.id
              ? source.parentId
              : idMap.get(folder.parentId) || source.parentId,
        });
      });
    state.folders.push(...clones);
    const now = Date.now();
    const noteClones = state.notes
      .filter((note) => treeIds.has(note.folderId))
      .map((note, index) => ({
        ...note,
        id: crypto.randomUUID(),
        folderId: idMap.get(note.folderId),
        createdAt: now + index,
        updatedAt: now + index,
      }));
    state.notes.unshift(...noteClones);
    if (source.parentId) {
      state.collapsedFolderIds.delete(source.parentId);
      persistCollapsedFolders(state.collapsedFolderIds);
    }
    persist();
    renderNavigation();
    renderNoteList();
    renderEditableFolders();
    closeFolderContextMenu();
    toast(
      `Duplicated “${source.name}”${
        noteClones.length
          ? ` with ${noteClones.length} ${noteClones.length === 1 ? "note" : "notes"}`
          : ""
      }`,
    );
  }

  // Folder and note context menus --------------------------------------------
  function openFolderContextMenu(folderId, x, y, host = document.body) {
    closeNoteContextMenu();
    closeFolderContextMenu();
    host.append(el.folderContextMenu);
    state.contextFolderId = folderId;
    state.contextMenuMode = "actions";
    state.contextMenuX = x;
    state.contextMenuY = y;
    renderFolderContextMenu();
  }

  function closeFolderContextMenu() {
    state.contextFolderId = null;
    state.contextMenuMode = "actions";
    if (
      typeof el.folderContextMenu.hidePopover === "function" &&
      el.folderContextMenu.matches(":popover-open")
    ) {
      el.folderContextMenu.hidePopover();
    }
    el.folderContextMenu.classList.add("hidden");
    el.folderContextMenu.replaceChildren();
  }

  function renderFolderContextMenu() {
    const folder = getFolder(state.contextFolderId);
    const hasChildren =
      folder && state.folders.some((item) => item.parentId === folder.id);
    const menu = el.folderContextMenu;
    const palette = folderColors
      .map(
        (color) => `
          <button
            class="folder-color-swatch${folder?.color === color.value ? " is-selected" : ""}"
            type="button"
            data-context-color="${color.value}"
            style="--swatch:${color.value}"
            aria-label="${color.name}"
            title="${color.name}"
          ></button>`,
      )
      .join("");

    let content = "";
    if (state.contextMenuMode === "create") {
      content = `
        <form class="context-inline-form" data-context-form="create">
          <label>${folder ? `New subfolder in “${escapeHtml(folder.name)}”` : "New folder"}</label>
          <input class="text-input" maxlength="32" placeholder="Folder name" autocomplete="off" />
          <div class="context-form-actions">
            <button class="secondary-button" type="button" data-context-action="back">Cancel</button>
            <button class="primary-button" type="submit">Create</button>
          </div>
        </form>`;
    } else if (state.contextMenuMode === "rename" && folder) {
      content = `
        <form class="context-inline-form" data-context-form="rename">
          <label>Rename “${escapeHtml(folder.name)}”</label>
          <input class="text-input" maxlength="32" autocomplete="off" />
          <div class="context-form-actions">
            <button class="secondary-button" type="button" data-context-action="back">Cancel</button>
            <button class="primary-button" type="submit">Save</button>
          </div>
        </form>`;
    } else if (state.contextMenuMode === "color" && folder) {
      content = `
        <div class="context-menu-panel">
          <div class="context-panel-heading">
            <button type="button" data-context-action="back" aria-label="Back"><i data-lucide="arrow-left"></i></button>
            <strong>Change color</strong>
          </div>
          <div class="context-color-grid" role="group" aria-label="${escapeHtml(folder.name)} color palette">${palette}</div>
        </div>`;
    } else if (state.contextMenuMode === "delete" && folder) {
      const treeSize = getFolderTreeIds(folder.id).size;
      const noteCount = folderTreeNoteCount(folder.id);
      content = `
        <div class="context-menu-panel">
          <strong>Delete “${escapeHtml(folder.name)}”?</strong>
          <p>${treeSize > 1 ? `${treeSize - 1} subfolders and ` : ""}${noteCount} ${
            noteCount === 1 ? "note" : "notes"
          } are included. Notes will move to a safe folder.</p>
          <div class="context-form-actions">
            <button class="secondary-button" type="button" data-context-action="back">Cancel</button>
            <button class="destructive-button" type="button" data-context-action="confirm-delete">Delete</button>
          </div>
        </div>`;
    } else {
      content = `
        <div class="context-menu-heading">
          <i data-lucide="${folder ? "folder" : "folders"}" aria-hidden="true"></i>
          <span>${folder ? escapeHtml(folder.name) : "Folders"}</span>
        </div>
        <button type="button" role="menuitem" data-context-action="create">
          <i data-lucide="folder-plus" aria-hidden="true"></i>
          ${folder ? "New subfolder" : "New folder"}
        </button>
        ${
          folder
            ? `
              ${
                hasChildren
                  ? `<button type="button" role="menuitem" data-context-action="toggle-collapse">
                      <i data-lucide="${
                        state.collapsedFolderIds.has(folder.id)
                          ? "chevrons-up-down"
                          : "chevrons-down-up"
                      }" aria-hidden="true"></i>
                      ${
                        state.collapsedFolderIds.has(folder.id)
                          ? "Expand subfolders"
                          : "Collapse subfolders"
                      }
                    </button>`
                  : ""
              }
              <button type="button" role="menuitem" data-context-action="rename">
                <i data-lucide="pencil" aria-hidden="true"></i>Rename
              </button>
              <button type="button" role="menuitem" data-context-action="color">
                <i data-lucide="palette" aria-hidden="true"></i>Change color
              </button>
              <button type="button" role="menuitem" data-context-action="duplicate">
                <i data-lucide="copy" aria-hidden="true"></i>Duplicate
              </button>
              <div class="context-menu-separator" role="separator"></div>
              <button class="is-danger" type="button" role="menuitem" data-context-action="delete">
                <i data-lucide="trash-2" aria-hidden="true"></i>Delete folder tree
              </button>`
            : ""
        }`;
    }

    menu.innerHTML = content;
    menu.classList.remove("hidden");
    if (
      typeof menu.showPopover === "function" &&
      !menu.matches(":popover-open")
    ) {
      menu.showPopover();
    }
    menu.querySelectorAll("[data-context-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.contextAction;
        if (action === "back") state.contextMenuMode = "actions";
        if (
          action === "delete" &&
          folder &&
          getFolderTreeIds(folder.id).size === state.folders.length
        ) {
          toast("The last folder tree cannot be deleted");
          closeFolderContextMenu();
          return;
        }
        if (["create", "rename", "color", "delete"].includes(action)) {
          state.contextMenuMode = action;
        }
        if (action === "duplicate" && folder) {
          duplicateFolderTree(folder.id);
          return;
        }
        if (action === "toggle-collapse" && folder) {
          toggleFolderCollapsed(folder.id);
          closeFolderContextMenu();
          return;
        }
        if (action === "confirm-delete" && folder) {
          deleteFolder(folder.id);
          return;
        }
        renderFolderContextMenu();
      });
    });
    menu.querySelectorAll("[data-context-color]").forEach((swatch) => {
      swatch.addEventListener("click", () => {
        updateFolderColor(folder.id, swatch.dataset.contextColor);
        closeFolderContextMenu();
      });
    });
    const createForm = menu.querySelector('[data-context-form="create"]');
    if (createForm) {
      const input = createForm.querySelector("input");
      createForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const created = addFolder(input.value, folder?.id || null, false);
        if (created) closeFolderContextMenu();
      });
      setTimeout(() => input.focus(), 0);
    }
    const renameForm = menu.querySelector('[data-context-form="rename"]');
    if (renameForm && folder) {
      const input = renameForm.querySelector("input");
      input.value = folder.name;
      renameForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const previousName = folder.name;
        renameFolder(folder.id, input.value);
        if (folder.name !== previousName) closeFolderContextMenu();
      });
      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    }
    requestAnimationFrame(() => {
      const margin = 8;
      const rect = menu.getBoundingClientRect();
      menu.style.left = `${Math.max(
        margin,
        Math.min(state.contextMenuX, window.innerWidth - rect.width - margin),
      )}px`;
      menu.style.top = `${Math.max(
        margin,
        Math.min(state.contextMenuY, window.innerHeight - rect.height - margin),
      )}px`;
    });
    lucide.createIcons();
  }

  function duplicateNote(noteId) {
    if (noteId === state.activeId) saveActiveNow();
    const source = state.notes.find((note) => note.id === noteId);
    if (!source) return;
    const sourceTitle = displayTitle(source);
    const copiedTitle =
      sourceTitle === "Untitled note" ? "Untitled copy" : `${sourceTitle} copy`;
    const lines = String(source.content || "").split("\n");
    if (hasFirstLineH1(source.content)) {
      lines[0] = `# ${copiedTitle}`;
    } else {
      lines.unshift(`# ${copiedTitle}`, "");
    }
    const now = Date.now();
    const copy = {
      ...source,
      id: crypto.randomUUID(),
      title: copiedTitle,
      content: lines.join("\n"),
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    const sourceIndex = state.notes.findIndex((note) => note.id === source.id);
    state.notes.splice(sourceIndex + 1, 0, copy);
    persist();
    renderNavigation();
    renderNoteList();
    closeNoteContextMenu();
    toast(`Duplicated “${sourceTitle}”`);
  }

  function openNoteContextMenu(noteId, x, y) {
    closeFolderContextMenu();
    closeNoteContextMenu();
    document.body.append(el.noteContextMenu);
    state.contextNoteId = noteId;
    state.noteContextMode = "actions";
    state.noteContextX = x;
    state.noteContextY = y;
    renderNoteContextMenu();
  }

  function closeNoteContextMenu() {
    state.contextNoteId = null;
    state.noteContextMode = "actions";
    if (
      typeof el.noteContextMenu.hidePopover === "function" &&
      el.noteContextMenu.matches(":popover-open")
    ) {
      el.noteContextMenu.hidePopover();
    }
    el.noteContextMenu.classList.add("hidden");
    el.noteContextMenu.replaceChildren();
    document
      .querySelectorAll(".note-card.is-context-target")
      .forEach((card) => card.classList.remove("is-context-target"));
  }

  function renderNoteContextMenu() {
    const note = state.notes.find((item) => item.id === state.contextNoteId);
    if (!note) {
      closeNoteContextMenu();
      return;
    }
    const menu = el.noteContextMenu;
    let content = "";
    if (state.noteContextMode === "move") {
      const folders = flattenedFolders()
        .map(
          ({ folder, depth }) => `
            <button
              type="button"
              class="context-folder-option${note.folderId === folder.id ? " is-current" : ""}"
              data-note-folder="${folder.id}"
              style="--folder-color:${folder.color};--folder-indent:${depth * 13}px"
              ${note.folderId === folder.id ? "disabled" : ""}
            >
              <span class="context-folder-indent" aria-hidden="true"></span>
              <i data-lucide="${note.folderId === folder.id ? "folder-check" : "folder"}" aria-hidden="true"></i>
              <span>${escapeHtml(folder.name)}</span>
            </button>`,
        )
        .join("");
      content = `
        <div class="context-menu-panel">
          <div class="context-panel-heading">
            <button type="button" data-note-context-action="back" aria-label="Back">
              <i data-lucide="arrow-left" aria-hidden="true"></i>
            </button>
            <strong>Move to folder</strong>
          </div>
          <div class="context-folder-list">${folders}</div>
        </div>`;
    } else {
      content = `
        <div class="context-menu-heading">
          <i data-lucide="file-text" aria-hidden="true"></i>
          <span>${escapeHtml(displayTitle(note))}</span>
        </div>
        <button type="button" role="menuitem" data-note-context-action="open">
          <i data-lucide="square-arrow-out-up-right" aria-hidden="true"></i>Open note
        </button>
        <button type="button" role="menuitem" data-note-context-action="pin">
          <i data-lucide="${note.pinned ? "pin-off" : "pin"}" aria-hidden="true"></i>
          ${note.pinned ? "Unpin" : "Pin"} note
        </button>
        <button type="button" role="menuitem" data-note-context-action="duplicate">
          <i data-lucide="copy" aria-hidden="true"></i>Duplicate
        </button>
        <button type="button" role="menuitem" data-note-context-action="move">
          <i data-lucide="folder-input" aria-hidden="true"></i>Move to folder
        </button>
        <button type="button" role="menuitem" data-note-context-action="export">
          <i data-lucide="download" aria-hidden="true"></i>Export Markdown
        </button>
        <div class="context-menu-separator" role="separator"></div>
        <button class="is-danger" type="button" role="menuitem" data-note-context-action="delete">
          <i data-lucide="trash-2" aria-hidden="true"></i>Delete note
        </button>`;
    }

    menu.innerHTML = content;
    menu.classList.remove("hidden");
    if (
      typeof menu.showPopover === "function" &&
      !menu.matches(":popover-open")
    ) {
      menu.showPopover();
    }
    menu.querySelectorAll("[data-note-context-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.noteContextAction;
        if (action === "back") {
          state.noteContextMode = "actions";
          renderNoteContextMenu();
          return;
        }
        if (action === "open") {
          closeNoteContextMenu();
          selectNote(note.id);
        }
        if (action === "pin") {
          togglePin(note.id);
          closeNoteContextMenu();
        }
        if (action === "duplicate") duplicateNote(note.id);
        if (action === "move") {
          state.noteContextMode = "move";
          renderNoteContextMenu();
        }
        if (action === "export") {
          exportNote(note.id);
          closeNoteContextMenu();
        }
        if (action === "delete") {
          closeNoteContextMenu();
          openDeleteNoteDialog(note.id);
        }
      });
    });
    menu.querySelectorAll("[data-note-folder]").forEach((button) => {
      button.addEventListener("click", () => {
        moveNoteToFolder(note.id, button.dataset.noteFolder);
        closeNoteContextMenu();
      });
    });
    requestAnimationFrame(() => {
      const margin = 8;
      const rect = menu.getBoundingClientRect();
      menu.style.left = `${Math.max(
        margin,
        Math.min(state.noteContextX, window.innerWidth - rect.width - margin),
      )}px`;
      menu.style.top = `${Math.max(
        margin,
        Math.min(state.noteContextY, window.innerHeight - rect.height - margin),
      )}px`;
    });
    lucide.createIcons();
  }

  // Export and responsive shell ----------------------------------------------
  function exportNote(noteId = state.activeId) {
    if (noteId === state.activeId) saveActiveNow();
    const note = state.notes.find((item) => item.id === noteId);
    if (!note) return;
    const blob = new Blob([note.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(displayTitle(note))}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast("Markdown exported");
  }

  function exportActiveNote() {
    exportNote(state.activeId);
  }

  function clearSearchHighlight() {
    try {
      CodeMirror.Vim.handleKey(editor, "<Esc>");
      editor.getAllMarks().forEach((mark) => mark.clear());
    } catch {
      // Search marks are internal to the Vim addon; Escape still closes active search.
    }
    toast("Search highlight cleared");
  }

  function toast(message) {
    const item = document.createElement("div");
    item.className = "toast";
    item.textContent = message;
    el.toastRegion.append(item);
    setTimeout(() => item.remove(), 2400);
  }

  function openMobileMenu() {
    el.navigation.classList.add("is-open");
    el.backdrop.classList.remove("hidden");
    syncSidebar();
  }

  function closeMobileMenu() {
    el.navigation.classList.remove("is-open");
    el.backdrop.classList.add("hidden");
    syncSidebar();
  }

  function toggleSidebar() {
    if (window.innerWidth <= 820) {
      if (el.navigation.classList.contains("is-open")) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
      return;
    }
    state.sidebarCollapsed = !state.sidebarCollapsed;
    document.documentElement.dataset.sidebar = state.sidebarCollapsed
      ? "collapsed"
      : "expanded";
    try {
      localStorage.setItem(SIDEBAR_KEY, String(state.sidebarCollapsed));
    } catch {
      // Keep the current-session state when storage is unavailable.
    }
    syncSidebar();
  }

  function syncSidebar() {
    const mobile = window.innerWidth <= 820;
    const collapsed = mobile
      ? !el.navigation.classList.contains("is-open")
      : state.sidebarCollapsed;
    el.sidebarToggle.setAttribute("aria-expanded", String(!collapsed));
    el.sidebarToggle.setAttribute(
      "aria-label",
      collapsed ? "Show sidebar" : "Hide sidebar",
    );
    el.sidebarToggle.dataset.tooltip = collapsed
      ? "Show sidebar"
      : "Hide sidebar";
    el.sidebarToggle.innerHTML = `<i data-lucide="${
      collapsed ? "panel-left-open" : "panel-left-close"
    }" aria-hidden="true"></i>`;
    lucide.createIcons();
  }

  function openEditorOnMobile() {
    if (window.innerWidth <= 640) el.editorPanel.classList.add("is-open");
  }

  function closeEditorOnMobile() {
    el.editorPanel.classList.remove("is-open");
  }

  // Event wiring -------------------------------------------------------------
  editor.on("change", () => {
    if (editor._loadingNote) return;
    scheduleSave();
    updateMeta(getActiveNote());
    if (state.view === "preview") renderPreview();
  });

  editor.on("cursorActivity", () => {
    const cursor = editor.getCursor();
    el.cursor.textContent = `${cursor.line + 1}:${cursor.ch + 1}`;
  });

  editor.on("vim-mode-change", (mode) => {
    el.vimMode.textContent = (mode.mode || "normal").toUpperCase();
  });

  editor.getWrapperElement().addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const now = Date.now();
    if (now - state.lastEscapeAt < 420) {
      clearSearchHighlight();
      state.lastEscapeAt = 0;
    } else {
      state.lastEscapeAt = now;
    }
  });

  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      state.folderFilter = null;
      renderNavigation();
      renderNoteList();
      closeMobileMenu();
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });
  document.querySelectorAll("[data-note-density-option]").forEach((button) => {
    button.addEventListener("click", () =>
      setNoteDensity(button.dataset.noteDensityOption),
    );
  });

  document
    .querySelectorAll("#new-note-button-header, #new-note-button-empty")
    .forEach((button) => button.addEventListener("click", createNote));

  el.sidebarToggle.addEventListener("click", toggleSidebar);
  el.backdrop.addEventListener("click", closeMobileMenu);
  el.pin.addEventListener("click", () => togglePin());
  el.remove.addEventListener("click", () => openDeleteNoteDialog());
  el.confirmDeleteNote.addEventListener("click", deleteActiveNote);
  el.deleteNoteDialog.addEventListener("close", () => {
    state.pendingDeleteNoteId = null;
  });
  document.querySelector("#export-button").addEventListener("click", exportActiveNote);
  document
    .querySelector("#shortcuts-button")
    .addEventListener("click", () => el.shortcutsDialog.showModal());
  document.querySelector("#theme-button").addEventListener("click", () => {
    renderThemeChoices();
    el.themeDialog.showModal();
  });
  document.querySelector("#manage-folders-button").addEventListener("click", openFolderDialog);
  el.folderList.addEventListener("contextmenu", (event) => {
    if (event.target.closest("[data-folder-id]")) return;
    event.preventDefault();
    openFolderContextMenu(null, event.clientX, event.clientY);
  });
  el.folderList.addEventListener("dragover", (event) => {
    if (
      !state.draggedFolderId ||
      event.target.closest(".folder-tree-row")
    ) {
      return;
    }
    event.preventDefault();
    const invalid = Boolean(folderMoveError(state.draggedFolderId, null));
    event.dataTransfer.dropEffect = invalid ? "none" : "move";
    el.folderList.classList.toggle("is-root-drop-target", !invalid);
  });
  el.folderList.addEventListener("dragleave", (event) => {
    if (!el.folderList.contains(event.relatedTarget)) {
      el.folderList.classList.remove("is-root-drop-target");
    }
  });
  el.folderList.addEventListener("drop", (event) => {
    if (
      !state.draggedFolderId ||
      event.target.closest(".folder-tree-row")
    ) {
      return;
    }
    event.preventDefault();
    const folderId = state.draggedFolderId;
    cleanupFolderDrag();
    moveFolderToParent(folderId, null);
  });
  el.editableFolders.addEventListener("contextmenu", (event) => {
    if (event.target.closest(".folder-manager-row")) return;
    event.preventDefault();
    openFolderContextMenu(null, event.clientX, event.clientY, el.folderDialog);
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  el.folderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addFolder(el.folderInput.value);
    el.folderInput.value = "";
    el.folderInput.focus();
  });

  el.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderNoteList();
  });

  document.querySelector("#sort-button").addEventListener("click", (event) => {
    state.sortAscending = !state.sortAscending;
    event.currentTarget.dataset.tooltip = state.sortAscending
      ? "Oldest first"
      : "Recently updated";
    renderNoteList();
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key !== "Backspace" ||
        !event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey ||
        !getActiveNote() ||
        document.querySelector("dialog[open]") ||
        !el.folderContextMenu.classList.contains("hidden") ||
        !el.noteContextMenu.classList.contains("hidden")
      ) {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const isTextField = target?.closest(
        'input, textarea, [contenteditable="true"]',
      );
      const isEditor = target
        ? editor.getWrapperElement().contains(target)
        : false;
      if (isTextField && !isEditor) return;
      event.preventDefault();
      event.stopPropagation();
      closeNoteContextMenu();
      closeFolderContextMenu();
      openDeleteNoteDialog();
    },
    true,
  );

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !el.folderContextMenu.classList.contains("hidden")) {
      closeFolderContextMenu();
    }
    if (event.key === "Escape" && !el.noteContextMenu.classList.contains("hidden")) {
      closeNoteContextMenu();
    }
    const modifier = event.metaKey || event.ctrlKey;
    if (modifier && event.key.toLowerCase() === "k") {
      event.preventDefault();
      el.search.focus();
      el.search.select();
    }
    if (modifier && event.key.toLowerCase() === "n") {
      event.preventDefault();
      createNote();
    }
    if (modifier && event.key.toLowerCase() === "b") {
      event.preventDefault();
      toggleSidebar();
    }
    if (modifier && event.shiftKey && event.key.toLowerCase() === "p") {
      event.preventDefault();
      setView(state.view === "edit" ? "preview" : "edit");
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (
      !el.folderContextMenu.classList.contains("hidden") &&
      !el.folderContextMenu.contains(event.target)
    ) {
      closeFolderContextMenu();
    }
    if (
      !el.noteContextMenu.classList.contains("hidden") &&
      !el.noteContextMenu.contains(event.target)
    ) {
      closeNoteContextMenu();
    }
  });

  el.editorPanel.addEventListener("click", (event) => {
    if (
      window.innerWidth <= 640 &&
      event.clientX < 46 &&
      event.clientY < 64 &&
      event.target === el.editorPanel
    ) {
      closeEditorOnMobile();
    }
  });

  window.addEventListener("beforeunload", saveActiveNow);
  window.addEventListener("resize", () => {
    closeFolderContextMenu();
    closeNoteContextMenu();
    if (window.innerWidth > 820) {
      el.navigation.classList.remove("is-open");
      el.backdrop.classList.add("hidden");
    }
    syncSidebar();
  });
  window.addEventListener("storage", (event) => {
    if (event.key === COLLAPSED_FOLDERS_KEY) {
      state.collapsedFolderIds = loadCollapsedFolders();
      renderNavigation();
      lucide.createIcons();
      return;
    }
    if (event.key === NOTE_DENSITY_KEY) {
      state.noteDensity = event.newValue === "compact" ? "compact" : "comfortable";
      syncNoteDensity();
      return;
    }
    if (![STORAGE_KEY, FOLDERS_KEY].includes(event.key)) return;
    state.notes = loadNotes();
    state.folders = loadFolders();
    migrateNoteTitles();
    migrateLegacyFolders();
    render();
    toast("Changes from another tab were applied");
  });

  render();
})();

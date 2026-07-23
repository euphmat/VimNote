(() => {
  "use strict";

  const STORAGE_KEY = "vimnote.notes.v1";
  const ACTIVE_KEY = "vimnote.active.v1";
  const THEME_KEY = "vimnote.theme.v1";
  const FOLDERS_KEY = "vimnote.folders.v1";
  const SIDEBAR_KEY = "vimnote.sidebar-collapsed.v1";
  const encoder = new TextEncoder();
  const themes = [
    { id: "paper", name: "Paper", description: "やわらかな紙", colors: ["#f5f1e8", "#252421", "#e7644b"] },
    { id: "midnight", name: "Midnight", description: "深夜のブルー", colors: ["#10141c", "#edf1f7", "#ff7a66"] },
    { id: "charcoal", name: "Charcoal", description: "静かな墨色", colors: ["#171717", "#f1eee8", "#e78b61"] },
    { id: "forest", name: "Forest", description: "深い森の緑", colors: ["#13201b", "#eef3e8", "#e3a65a"] },
    { id: "ocean", name: "Ocean", description: "落ち着いた海", colors: ["#0e1c24", "#e9f3f5", "#6dc5d6"] },
    { id: "plum", name: "Plum", description: "夜の紫", colors: ["#211725", "#f4edf3", "#d987b8"] },
    { id: "sepia", name: "Sepia", description: "古いノート", colors: ["#eee3cf", "#392e23", "#a75638"] },
    { id: "slate", name: "Slate", description: "端正な青灰", colors: ["#e8edf0", "#253039", "#4f7596"] },
    { id: "sakura", name: "Sakura", description: "淡い桜色", colors: ["#f8ecef", "#382b31", "#c95078"] },
    { id: "solarized", name: "Solarized", description: "低コントラスト", colors: ["#fdf6e3", "#073642", "#cb4b16"] },
  ];
  const folderColors = [
    { value: "#e7644b", name: "コーラル" },
    { value: "#d98b3e", name: "オレンジ" },
    { value: "#c5a332", name: "イエロー" },
    { value: "#629167", name: "グリーン" },
    { value: "#3e9183", name: "ティール" },
    { value: "#3d91a8", name: "シアン" },
    { value: "#4f7596", name: "ブルー" },
    { value: "#626ca8", name: "インディゴ" },
    { value: "#8765a6", name: "パープル" },
    { value: "#c05f87", name: "ピンク" },
    { value: "#906c52", name: "ブラウン" },
    { value: "#747b81", name: "グレー" },
  ];
  const defaultFolders = [
    { id: "folder-inbox", name: "受信トレイ", color: "#e7644b" },
    { id: "folder-work", name: "仕事", color: "#4f7596" },
    { id: "folder-personal", name: "個人", color: "#629167" },
  ];

  const starterNotes = [
    {
      id: crypto.randomUUID(),
      title: "VimNote へようこそ",
      content: `# VimNote へようこそ

ここは、思考をすばやく書き留めるための **Markdown メモ** です。

## Vim で編集する

- \`i\` で挿入モード
- \`jj\` または \`Esc\` でノーマルモード
- \`/\` でインクリメンタル検索
- \`Esc Esc\` で検索ハイライトを解除
- \`:w\` で保存（自動保存も有効です）

> データは外部へ送信されず、このブラウザの localStorage に保存されます。

\`\`\`javascript
const idea = "考えを、手元に。";
localStorage.setItem("note", idea);
\`\`\`
`,
      folderId: "folder-inbox",
      pinned: true,
      createdAt: Date.now() - 1000 * 60 * 58,
      updatedAt: Date.now() - 1000 * 60 * 5,
    },
    {
      id: crypto.randomUUID(),
      title: "今週のフォーカス",
      content: `## 今週やること

- [ ] プロトタイプを共有する
- [ ] フィードバックを整理する
- [ ] 次の小さな一歩を決める

大きな目標を、今日できる単位まで小さくする。`,
      folderId: "folder-work",
      pinned: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 25,
      updatedAt: Date.now() - 1000 * 60 * 60 * 3,
    },
    {
      id: crypto.randomUUID(),
      title: "読みたい本",
      content: `# 読書リスト

1. デザインについて
2. 文章と思考について
3. 小さな習慣について`,
      folderId: "folder-personal",
      pinned: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },
  ];

  const state = {
    notes: loadNotes(),
    folders: loadFolders(),
    activeId: localStorage.getItem(ACTIVE_KEY),
    filter: "all",
    folderFilter: null,
    query: "",
    sortAscending: false,
    view: "edit",
    sidebarCollapsed: document.documentElement.dataset.sidebar === "collapsed",
    theme: themes.some((theme) => theme.id === document.documentElement.dataset.theme)
      ? document.documentElement.dataset.theme
      : "paper",
    draggedNoteId: null,
    colorPickerFolderId: null,
    saveTimer: null,
    lastEscapeAt: 0,
  };

  const el = {
    notesList: document.querySelector("#notes-list"),
    emptyList: document.querySelector("#empty-list"),
    emptyEditor: document.querySelector("#empty-editor"),
    editorShell: document.querySelector("#editor-shell"),
    title: document.querySelector("#note-title"),
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
    deleteNoteDialog: document.querySelector("#delete-note-dialog"),
    deleteNoteName: document.querySelector("#delete-note-name"),
    confirmDeleteNote: document.querySelector("#confirm-delete-note"),
    themeDialog: document.querySelector("#theme-dialog"),
    themeGrid: document.querySelector("#theme-grid"),
    toastRegion: document.querySelector("#toast-region"),
  };

  migrateLegacyFolders();
  if (!state.notes.length) {
    state.notes = starterNotes;
    persist();
  }
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
    toast("保存しました");
  });
  CodeMirror.Vim.defineEx("nohlsearch", "noh", () => clearSearchHighlight());

  function loadNotes() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function loadFolders() {
    try {
      const saved = JSON.parse(localStorage.getItem(FOLDERS_KEY) || "[]");
      const valid = Array.isArray(saved)
        ? saved
            .filter((folder) => folder?.id && folder?.name?.trim())
            .map((folder, index) => ({
              id: folder.id,
              name: folder.name.trim(),
              color: isFolderColor(folder.color)
                ? folder.color
                : folderColors[index % folderColors.length].value,
            }))
        : [];
      return valid.length ? valid : defaultFolders.map((folder) => ({ ...folder }));
    } catch {
      return defaultFolders.map((folder) => ({ ...folder }));
    }
  }

  function migrateLegacyFolders() {
    let changed = false;
    state.notes.forEach((note) => {
      if (!note.folderId) {
        const legacyName = note.tags?.[0]?.trim() || "受信トレイ";
        let folder = state.folders.find((item) => item.name === legacyName);
        if (!folder) {
          folder = {
            id: crypto.randomUUID(),
            name: legacyName,
            color: folderColors[state.folders.length % folderColors.length].value,
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

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(state.folders));
      if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
      setSavedState(true);
      void updateStorageStatus();
    } catch (error) {
      setSavedState(false);
      toast("保存容量が不足しています");
      console.error(error);
    }
  }

  function isFolderColor(value) {
    return folderColors.some((color) => color.value === value);
  }

  function setSavedState(saved) {
    if (!el.syncState) return;
    el.syncState.querySelector("span:last-child").textContent = saved
      ? "この端末に保存済み"
      : "保存できませんでした";
    el.syncState.querySelector(".save-dot").style.background = saved
      ? "var(--success)"
      : "var(--danger)";
    el.syncState.querySelector(".save-dot").style.boxShadow = saved
      ? "0 0 0 3px var(--success-soft)"
      : "0 0 0 3px var(--danger-soft)";
  }

  function getActiveNote() {
    return state.notes.find((note) => note.id === state.activeId) || null;
  }

  function saveActiveNow() {
    const note = getActiveNote();
    if (!note || editor._loadingNote) return;
    note.title = el.title.value.trimStart();
    note.content = editor.getValue();
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
      content: "",
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
      el.title.focus();
      el.title.select();
    }, 0);
    toast("新しいメモを作成しました");
  }

  function openDeleteNoteDialog() {
    const note = getActiveNote();
    if (!note) return;
    el.deleteNoteName.textContent = displayTitle(note);
    el.deleteNoteDialog.showModal();
  }

  function deleteActiveNote() {
    const note = getActiveNote();
    if (!note) return;
    el.deleteNoteDialog.close();
    const index = state.notes.findIndex((item) => item.id === note.id);
    state.notes.splice(index, 1);
    state.activeId = state.notes[index]?.id || state.notes[index - 1]?.id || null;
    persist();
    render();
    if (!state.activeId) closeEditorOnMobile();
    toast("メモを削除しました");
  }

  function togglePin() {
    const note = getActiveNote();
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = Date.now();
    persist();
    render();
    toast(note.pinned ? "ピン留めしました" : "ピン留めを外しました");
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

  function displayTitle(note) {
    return note.title?.trim() || firstMeaningfulLine(note.content) || "無題のメモ";
  }

  function firstMeaningfulLine(content) {
    return (
      content
        ?.split("\n")
        .map((line) => line.replace(/^#+\s*/, "").trim())
        .find(Boolean) || ""
    );
  }

  function plainExcerpt(content) {
    return (
      content
        .replace(/```[\s\S]*?```/g, " コード ")
        .replace(/[#>*_`[\]()!-]/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "内容はまだありません"
    );
  }

  function filteredNotes() {
    const query = state.query.trim().toLocaleLowerCase("ja");
    const list = state.notes.filter((note) => {
      const matchesType = state.filter === "all" || note.pinned;
      const matchesFolder = !state.folderFilter || note.folderId === state.folderFilter;
      const folderName = getFolder(note.folderId)?.name || "";
      const haystack = `${note.title} ${note.content} ${folderName}`.toLocaleLowerCase("ja");
      return matchesType && matchesFolder && (!query || haystack.includes(query));
    });
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return state.sortAscending ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt;
    });
  }

  function render() {
    applyTheme(state.theme, false);
    syncSidebar();
    renderNavigation();
    renderNoteList();
    loadActiveNote();
    renderThemeChoices();
    void updateStorageStatus();
    lucide.createIcons();
  }

  function getLocalStorageUsage() {
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

    el.storageRemaining.textContent = `残り ${formatBytes(remaining)}`;
    el.storagePercentage.textContent = percentageLabel;
    el.storageDetail.textContent = `${formatBytes(usage)} 使用 / ${formatBytes(quota)} ${
      estimatedByBrowser ? "利用可能" : "目安"
    }`;
    el.storageMeterBar.style.width = `${visiblePercentage}%`;
    el.storageMeter.setAttribute("aria-valuenow", String(Math.round(percentage)));
    el.storageMeter.setAttribute(
      "aria-valuetext",
      `${percentageLabel}使用、残り${formatBytes(remaining)}`,
    );
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return "—";
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${Math.round(bytes)} B`;
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
    if (announce) toast(`${theme.name} テーマに変更しました`);
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
      ...state.folders
        .map((folder) => ({
          ...folder,
          count: state.notes.filter((note) => note.folderId === folder.id).length,
        }))
        .map((folder) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `nav-item${state.folderFilter === folder.id ? " is-active" : ""}`;
          button.style.setProperty("--folder-color", folder.color);
          button.setAttribute("aria-label", `${folder.name}、${folder.count}件。ノートをドロップして移動`);
          button.innerHTML = `
            <span class="flex min-w-0 items-center gap-3">
              <i data-lucide="folder" aria-hidden="true"></i>
              <span class="truncate">${escapeHtml(folder.name)}</span>
            </span>
            <span class="nav-count">${folder.count}</span>`;
          button.addEventListener("click", () => {
            state.folderFilter = folder.id;
            state.filter = "all";
            renderNavigation();
            renderNoteList();
            closeMobileMenu();
            lucide.createIcons();
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
            event.preventDefault();
            const noteId = state.draggedNoteId || event.dataTransfer.getData("text/plain");
            cleanupNoteDrag();
            moveNoteToFolder(noteId, folder.id);
          });
          return button;
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
        card.className = `note-card${note.id === state.activeId ? " is-active" : ""}`;
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
      el.listTitle.textContent = getFolder(state.folderFilter)?.name || "フォルダ";
    } else if (state.filter === "pinned") {
      el.listEyebrow.textContent = "Pinned";
      el.listTitle.textContent = "ピン留め";
    } else {
      el.listEyebrow.textContent = "All notes";
      el.listTitle.textContent = "すべてのメモ";
    }
    lucide.createIcons();
  }

  function loadActiveNote() {
    const note = getActiveNote();
    el.emptyEditor.classList.toggle("hidden", Boolean(note));
    el.editorShell.classList.toggle("hidden", !note);
    if (!note) return;

    editor._loadingNote = true;
    el.title.value = note.title || "";
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
    el.updatedAt.textContent = `更新 ${formatLongDate(note.updatedAt)}`;
    el.pin.classList.toggle("is-active", note.pinned);
    el.pin.setAttribute("aria-pressed", String(note.pinned));
    const length = [...(editor.getValue() || "")].length;
    el.wordCount.textContent = `${length.toLocaleString("ja-JP")} 文字`;
  }

  function getFolder(folderId) {
    return state.folders.find((folder) => folder.id === folderId) || null;
  }

  function renderFolderChip(note) {
    const folder = getFolder(note.folderId);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "folder-chip";
    button.style.setProperty("--folder-color", folder?.color || "var(--coral)");
    button.innerHTML = `
      <i data-lucide="folder" aria-hidden="true"></i>
      <span>${escapeHtml(folder?.name || "フォルダを選択")}</span>
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

  function openFolderDialog() {
    state.colorPickerFolderId = null;
    renderEditableFolders();
    el.folderDialog.showModal();
    setTimeout(() => el.folderInput.focus(), 0);
  }

  function renderEditableFolders() {
    const note = getActiveNote();
    el.editableFolders.replaceChildren(
      ...state.folders.map((folder) => {
        const count = state.notes.filter((item) => item.folderId === folder.id).length;
        const row = document.createElement("div");
        row.className = `folder-manager-row${note?.folderId === folder.id ? " is-current" : ""}`;
        row.style.setProperty("--folder-color", folder.color);
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
            <i data-lucide="${note?.folderId === folder.id ? "folder-check" : "folder"}" aria-hidden="true"></i>
            <span class="min-w-0 flex-1 truncate text-left">${escapeHtml(folder.name)}</span>
            <span class="folder-count">${count}</span>
          </button>
          <button class="mini-icon-button folder-color-button" type="button" aria-label="${escapeHtml(folder.name)}の色を変更" data-tooltip="カラー">
            <i data-lucide="palette" aria-hidden="true"></i>
          </button>
          <button class="mini-icon-button rename-folder" type="button" aria-label="${escapeHtml(folder.name)}の名前を変更" data-tooltip="名前を変更">
            <i data-lucide="pencil" aria-hidden="true"></i>
          </button>
          <button class="mini-icon-button delete-folder danger-hover" type="button" aria-label="${escapeHtml(folder.name)}を削除" data-tooltip="フォルダを削除">
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
          ${
            state.colorPickerFolderId === folder.id
              ? `<div class="folder-color-palette" role="group" aria-label="${escapeHtml(folder.name)}のカラーパレット">${palette}</div>`
              : ""
          }`;
        row.querySelector(".folder-select").addEventListener("click", () => {
          moveActiveToFolder(folder.id);
          renderEditableFolders();
        });
        row.querySelector(".folder-color-button").addEventListener("click", () => {
          state.colorPickerFolderId =
            state.colorPickerFolderId === folder.id ? null : folder.id;
          renderEditableFolders();
        });
        row.querySelectorAll(".folder-color-swatch").forEach((swatch) => {
          swatch.addEventListener("click", () => updateFolderColor(folder.id, swatch.dataset.color));
        });
        row.querySelector(".rename-folder").addEventListener("click", () => renameFolder(folder.id));
        row.querySelector(".delete-folder").addEventListener("click", () => deleteFolder(folder.id));
        return row;
      }),
    );
    lucide.createIcons();
  }

  function addFolder(value) {
    const name = value.trim();
    if (!name) return;
    if (state.folders.some((folder) => folder.name.toLocaleLowerCase("ja") === name.toLocaleLowerCase("ja"))) {
      toast("同じ名前のフォルダがあります");
      return;
    }
    const folder = {
      id: crypto.randomUUID(),
      name,
      color: folderColors[state.folders.length % folderColors.length].value,
    };
    state.folders.push(folder);
    const note = getActiveNote();
    if (note) {
      note.folderId = folder.id;
      note.updatedAt = Date.now();
      if (state.folderFilter) state.folderFilter = folder.id;
    }
    persist();
    renderNavigation();
    renderNoteList();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    toast(`「${name}」を作成しました`);
  }

  function moveActiveToFolder(folderId) {
    moveNoteToFolder(state.activeId, folderId, true);
  }

  function updateFolderColor(folderId, color) {
    const folder = getFolder(folderId);
    if (!folder || !isFolderColor(color) || folder.color === color) return;
    folder.color = color;
    persist();
    renderNavigation();
    renderNoteList();
    const note = getActiveNote();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    toast(`「${folder.name}」のカラーを変更しました`);
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
    toast(`「${displayTitle(note)}」を「${folder.name}」へ移動しました`);
  }

  function cleanupNoteDrag() {
    state.draggedNoteId = null;
    document.documentElement.classList.remove("is-note-dragging");
    document
      .querySelectorAll(".is-dragging, .is-drop-target")
      .forEach((element) => element.classList.remove("is-dragging", "is-drop-target"));
  }

  function renameFolder(folderId) {
    const folder = getFolder(folderId);
    if (!folder) return;
    const value = window.prompt("新しいフォルダ名", folder.name);
    const name = value?.trim();
    if (!name || name === folder.name) return;
    if (
      state.folders.some(
        (item) =>
          item.id !== folder.id &&
          item.name.toLocaleLowerCase("ja") === name.toLocaleLowerCase("ja"),
      )
    ) {
      toast("同じ名前のフォルダがあります");
      return;
    }
    folder.name = name;
    persist();
    renderNavigation();
    renderNoteList();
    const note = getActiveNote();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    toast("フォルダ名を変更しました");
  }

  function deleteFolder(folderId) {
    const folder = getFolder(folderId);
    if (!folder) return;
    if (state.folders.length === 1) {
      toast("最後のフォルダは削除できません");
      return;
    }
    const count = state.notes.filter((note) => note.folderId === folderId).length;
    const fallback = state.folders.find((item) => item.id !== folderId);
    const message = count
      ? `「${folder.name}」を削除し、${count}件のメモを「${fallback.name}」へ移動しますか？`
      : `「${folder.name}」を削除しますか？`;
    if (!window.confirm(message)) return;
    state.notes.forEach((note) => {
      if (note.folderId === folderId) note.folderId = fallback.id;
    });
    state.folders = state.folders.filter((item) => item.id !== folderId);
    if (state.colorPickerFolderId === folderId) state.colorPickerFolderId = null;
    if (state.folderFilter === folderId) state.folderFilter = null;
    persist();
    renderNavigation();
    renderNoteList();
    const note = getActiveNote();
    if (note) renderFolderChip(note);
    renderEditableFolders();
    toast("フォルダを削除しました");
  }

  function exportActiveNote() {
    saveActiveNow();
    const note = getActiveNote();
    if (!note) return;
    const blob = new Blob([note.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(displayTitle(note))}.md`;
    link.click();
    URL.revokeObjectURL(url);
    toast("Markdownを書き出しました");
  }

  function safeFilename(name) {
    return name.replace(/[\\/:*?"<>|]/g, "-").slice(0, 80) || "untitled";
  }

  function clearSearchHighlight() {
    try {
      CodeMirror.Vim.handleKey(editor, "<Esc>");
      editor.getAllMarks().forEach((mark) => mark.clear());
    } catch {
      // Search marks are internal to the Vim addon; Escape still closes active search.
    }
    toast("検索ハイライトを解除しました");
  }

  function formatListDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  }

  function formatLongDate(timestamp) {
    return new Date(timestamp).toLocaleString("ja-JP", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function escapeHtml(value) {
    const node = document.createElement("div");
    node.textContent = String(value);
    return node.innerHTML;
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
      collapsed ? "サイドバーを表示" : "サイドバーを非表示",
    );
    el.sidebarToggle.dataset.tooltip = collapsed
      ? "サイドバーを表示"
      : "サイドバーを隠す";
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

  el.title.addEventListener("input", scheduleSave);
  el.title.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      editor.focus();
      CodeMirror.Vim.handleKey(editor, "i");
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

  document
    .querySelectorAll("#new-note-button-header, #new-note-button-empty")
    .forEach((button) => button.addEventListener("click", createNote));

  el.sidebarToggle.addEventListener("click", toggleSidebar);
  el.backdrop.addEventListener("click", closeMobileMenu);
  el.pin.addEventListener("click", togglePin);
  el.remove.addEventListener("click", openDeleteNoteDialog);
  el.confirmDeleteNote.addEventListener("click", deleteActiveNote);
  document.querySelector("#export-button").addEventListener("click", exportActiveNote);
  document
    .querySelector("#shortcuts-button")
    .addEventListener("click", () => el.shortcutsDialog.showModal());
  document.querySelector("#theme-button").addEventListener("click", () => {
    renderThemeChoices();
    el.themeDialog.showModal();
  });
  document.querySelector("#manage-folders-button").addEventListener("click", openFolderDialog);

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
    event.currentTarget.dataset.tooltip = state.sortAscending ? "古い順" : "更新順";
    renderNoteList();
  });

  document.addEventListener("keydown", (event) => {
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
    if (window.innerWidth > 820) {
      el.navigation.classList.remove("is-open");
      el.backdrop.classList.add("hidden");
    }
    syncSidebar();
  });
  window.addEventListener("storage", (event) => {
    if (![STORAGE_KEY, FOLDERS_KEY].includes(event.key)) return;
    state.notes = loadNotes();
    state.folders = loadFolders();
    migrateLegacyFolders();
    render();
    toast("別のタブの変更を反映しました");
  });

  // Keep the explicit byte operation reachable for storage diagnostics.
  void encoder;
  render();
})();

(() => {
  "use strict";

  const STORAGE_KEY = "vimnote.notes.v1";
  const ACTIVE_KEY = "vimnote.active.v1";
  const encoder = new TextEncoder();

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
      tags: ["はじめに", "vim"],
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
      tags: ["仕事"],
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
      tags: ["個人"],
      pinned: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
      updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    },
  ];

  const state = {
    notes: loadNotes(),
    activeId: localStorage.getItem(ACTIVE_KEY),
    filter: "all",
    tagFilter: null,
    query: "",
    sortAscending: false,
    view: "edit",
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
    tagChips: document.querySelector("#tag-chips"),
    tagList: document.querySelector("#tag-list"),
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
    navigation: document.querySelector("#navigation"),
    backdrop: document.querySelector("#mobile-backdrop"),
    editorPanel: document.querySelector("#editor-panel"),
    shortcutsDialog: document.querySelector("#shortcuts-dialog"),
    tagDialog: document.querySelector("#tag-dialog"),
    tagForm: document.querySelector("#tag-form"),
    tagInput: document.querySelector("#tag-input"),
    editableTags: document.querySelector("#editable-tags"),
    toastRegion: document.querySelector("#toast-region"),
  };

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

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
      if (state.activeId) localStorage.setItem(ACTIVE_KEY, state.activeId);
      setSavedState(true);
    } catch (error) {
      setSavedState(false);
      toast("保存容量が不足しています");
      console.error(error);
    }
  }

  function setSavedState(saved) {
    if (!el.syncState) return;
    el.syncState.querySelector("span:last-child").textContent = saved
      ? "この端末に保存済み"
      : "保存できませんでした";
    el.syncState.querySelector(".save-dot").style.background = saved ? "#629167" : "#c84938";
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
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    state.notes.unshift(note);
    state.activeId = note.id;
    state.filter = "all";
    state.tagFilter = null;
    persist();
    render();
    openEditorOnMobile();
    setTimeout(() => {
      el.title.focus();
      el.title.select();
    }, 0);
    toast("新しいメモを作成しました");
  }

  function deleteActiveNote() {
    const note = getActiveNote();
    if (!note) return;
    const ok = window.confirm(`「${displayTitle(note)}」を削除しますか？`);
    if (!ok) return;
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
      const matchesTag = !state.tagFilter || note.tags.includes(state.tagFilter);
      const haystack = `${note.title} ${note.content} ${note.tags.join(" ")}`.toLocaleLowerCase("ja");
      return matchesType && matchesTag && (!query || haystack.includes(query));
    });
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return state.sortAscending ? a.updatedAt - b.updatedAt : b.updatedAt - a.updatedAt;
    });
  }

  function render() {
    renderNavigation();
    renderNoteList();
    loadActiveNote();
    lucide.createIcons();
  }

  function renderNavigation() {
    el.allCount.textContent = state.notes.length;
    el.pinnedCount.textContent = state.notes.filter((note) => note.pinned).length;
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.classList.toggle(
        "is-active",
        button.dataset.filter === state.filter && !state.tagFilter,
      );
    });

    const counts = new Map();
    state.notes.forEach((note) => {
      note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    el.tagList.replaceChildren(
      ...[...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b, "ja"))
        .map(([tag, count]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `nav-item${state.tagFilter === tag ? " is-active" : ""}`;
          button.innerHTML = `
            <span class="flex min-w-0 items-center gap-3">
              <i data-lucide="hash" aria-hidden="true"></i>
              <span class="truncate">${escapeHtml(tag)}</span>
            </span>
            <span class="nav-count">${count}</span>`;
          button.addEventListener("click", () => {
            state.tagFilter = tag;
            state.filter = "all";
            renderNavigation();
            renderNoteList();
            closeMobileMenu();
            lucide.createIcons();
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
        card.className = `note-card${note.id === state.activeId ? " is-active" : ""}`;
        card.dataset.id = note.id;
        const pin = note.pinned ? '<i data-lucide="pin" aria-hidden="true"></i>' : "";
        card.innerHTML = `
          <div class="note-title-row">
            <h3 class="note-card-title">${pin}${escapeHtml(displayTitle(note))}</h3>
            <time class="note-date">${formatListDate(note.updatedAt)}</time>
          </div>
          <p class="note-excerpt">${escapeHtml(plainExcerpt(note.content))}</p>
          ${note.tags[0] ? `<span class="note-tag"># ${escapeHtml(note.tags[0])}</span>` : ""}
        `;
        card.addEventListener("click", () => selectNote(note.id));
        return card;
      }),
    );
    el.emptyList.classList.toggle("hidden", notes.length > 0);

    if (state.tagFilter) {
      el.listEyebrow.textContent = "Tag";
      el.listTitle.textContent = `# ${state.tagFilter}`;
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
    renderTagChips(note);
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

  function renderTagChips(note) {
    el.tagChips.replaceChildren(
      ...note.tags.map((tag) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.innerHTML = `# ${escapeHtml(tag)} <button type="button" aria-label="${escapeHtml(
          tag,
        )}を外す"><i data-lucide="x" aria-hidden="true"></i></button>`;
        chip.querySelector("button").addEventListener("click", () => removeTag(tag));
        return chip;
      }),
    );
    if (!note.tags.length) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tag-chip";
      button.textContent = "+ タグ";
      button.addEventListener("click", openTagDialog);
      el.tagChips.append(button);
    }
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

  function openTagDialog() {
    renderEditableTags();
    el.tagDialog.showModal();
    setTimeout(() => el.tagInput.focus(), 0);
  }

  function renderEditableTags() {
    const note = getActiveNote();
    el.editableTags.replaceChildren();
    if (!note) return;
    note.tags.forEach((tag) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `# ${escapeHtml(tag)} <button type="button" aria-label="${escapeHtml(
        tag,
      )}を外す"><i data-lucide="x" aria-hidden="true"></i></button>`;
      chip.querySelector("button").addEventListener("click", () => {
        removeTag(tag);
        renderEditableTags();
      });
      el.editableTags.append(chip);
    });
    lucide.createIcons();
  }

  function addTag(value) {
    const note = getActiveNote();
    const tag = value.trim().replace(/^#/, "");
    if (!note || !tag || note.tags.includes(tag)) return;
    note.tags.push(tag);
    note.updatedAt = Date.now();
    persist();
    renderNavigation();
    renderNoteList();
    renderTagChips(note);
    renderEditableTags();
  }

  function removeTag(tag) {
    const note = getActiveNote();
    if (!note) return;
    note.tags = note.tags.filter((item) => item !== tag);
    note.updatedAt = Date.now();
    persist();
    renderNavigation();
    renderNoteList();
    renderTagChips(note);
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
  }

  function closeMobileMenu() {
    el.navigation.classList.remove("is-open");
    el.backdrop.classList.add("hidden");
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
      state.tagFilter = null;
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

  document.querySelector("#mobile-menu-button").addEventListener("click", openMobileMenu);
  el.backdrop.addEventListener("click", closeMobileMenu);
  el.pin.addEventListener("click", togglePin);
  el.remove.addEventListener("click", deleteActiveNote);
  document.querySelector("#export-button").addEventListener("click", exportActiveNote);
  document
    .querySelector("#shortcuts-button")
    .addEventListener("click", () => el.shortcutsDialog.showModal());
  document.querySelector("#manage-tags-button").addEventListener("click", openTagDialog);

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog").close());
  });

  el.tagForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addTag(el.tagInput.value);
    el.tagInput.value = "";
    el.tagInput.focus();
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
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEY) return;
    state.notes = loadNotes();
    render();
    toast("別のタブの変更を反映しました");
  });

  // Keep the explicit byte operation reachable for storage diagnostics.
  void encoder;
  render();
})();

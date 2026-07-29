import { STORAGE_KEYS } from "./config.js";
import {
  clearVimSearch,
  createVimMarkdownEditor,
} from "./vim-editor.js";

const CHARACTERS = Object.freeze([
  { id: "emma", name: "桜羽エマ", image: "./Assets/Character/桜羽エマ.JPG" },
  { id: "meruru", name: "氷上メルル", image: "./Assets/Character/氷上メルル.JPG" },
  { id: "nanoka", name: "黒部ナノカ", image: "./Assets/Character/黒部ナノカ.JPG" },
  { id: "coco", name: "沢渡ココ", image: "./Assets/Character/沢渡ココ.JPG" },
  { id: "reia", name: "蓮見レイア", image: "./Assets/Character/蓮見レイア.JPG" },
  { id: "miria", name: "佐伯ミリア", image: "./Assets/Character/佐伯ミリア.JPG" },
  { id: "hanna", name: "遠野ハンナ", image: "./Assets/Character/遠野ハンナ.JPG" },
  {
    id: "gokucho",
    name: "ゴクチョー",
    group: "staff",
    image: "./Assets/Character/ゴクチョー.JPG",
  },
  { id: "sherry", name: "橘シェリー", image: "./Assets/Character/橘シェリー.JPG" },
  { id: "alisa", name: "紫藤アリサ", image: "./Assets/Character/紫藤アリサ.JPG" },
  {
    id: "guard",
    name: "看守",
    group: "staff",
    image: "./Assets/Character/看守.JPG",
  },
  { id: "hiro", name: "二階堂ヒロ", image: "./Assets/Character/二階堂ヒロ.JPG" },
  { id: "margo", name: "宝生マーゴ", image: "./Assets/Character/宝生マーゴ.JPG" },
  { id: "noa", name: "城ヶ崎ノア", image: "./Assets/Character/城ヶ崎ノア.JPG" },
  { id: "anan", name: "夏目アンアン", image: "./Assets/Character/夏目アンアン.JPG" },
]);

const CHARACTER_GROUPS = Object.freeze([
  { id: "prisoner", label: "囚人", icon: "lock-keyhole" },
  { id: "staff", label: "施設関係者", icon: "shield" },
]);

const MAPS = Object.freeze([
  { id: "b1", name: "B1F", image: "./Assets/Boards/B1F.jpg" },
  { id: "1f", name: "1F", image: "./Assets/Boards/1F.jpg" },
  { id: "2f", name: "2F", image: "./Assets/Boards/2F.jpg" },
]);

const CASE_FIELDS = Object.freeze([
  {
    key: "incident",
    label: "事件の概要",
    hint: "被害者・発見者・発見時刻・発見場所",
    icon: "siren",
    placeholder:
      "被害者：\n発見者：\n発見時刻：\n発見場所：\n第一発見時の状況：",
    template:
      "被害者：\n発見者：\n発見時刻：\n発見場所：\n第一発見時の状況：",
  },
  {
    key: "cause",
    label: "死因・凶器・現場",
    hint: "遺体と現場から確認できること",
    icon: "scan-line",
    placeholder:
      "推定死因：\n凶器／手段：\n遺体の状態：\n現場に残された痕跡：\n不自然な点：",
    template:
      "推定死因：\n凶器／手段：\n遺体の状態：\n現場に残された痕跡：\n不自然な点：",
  },
  {
    key: "timeline",
    label: "事件時系列",
    hint: "自由時間・見回り・発見までを時刻順に",
    icon: "clock-3",
    placeholder:
      "[時刻] 出来事／人物／場所\n[時刻] 出来事／人物／場所\n[時刻] 遺体発見",
    template: "[時刻] 人物｜場所｜行動\n[時刻] 人物｜場所｜行動",
    wide: true,
  },
  {
    key: "evidence",
    label: "手がかり一覧",
    hint: "出所と、それが証明する範囲をセットで",
    icon: "fingerprint",
    placeholder:
      "・手がかり：\n  発見場所／証言者：\n  証明できること：\n  まだ証明できないこと：",
    template:
      "・手がかり：\n  発見場所／証言者：\n  証明できること：\n  まだ証明できないこと：",
    wide: true,
  },
  {
    key: "trialIssue",
    label: "魔女裁判の争点",
    hint: "議論で証明すべき問いと反証",
    icon: "scale",
    placeholder:
      "主な争点：\n有力な魔女候補：\n決め手になる矛盾：\n想定される反論：\n不足している証拠：",
    template:
      "主な争点：\n有力な魔女候補：\n決め手になる矛盾：\n想定される反論：\n不足している証拠：",
    wide: true,
  },
]);

const CHARACTER_FIELDS = Object.freeze([
  {
    key: "basicInfo",
    label: "人物・関係",
    hint: "性格・経歴・他の囚人との関係",
    icon: "contact",
    placeholder:
      "人物像：\n親しい囚人：\n対立／警戒している相手：\n事件に関わる利害：",
    template:
      "人物像：\n親しい囚人：\n対立／警戒している相手：\n事件に関わる利害：",
  },
  {
    key: "magicTrauma",
    label: "魔法・トラウマ",
    hint: "能力の発現条件・制約・代償と心の傷",
    icon: "sparkles",
    placeholder:
      "魔法：\n発現条件：\n効果範囲：\n制約／代償：\nトラウマ：\n情報の出所：",
    template:
      "魔法：\n発現条件：\n効果範囲：\n制約／代償：\nトラウマ：\n情報の出所：",
  },
  {
    key: "testimony",
    label: "証言・時系列",
    hint: "誰が、いつ、どこで、何を語ったか",
    icon: "messages-square",
    placeholder:
      "[時刻／場所]\n発言：\n証言者：\n裏付け：\n気になる言い回し：",
    template:
      "[時刻／場所]\n発言：\n証言者：\n裏付け：\n気になる言い回し：",
  },
  {
    key: "alibi",
    label: "アリバイ",
    hint: "事件推定時刻の居場所と空白時間",
    icon: "map-pinned",
    placeholder:
      "事件推定時刻：\n居場所：\n同行者／裏付け：\n目撃された時刻：\n説明できない空白：",
    template:
      "事件推定時刻：\n居場所：\n同行者／裏付け：\n目撃された時刻：\n説明できない空白：",
  },
  {
    key: "contradictions",
    label: "矛盾・嘘",
    hint: "発言と手がかりの食い違い",
    icon: "git-compare-arrows",
    placeholder:
      "本人の主張：\n食い違う証言／証拠：\nなぜ矛盾するか：\n考えられる別解：",
    template:
      "本人の主張：\n食い違う証言／証拠：\nなぜ矛盾するか：\n考えられる別解：",
  },
  {
    key: "facts",
    label: "確定した事実",
    hint: "推測を含めず、証拠で確認できたこと",
    icon: "badge-check",
    placeholder: "・[確定] 事実\n  根拠：証拠／証言\n  影響：何が否定・肯定されるか",
    template: "・[確定] \n  根拠：\n  影響：",
  },
]);

const LEGACY_SUSPICION_LABELS = Object.freeze({
  cleared: "疑い薄",
  watch: "要確認",
  strong: "有力候補",
});

const CHARACTER_NOTE_PLACEHOLDER =
  "# 人物メモ\n\n人物・関係、魔法・トラウマ、証言・時系列、アリバイ、矛盾、確定した事実を自由に記録";

const CHARACTER_NOTE_TEMPLATE = CHARACTER_FIELDS.map(
  (field) => `## ${field.label}\n\n${field.template}`,
).join("\n\n");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function defaultCase(title = "事件・捜査記録") {
  const initialCharacterId = CHARACTERS[0].id;
  return {
    id: crypto.randomUUID(),
    title,
    activeView: "case",
    selectedCharacterId: initialCharacterId,
    openCharacterIds: [initialCharacterId],
    previewCharacterId: initialCharacterId,
    splitCharacterIds: [],
    selectedMapId: "1f",
    textareaHeights: {},
    caseFile: Object.fromEntries(CASE_FIELDS.map((field) => [field.key, ""])),
    characterFiles: Object.fromEntries(
      CHARACTERS.map((character) => [
        character.id,
        {
          note: "",
          isDead: false,
        },
      ]),
    ),
    mapNotes: Object.fromEntries(MAPS.map((map) => [map.id, ""])),
  };
}

function normalizeCase(saved, fallback = defaultCase()) {
  if (!saved || typeof saved !== "object") return fallback;
  const validCharacterIds = new Set(
    CHARACTERS.map((character) => character.id),
  );
  const selectedCharacterId = validCharacterIds.has(saved.selectedCharacterId)
    ? saved.selectedCharacterId
    : fallback.selectedCharacterId;
  const openCharacterIds = [
    ...new Set(
      (Array.isArray(saved.openCharacterIds)
        ? saved.openCharacterIds
        : [selectedCharacterId]
      ).filter((id) => validCharacterIds.has(id)),
    ),
  ];
  if (!openCharacterIds.includes(selectedCharacterId)) {
    openCharacterIds.push(selectedCharacterId);
  }
  const previewCharacterId =
    validCharacterIds.has(saved.previewCharacterId) &&
    openCharacterIds.includes(saved.previewCharacterId)
      ? saved.previewCharacterId
      : null;
  const savedSplitCharacterIds = Array.isArray(saved.splitCharacterIds)
    ? saved.splitCharacterIds
    : saved.splitCharacterId
      ? [saved.splitCharacterId]
      : [];
  const splitCharacterIds = [
    ...new Set(
      savedSplitCharacterIds.filter(
        (id) =>
          validCharacterIds.has(id) &&
          id !== selectedCharacterId,
      ),
    ),
  ];
  splitCharacterIds.forEach((characterId) => {
    if (!openCharacterIds.includes(characterId)) {
      openCharacterIds.push(characterId);
    }
  });
  const characterFiles = { ...fallback.characterFiles };
  CHARACTERS.forEach((character) => {
    const file = saved.characterFiles?.[character.id];
    if (!file || typeof file !== "object") return;
    const legacySections = CHARACTER_FIELDS.flatMap((field) => {
      const value =
        typeof file[field.key] === "string" ? file[field.key].trim() : "";
      return value ? [`## ${field.label}`, "", value, ""] : [];
    });
    const legacySuspicion = LEGACY_SUSPICION_LABELS[file.suspicion];
    const migratedNote = [
      ...(legacySuspicion ? [`疑い（旧ステータス）: ${legacySuspicion}`, ""] : []),
      ...legacySections,
    ]
      .join("\n")
      .trim();
    const note =
      typeof file.note === "string"
        ? file.note
        : typeof file.details === "string"
          ? file.details
          : migratedNote;
    characterFiles[character.id] = {
      note,
      isDead: file.isDead === true,
    };
  });
  return {
    id:
      typeof saved.id === "string" && saved.id
        ? saved.id
        : fallback.id,
    title:
      typeof saved.title === "string" && saved.title.trim()
        ? saved.title.trim() === "第1の事件・捜査記録"
          ? "事件・捜査記録"
          : saved.title.slice(0, 60)
        : fallback.title,
    activeView: ["case", "board", "reference"].includes(saved.activeView)
      ? saved.activeView
      : fallback.activeView,
    selectedCharacterId,
    openCharacterIds,
    previewCharacterId,
    splitCharacterIds,
    selectedMapId: MAPS.some((map) => map.id === saved.selectedMapId)
      ? saved.selectedMapId
      : fallback.selectedMapId,
    textareaHeights: Object.fromEntries(
      Object.entries(saved.textareaHeights || {}).filter(
        ([key, height]) =>
          typeof key === "string" &&
          key.length <= 100 &&
          !key.includes(":time:") &&
          !key.startsWith("character:") &&
          Number.isFinite(height) &&
          height >= 40 &&
          height <= 5000,
      ),
    ),
    caseFile: Object.fromEntries(
      CASE_FIELDS.map((field) => [
        field.key,
        typeof saved.caseFile?.[field.key] === "string"
          ? saved.caseFile[field.key].slice(0, 10000)
          : "",
      ]),
    ),
    characterFiles,
    mapNotes: Object.fromEntries(
      MAPS.map((map) => [
        map.id,
        typeof saved.mapNotes?.[map.id] === "string"
          ? saved.mapNotes[map.id].slice(0, 3000)
          : "",
      ]),
    ),
  };
}

function loadCaseBook() {
  const fallback = defaultCase();
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.witchTrialCase) || "null",
    );
    if (!saved || typeof saved !== "object") {
      return { activeCaseId: fallback.id, cases: [fallback] };
    }
    if (Array.isArray(saved.cases)) {
      const cases = saved.cases
        .filter((item) => item && typeof item === "object")
        .map((item) => normalizeCase(item));
      if (!cases.length) return { activeCaseId: fallback.id, cases: [fallback] };
      const activeCaseId = cases.some((item) => item.id === saved.activeCaseId)
        ? saved.activeCaseId
        : cases[0].id;
      return { activeCaseId, cases };
    }
    const migrated = normalizeCase(saved, fallback);
    return { activeCaseId: migrated.id, cases: [migrated] };
  } catch {
    return { activeCaseId: fallback.id, cases: [fallback] };
  }
}

function findCharacter(id) {
  return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0];
}

function findMap(id) {
  return MAPS.find((map) => map.id === id) || MAPS[1];
}

function downloadText(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function createWitchTrialMode({ toast = () => {} } = {}) {
  const caseBook = loadCaseBook();
  let data =
    caseBook.cases.find((item) => item.id === caseBook.activeCaseId) ||
    caseBook.cases[0];
  const state = {
    enabled: localStorage.getItem(STORAGE_KEYS.witchTrialEnabled) === "true",
    characterQuery: "",
    showDeceased: false,
    saveTimer: null,
    tabActivationTimer: null,
    textareaResizeObserver: null,
    characterEditors: [],
    rulesHtml: null,
    rulesPromise: null,
  };

  const el = {
    root: document.querySelector("#trial-workspace"),
    standard: document.querySelector("#standard-workspace"),
    settingsButton: document.querySelector("#settings-button"),
    settingsDialog: document.querySelector("#settings-dialog"),
    toggle: document.querySelector("#witch-trial-toggle"),
    badge: document.querySelector("#trial-mode-badge"),
    sidebarToggle: document.querySelector("#sidebar-toggle-button"),
    characterSearch: document.querySelector("#trial-character-search"),
    characterList: document.querySelector("#trial-character-list"),
    characterCount: document.querySelector("#trial-character-count"),
    showDeceased: document.querySelector("#trial-show-deceased"),
    deceasedCount: document.querySelector("#trial-deceased-count"),
    caseTitle: document.querySelector("#trial-case-title"),
    caseSelect: document.querySelector("#trial-case-select"),
    newCaseButton: document.querySelector("#trial-new-case-button"),
    saveState: document.querySelector("#trial-save-state"),
    tabs: [...document.querySelectorAll("[data-trial-view]")],
    view: document.querySelector("#trial-view"),
    mapButton: document.querySelector("#trial-map-button"),
    mapMobileButton: document.querySelector("#trial-map-mobile-button"),
    mapDialog: document.querySelector("#trial-map-dialog"),
    mapDialogBody: document.querySelector("#trial-map-dialog-body"),
    rulesButton: document.querySelector("#trial-rules-button"),
    rulesDialog: document.querySelector("#trial-rules-dialog"),
    rulesContent: document.querySelector("#trial-rules-content"),
    exportButton: document.querySelector("#trial-export-button"),
    exportMobileButton: document.querySelector("#trial-export-mobile-button"),
  };

  function iconRefresh() {
    window.lucide?.createIcons();
  }

  function setSaveState(saved) {
    if (!el.saveState) return;
    el.saveState.classList.toggle("is-saving", !saved);
    el.saveState.innerHTML = saved
      ? '<i data-lucide="check" aria-hidden="true"></i>保存済み'
      : '<i data-lucide="loader-circle" aria-hidden="true"></i>保存中';
    iconRefresh();
  }

  function persist() {
    clearTimeout(state.saveTimer);
    try {
      caseBook.activeCaseId = data.id;
      localStorage.setItem(
        STORAGE_KEYS.witchTrialCase,
        JSON.stringify({ version: 7, ...caseBook }),
      );
      setSaveState(true);
    } catch (error) {
      setSaveState(false);
      toast("捜査記録を保存できませんでした");
      console.error(error);
    }
  }

  function schedulePersist() {
    setSaveState(false);
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(persist, 240);
  }

  function trackTextareaHeights() {
    state.textareaResizeObserver?.disconnect();
    state.textareaResizeObserver = null;

    const textareas = [
      ...el.root.querySelectorAll("[data-textarea-height-key]"),
    ].filter(
      (textarea) =>
        textarea.offsetParent !== null || textarea.closest("dialog[open]"),
    );
    textareas.forEach((textarea) => {
      const savedHeight =
        data.textareaHeights[textarea.dataset.textareaHeightKey];
      if (Number.isFinite(savedHeight)) {
        textarea.style.height = `${savedHeight}px`;
      }
    });

    if (typeof ResizeObserver !== "function") return;
    const previousHeights = new WeakMap(
      textareas.map((textarea) => [
        textarea,
        Math.round(textarea.getBoundingClientRect().height),
      ]),
    );
    state.textareaResizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const textarea = entry.target;
        const height = Math.round(textarea.getBoundingClientRect().height);
        const previousHeight = previousHeights.get(textarea);
        previousHeights.set(textarea, height);
        if (
          previousHeight === undefined ||
          Math.abs(height - previousHeight) < 2
        ) {
          return;
        }
        const key = textarea.dataset.textareaHeightKey;
        if (data.textareaHeights[key] === height) return;
        data.textareaHeights[key] = height;
        schedulePersist();
      });
    });
    textareas.forEach((textarea) =>
      state.textareaResizeObserver.observe(textarea),
    );
  }

  function bringFloatingDialogToFront(dialog) {
    const otherDialog =
      dialog === el.mapDialog ? el.rulesDialog : el.mapDialog;
    otherDialog.style.zIndex = "100";
    dialog.style.zIndex = "101";
  }

  function constrainFloatingDialog(dialog, useInitialPosition = false) {
    if (!dialog.open) return;
    const edge = 8;
    const rect = dialog.getBoundingClientRect();
    const initialOffset = dialog === el.rulesDialog ? 42 : 20;
    const left = useInitialPosition
      ? window.innerWidth - rect.width - initialOffset
      : rect.left;
    const top = useInitialPosition
      ? dialog === el.rulesDialog
        ? 104
        : 80
      : rect.top;
    const maxLeft = Math.max(edge, window.innerWidth - rect.width - edge);
    const maxTop = Math.max(edge, window.innerHeight - rect.height - edge);

    dialog.style.right = "auto";
    dialog.style.left = `${Math.min(Math.max(edge, left), maxLeft)}px`;
    dialog.style.top = `${Math.min(Math.max(edge, top), maxTop)}px`;
    dialog.dataset.positioned = "true";
  }

  function openFloatingDialog(dialog) {
    if (!dialog.open) dialog.show();
    bringFloatingDialogToFront(dialog);
    requestAnimationFrame(() => {
      constrainFloatingDialog(dialog, !dialog.dataset.positioned);
    });
  }

  function makeFloatingDialogDraggable(dialog) {
    const handle = dialog.querySelector("[data-dialog-drag-handle]");
    if (!handle) return;
    let drag = null;

    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const rect = dialog.getBoundingClientRect();
      drag = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        left: rect.left,
        top: rect.top,
      };
      bringFloatingDialogToFront(dialog);
      dialog.classList.add("is-dragging");
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    handle.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const edge = 8;
      const rect = dialog.getBoundingClientRect();
      const maxLeft = Math.max(edge, window.innerWidth - rect.width - edge);
      const maxTop = Math.max(edge, window.innerHeight - rect.height - edge);
      const left = drag.left + event.clientX - drag.startX;
      const top = drag.top + event.clientY - drag.startY;
      dialog.style.right = "auto";
      dialog.style.left = `${Math.min(Math.max(edge, left), maxLeft)}px`;
      dialog.style.top = `${Math.min(Math.max(edge, top), maxTop)}px`;
    });

    const stopDragging = (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      if (handle.hasPointerCapture(event.pointerId)) {
        handle.releasePointerCapture(event.pointerId);
      }
      drag = null;
      dialog.dataset.positioned = "true";
      dialog.classList.remove("is-dragging");
    };
    handle.addEventListener("pointerup", stopDragging);
    handle.addEventListener("pointercancel", stopDragging);
    dialog.addEventListener("pointerdown", () => {
      bringFloatingDialogToFront(dialog);
    });
  }

  function setEnabled(enabled, announce = true) {
    state.enabled = Boolean(enabled);
    try {
      localStorage.setItem(
        STORAGE_KEYS.witchTrialEnabled,
        String(state.enabled),
      );
    } catch {
      // The mode remains available for the current session.
    }
    document.documentElement.dataset.appMode = state.enabled
      ? "witch-trial"
      : "notes";
    el.toggle.checked = state.enabled;
    el.standard.classList.toggle("hidden", state.enabled);
    el.root.classList.toggle("hidden", !state.enabled);
    el.badge.classList.toggle("hidden", !state.enabled);
    el.sidebarToggle.classList.toggle("hidden", state.enabled);
    if (!state.enabled) {
      [el.mapDialog, el.rulesDialog].forEach((dialog) => {
        if (dialog.open) dialog.close();
      });
    }
    document
      .querySelectorAll(".standard-mode-control")
      .forEach((control) => control.classList.toggle("hidden", state.enabled));
    if (state.enabled) render();
    iconRefresh();
    if (announce) {
      toast(
        state.enabled
          ? "魔法少女ノ魔女裁判モードを開始しました"
          : "通常のノートに戻りました",
      );
    }
  }

  function render() {
    el.caseTitle.value = data.title;
    renderCaseSwitcher();
    renderCharacterList();
    renderTabs();
    renderView();
    iconRefresh();
  }

  function renderCaseSwitcher() {
    el.caseSelect.innerHTML = caseBook.cases
      .map(
        (item, index) => `
          <option value="${escapeHtml(item.id)}"${item.id === data.id ? " selected" : ""}>
            ${escapeHtml(item.title || `事件 ${index + 1}`)}
          </option>`,
      )
      .join("");
  }

  function renderCharacterList() {
    const query = state.characterQuery.trim().toLocaleLowerCase("ja-JP");
    const deceasedCount = CHARACTERS.filter(
      (character) => data.characterFiles[character.id].isDead,
    ).length;
    if (deceasedCount === 0) state.showDeceased = false;
    const visibleCharacters = CHARACTERS.filter(
      (character) =>
        (state.showDeceased || !data.characterFiles[character.id].isDead) &&
        character.name.toLocaleLowerCase("ja-JP").includes(query),
    );
    el.characterCount.textContent = String(visibleCharacters.length);
    el.deceasedCount.textContent = String(deceasedCount);
    el.showDeceased.checked = state.showDeceased;
    el.showDeceased.disabled = deceasedCount === 0;
    el.characterList.innerHTML = CHARACTER_GROUPS.map((group) => {
      const groupCharacters = visibleCharacters.filter(
        (character) => (character.group || "prisoner") === group.id,
      );
      if (!groupCharacters.length) return "";
      const rows = groupCharacters
        .map((character) => {
          const file = data.characterFiles[character.id];
          const hasDetails = Boolean(file.note.trim());
          return `
            <button
              class="trial-character-row${
                data.selectedCharacterId === character.id ? " is-active" : ""
              }${
                data.openCharacterIds.includes(character.id) ? " is-open" : ""
              }${file.isDead ? " is-deceased" : ""}"
              type="button"
              data-character-id="${character.id}"
              aria-label="${escapeHtml(character.name)}。クリックでプレビュー、ダブルクリックでタブを固定"
              aria-current="${
                data.selectedCharacterId === character.id ? "true" : "false"
              }"
            >
              <img src="${character.image}" alt="" />
              <span class="trial-character-row-copy">
                <strong>${escapeHtml(character.name)}</strong>
                <small class="trial-detail-state${
                  hasDetails ? " has-details" : ""
                }${file.isDead ? " is-deceased" : ""}">
                  <i data-lucide="${
                    file.isDead
                      ? "skull"
                      : hasDetails
                        ? "file-check-2"
                        : "file-pen-line"
                  }" aria-hidden="true"></i>
                  ${
                    file.isDead
                      ? "死亡"
                      : hasDetails
                        ? "記録あり"
                        : "未記録"
                  }
                </small>
              </span>
              <i data-lucide="${
                data.openCharacterIds.includes(character.id)
                  ? "panel-top-open"
                  : "chevron-right"
              }" aria-hidden="true"></i>
            </button>`;
        })
        .join("");
      return `
        <section class="trial-character-group is-${group.id}" aria-label="${group.label}">
          <div class="trial-character-group-heading">
            <span>
              <i data-lucide="${group.icon}" aria-hidden="true"></i>
              ${group.label}
            </span>
            <small>${groupCharacters.length}</small>
          </div>
          ${rows}
        </section>`;
    }).join("");
    if (!visibleCharacters.length) {
      el.characterList.innerHTML = `
        <div class="trial-no-results">
          <i data-lucide="user-round-x" aria-hidden="true"></i>
          <p>該当する人物はいません</p>
        </div>`;
    }
    el.characterList
      .querySelectorAll("[data-character-id]")
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          if (event.detail > 1) return;
          queueCharacterTabActivation(button.dataset.characterId);
        });
        button.addEventListener("dblclick", (event) => {
          event.preventDefault();
          openCharacterTab(button.dataset.characterId, { pinned: true });
        });
      });
    iconRefresh();
  }

  function queueCharacterTabActivation(characterId) {
    clearTimeout(state.tabActivationTimer);
    state.tabActivationTimer = setTimeout(() => {
      state.tabActivationTimer = null;
      openCharacterTab(characterId);
    }, 180);
  }

  function selectCharacterTab(characterId) {
    const previousCharacterId = data.selectedCharacterId;
    const splitIndex = data.splitCharacterIds.indexOf(characterId);
    if (splitIndex >= 0 && previousCharacterId !== characterId) {
      data.splitCharacterIds[splitIndex] = previousCharacterId;
      data.splitCharacterIds = [
        ...new Set(
          data.splitCharacterIds.filter((id) => id !== characterId),
        ),
      ];
    }
    data.selectedCharacterId = characterId;
  }

  function openCharacterTab(characterId, { pinned = false } = {}) {
    clearTimeout(state.tabActivationTimer);
    state.tabActivationTimer = null;
    const character = findCharacter(characterId);
    if (!data.openCharacterIds.includes(character.id)) {
      const previewIndex = data.previewCharacterId
        ? data.openCharacterIds.indexOf(data.previewCharacterId)
        : -1;
      if (previewIndex >= 0) {
        data.splitCharacterIds = data.splitCharacterIds.filter(
          (id) => id !== data.previewCharacterId,
        );
        data.openCharacterIds.splice(previewIndex, 1, character.id);
      } else {
        data.openCharacterIds.push(character.id);
      }
      data.previewCharacterId = pinned ? null : character.id;
    } else if (pinned && data.previewCharacterId === character.id) {
      data.previewCharacterId = null;
    }
    selectCharacterTab(character.id);
    data.activeView = "board";
    persist();
    render();
  }

  function closeCharacterTab(characterId) {
    if (data.openCharacterIds.length <= 1) return;
    const closingIndex = data.openCharacterIds.indexOf(characterId);
    if (closingIndex < 0) return;
    data.openCharacterIds.splice(closingIndex, 1);
    if (data.previewCharacterId === characterId) {
      data.previewCharacterId = null;
    }
    data.splitCharacterIds = data.splitCharacterIds.filter(
      (id) => id !== characterId,
    );
    if (data.selectedCharacterId === characterId) {
      const nextCharacterId =
        data.splitCharacterIds[0] ||
        data.openCharacterIds[
          Math.min(closingIndex, data.openCharacterIds.length - 1)
        ];
      data.selectedCharacterId = nextCharacterId;
      data.splitCharacterIds = data.splitCharacterIds.filter(
        (id) => id !== nextCharacterId,
      );
    }
    persist();
    render();
  }

  function addCharacterSplit() {
    const nextCharacterId = [...data.openCharacterIds]
      .reverse()
      .find(
        (characterId) =>
          characterId !== data.selectedCharacterId &&
          !data.splitCharacterIds.includes(characterId),
      );
    if (!nextCharacterId) return;
    data.splitCharacterIds.push(nextCharacterId);
    if (data.previewCharacterId === nextCharacterId) {
      data.previewCharacterId = null;
    }
    persist();
    renderBoard();
    renderCharacterList();
    iconRefresh();
  }

  function removeCharacterSplit(characterId) {
    data.splitCharacterIds = data.splitCharacterIds.filter(
      (id) => id !== characterId,
    );
    persist();
    renderBoard();
    renderCharacterList();
    iconRefresh();
  }

  function closeCharacterSplits() {
    if (!data.splitCharacterIds.length) return;
    data.splitCharacterIds = [];
    persist();
    renderBoard();
    renderCharacterList();
    iconRefresh();
  }

  function renderTabs() {
    el.tabs.forEach((button) => {
      const active = button.dataset.trialView === data.activeView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "page" : "false");
    });
  }

  function renderView() {
    state.characterEditors.forEach((editor) => editor.toTextArea());
    state.characterEditors = [];
    state.textareaResizeObserver?.disconnect();
    state.textareaResizeObserver = null;
    el.view.classList.toggle("is-board", data.activeView === "board");
    if (data.activeView === "reference") {
      renderReference();
    } else if (data.activeView === "case") {
      renderCaseFile();
    } else {
      renderBoard();
    }
    iconRefresh();
  }

  function renderFieldCard({
    field,
    value,
    id,
    dataAttributes,
    heightKey,
    className = "",
  }) {
    const hasValue = Boolean(value.trim());
    return `
      <section class="trial-character-section${field.wide ? " is-wide" : ""}${hasValue ? " has-value" : ""}">
        <div class="trial-field-heading">
          <label class="trial-field-label" for="${id}">
            <i data-lucide="${field.icon}" aria-hidden="true"></i>
            <span class="trial-field-title">
              <strong>${field.label}</strong>
              <small>${field.hint}</small>
            </span>
          </label>
          <button
            class="trial-template-button"
            type="button"
            data-insert-template="${id}"
            data-template="${escapeHtml(field.template)}"
            aria-label="${field.label}の記録テンプレートを挿入"
          >
            <i data-lucide="list-plus" aria-hidden="true"></i>
            型を挿入
          </button>
        </div>
        <textarea
          id="${id}"
          class="trial-dossier-note ${className}"
          ${dataAttributes}
          data-textarea-height-key="${heightKey}"
          maxlength="10000"
          placeholder="${escapeHtml(field.placeholder)}"
        >${escapeHtml(value)}</textarea>
        <div class="trial-field-status">
          <span class="${hasValue ? "is-complete" : ""}">
            <i data-lucide="${hasValue ? "check-circle-2" : "circle-dashed"}" aria-hidden="true"></i>
            ${hasValue ? "記録あり" : "未記録"}
          </span>
          <small data-character-count="${id}">${value.length.toLocaleString("ja-JP")} / 10,000</small>
        </div>
      </section>`;
  }

  function bindFieldEnhancements(scope) {
    scope.querySelectorAll("[data-insert-template]").forEach((button) => {
      button.addEventListener("click", () => {
        const textarea = scope.querySelector(
          `#${CSS.escape(button.dataset.insertTemplate)}`,
        );
        if (!textarea) return;
        const template = button.dataset.template;
        const insertion = textarea.value.trim()
          ? `\n\n${template}`
          : template;
        textarea.setRangeText(
          insertion,
          textarea.selectionStart,
          textarea.selectionEnd,
          "end",
        );
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.focus();
      });
    });
  }

  function updateFieldCard(textarea) {
    const card = textarea.closest(".trial-character-section");
    const hasValue = Boolean(textarea.value.trim());
    card?.classList.toggle("has-value", hasValue);
    const status = card?.querySelector(".trial-field-status span");
    if (status) {
      status.classList.toggle("is-complete", hasValue);
      status.innerHTML = `
        <i data-lucide="${hasValue ? "check-circle-2" : "circle-dashed"}" aria-hidden="true"></i>
        ${hasValue ? "記録あり" : "未記録"}`;
    }
    const count = card?.querySelector("[data-character-count]");
    if (count) {
      count.textContent = `${textarea.value.length.toLocaleString("ja-JP")} / 10,000`;
    }
    iconRefresh();
  }

  function renderCaseFile() {
    const completed = CASE_FIELDS.filter((field) =>
      data.caseFile[field.key].trim(),
    ).length;
    el.view.innerHTML = `
      <div class="trial-content-page trial-case-file">
        <div class="trial-page-heading trial-investigation-heading">
          <div>
            <p class="trial-kicker">CASE INVESTIGATION</p>
            <h2>事件記録</h2>
            <p>現場の事実から裁判の争点まで、捜査の順に整理します。</p>
          </div>
          <div class="trial-progress" aria-label="事件記録 ${completed}/${CASE_FIELDS.length} 項目">
            <span>${completed}/${CASE_FIELDS.length}</span>
            <div><i style="width:${(completed / CASE_FIELDS.length) * 100}%"></i></div>
            <small>記録済み</small>
          </div>
        </div>
        <div class="trial-flow-rail" aria-label="捜査の流れ">
          <span class="is-active"><i>01</i>遺体発見</span>
          <b aria-hidden="true"></b>
          <span><i>02</i>現場検証</span>
          <b aria-hidden="true"></b>
          <span><i>03</i>証言照合</span>
          <b aria-hidden="true"></b>
          <span><i>04</i>魔女裁判</span>
        </div>
        <div class="trial-case-field-grid">
          ${CASE_FIELDS.map((field) =>
            renderFieldCard({
              field,
              value: data.caseFile[field.key],
              id: `trial-case-${field.key}`,
              dataAttributes: `data-case-field="${field.key}"`,
              heightKey: `case:${field.key}`,
              className: "trial-case-note",
            }),
          ).join("")}
        </div>
      </div>`;
    el.view.querySelectorAll("[data-case-field]").forEach((textarea) => {
      textarea.addEventListener("input", () => {
        data.caseFile[textarea.dataset.caseField] = textarea.value;
        updateFieldCard(textarea);
        const completed = CASE_FIELDS.filter((field) =>
          data.caseFile[field.key].trim(),
        ).length;
        const progress = el.view.querySelector(".trial-progress");
        if (progress) {
          progress.setAttribute(
            "aria-label",
            `事件記録 ${completed}/${CASE_FIELDS.length} 項目`,
          );
          progress.querySelector(":scope > span").textContent =
            `${completed}/${CASE_FIELDS.length}`;
          progress.querySelector("i").style.width =
            `${(completed / CASE_FIELDS.length) * 100}%`;
        }
        schedulePersist();
      });
    });
    bindFieldEnhancements(el.view);
    trackTextareaHeights();
  }

  function renderCharacterDossier(character, paneId) {
    const file = data.characterFiles[character.id];
    const editorId = `trial-${paneId}-${character.id}-note`;
    const hasNote = Boolean(file.note.trim());
    return `
        <section class="trial-dossier">
          <header class="trial-dossier-hero">
            <div class="trial-dossier-image">
              <img src="${character.image}" alt="${escapeHtml(character.name)}" />
              <span>SUBJECT ${String(CHARACTERS.indexOf(character) + 1).padStart(2, "0")}</span>
            </div>
            <div class="trial-dossier-heading">
              <div class="trial-dossier-identity">
                <p class="trial-kicker">CHARACTER DOSSIER</p>
                <h2>${escapeHtml(character.name)}</h2>
                <p class="trial-dossier-summary">
                  魔法とトラウマ、アリバイ、証言の矛盾を照合して魔女候補を検証します。
                </p>
              </div>
              <div class="trial-dossier-progress">
                <strong>${hasNote ? "記録あり" : "未記録"}</strong>
                <span>人物メモ</span>
              </div>
            </div>
            <div class="trial-dossier-status">
              <label class="trial-death-check">
                <input
                  type="checkbox"
                  data-character-deceased="${character.id}"
                  ${file.isDead ? "checked" : ""}
                />
                <span aria-hidden="true">
                  <i data-lucide="check"></i>
                </span>
                <strong>死亡</strong>
              </label>
            </div>
          </header>
          <div class="trial-dossier-body">
            <section class="trial-character-editor${hasNote ? " has-value" : ""}">
              <div class="trial-character-editor-heading">
                <label for="${editorId}">
                  <i data-lucide="file-pen-line" aria-hidden="true"></i>
                  <span>
                    <strong>人物メモ</strong>
                    <small>Markdown / Vim キーバインド対応</small>
                  </span>
                </label>
                <button
                  class="trial-template-button"
                  type="button"
                  data-insert-character-template="${character.id}"
                  aria-label="${escapeHtml(character.name)}の記録テンプレートを挿入"
                >
                  <i data-lucide="list-plus" aria-hidden="true"></i>
                  型を挿入
                </button>
              </div>
              <div class="trial-character-vim-editor">
                <textarea
                  id="${editorId}"
                  data-character-note="${character.id}"
                  aria-label="${escapeHtml(character.name)}の人物メモ"
                  placeholder="${escapeHtml(CHARACTER_NOTE_PLACEHOLDER)}"
                >${escapeHtml(file.note)}</textarea>
              </div>
              <div class="trial-character-editor-status">
                <span>
                  <b data-character-vim-mode="${character.id}">NORMAL</b>
                  <i data-character-cursor="${character.id}">1:1</i>
                </span>
                <small data-character-note-count="${character.id}">${file.note.length.toLocaleString("ja-JP")} 文字</small>
              </div>
            </section>
            <div class="trial-dossier-foot">
              <span><i data-lucide="keyboard" aria-hidden="true"></i><code>jj</code> でNORMAL、<code>:w</code> で保存</span>
              <span><i data-lucide="save" aria-hidden="true"></i>入力内容は自動保存</span>
            </div>
          </div>
        </section>`;
  }

  function mountCharacterEditors() {
    el.view.querySelectorAll("[data-character-note]").forEach((textarea) => {
      const characterId = textarea.dataset.characterNote;
      const file = data.characterFiles[characterId];
      const section = textarea.closest(".trial-character-editor");
      const mode = section.querySelector("[data-character-vim-mode]");
      const cursor = section.querySelector("[data-character-cursor]");
      const count = section.querySelector("[data-character-note-count]");
      const editor = createVimMarkdownEditor(textarea, {
        onSave: () => {
          persist();
          toast(`${findCharacter(characterId).name}の人物メモを保存しました`);
        },
        onClearSearch: () => {
          clearVimSearch(editor);
          toast("検索ハイライトを解除しました");
        },
      });
      state.characterEditors.push(editor);

      editor.on("change", () => {
        const wasFilled = Boolean(file.note.trim());
        file.note = editor.getValue();
        const isFilled = Boolean(file.note.trim());
        section.classList.toggle("has-value", isFilled);
        count.textContent = `${file.note.length.toLocaleString("ja-JP")} 文字`;
        const progress = section
          .closest(".trial-dossier")
          ?.querySelector(".trial-dossier-progress strong");
        if (progress) progress.textContent = isFilled ? "記録あり" : "未記録";
        schedulePersist();
        if (wasFilled !== isFilled) renderCharacterList();
      });
      editor.on("cursorActivity", () => {
        const position = editor.getCursor();
        cursor.textContent = `${position.line + 1}:${position.ch + 1}`;
      });
      editor.on("vim-mode-change", (nextMode) => {
        mode.textContent = (nextMode.mode || "normal").toUpperCase();
      });
      editor.refresh();
    });

    el.view
      .querySelectorAll("[data-insert-character-template]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const textarea = el.view.querySelector(
            `[data-character-note="${CSS.escape(button.dataset.insertCharacterTemplate)}"]`,
          );
          const editor = state.characterEditors.find(
            (item) => item.getTextArea() === textarea,
          );
          if (!editor) return;
          const insertion = editor.getValue().trim()
            ? `\n\n${CHARACTER_NOTE_TEMPLATE}`
            : CHARACTER_NOTE_TEMPLATE;
          editor.replaceSelection(insertion, "end");
          editor.focus();
        });
      });
  }

  function renderBoard() {
    const primaryCharacter = findCharacter(data.selectedCharacterId);
    const splitCharacters = data.splitCharacterIds.map(findCharacter);
    const paneCharacters = [primaryCharacter, ...splitCharacters];
    const splitCharacterIdSet = new Set(data.splitCharacterIds);
    const openCharacters = data.openCharacterIds.map(findCharacter);
    const nextSplitCharacter = [...openCharacters]
      .reverse()
      .find(
        (character) =>
          character.id !== primaryCharacter.id &&
          !splitCharacterIdSet.has(character.id),
      );
    el.view.innerHTML = `
      <div class="trial-board-shell">
        <div class="trial-character-tabs">
          <div
            class="trial-character-tab-list"
            role="tablist"
            aria-label="開いている人物ファイル"
          >
            ${openCharacters
              .map((character) => {
                const isActive = character.id === primaryCharacter.id;
                const isSplitPane = splitCharacterIdSet.has(character.id);
                const isPreview = character.id === data.previewCharacterId;
                return `
                  <div class="trial-character-tab-wrap${
                    isActive ? " is-active" : ""
                  }${isSplitPane ? " is-secondary" : ""}${
                    isPreview ? " is-preview" : ""
                  }">
                    <button
                      class="trial-character-tab"
                      type="button"
                      role="tab"
                      aria-selected="${isActive}"
                      tabindex="${isActive ? "0" : "-1"}"
                      data-character-tab="${character.id}"
                      aria-label="${escapeHtml(character.name)}${
                        isPreview ? "、プレビュー。ダブルクリックで固定" : ""
                      }"
                      ${isPreview ? 'data-tooltip="ダブルクリックでタブを固定"' : ""}
                    >
                      <img src="${character.image}" alt="" />
                      <span>${escapeHtml(character.name)}</span>
                      ${
                        isSplitPane
                          ? '<i data-lucide="columns-2" aria-hidden="true"></i>'
                          : ""
                      }
                    </button>
                    <button
                      class="trial-character-tab-close"
                      type="button"
                      data-close-character-tab="${character.id}"
                      aria-label="${escapeHtml(character.name)}のタブを閉じる"
                      ${openCharacters.length === 1 ? "disabled" : ""}
                    >
                      <i data-lucide="x" aria-hidden="true"></i>
                    </button>
                  </div>`;
              })
              .join("")}
          </div>
          <div class="trial-character-tab-actions">
            <button
              class="trial-split-button"
              type="button"
              data-add-character-split
              aria-label="分割ペインを追加"
              data-tooltip="${
                nextSplitCharacter
                  ? `${escapeHtml(nextSplitCharacter.name)}を分割ペインに追加`
                  : "分割できる人物タブがありません"
              }"
              ${nextSplitCharacter ? "" : "disabled"}
            >
              <i data-lucide="columns-3" aria-hidden="true"></i>
              <span>分割を追加</span>
            </button>
            ${
              splitCharacters.length
                ? `
                  <button
                    class="trial-split-button is-active"
                    type="button"
                    data-close-character-splits
                    aria-label="分割表示を終了"
                    data-tooltip="分割表示を終了"
                  >
                    <i data-lucide="panel-top-close" aria-hidden="true"></i>
                    <span>分割を終了</span>
                  </button>`
                : ""
            }
          </div>
        </div>
        <div
          class="trial-dossier-grid${splitCharacters.length ? " is-split" : ""}${
            paneCharacters.length >= 3 ? " is-multi-split" : ""
          }"
          style="--trial-pane-count:${paneCharacters.length}"
        >
          ${paneCharacters
            .map(
              (character, index) => `
                <article
                  class="trial-dossier-pane${index === 0 ? " is-primary" : " is-secondary"}"
                  aria-label="${escapeHtml(character.name)}の人物ファイル"
                >
                  ${
                    index > 0
                      ? `
                        <div class="trial-dossier-pane-toolbar">
                          <span>${escapeHtml(character.name)}</span>
                          <button
                            type="button"
                            data-remove-character-split="${character.id}"
                            aria-label="${escapeHtml(character.name)}の分割ペインを閉じる"
                            data-tooltip="この分割ペインを閉じる"
                          >
                            <i data-lucide="x" aria-hidden="true"></i>
                          </button>
                        </div>`
                      : ""
                  }
                  <div class="trial-dashboard">
                    ${renderCharacterDossier(character, `pane-${index}`)}
                  </div>
                </article>`,
            )
            .join("")}
        </div>
      </div>`;

    el.view.querySelectorAll("[data-character-tab]").forEach((button) => {
      button.addEventListener("click", (event) => {
        if (event.detail > 1) return;
        queueCharacterTabActivation(button.dataset.characterTab);
      });
      button.addEventListener("dblclick", (event) => {
        event.preventDefault();
        openCharacterTab(button.dataset.characterTab, { pinned: true });
      });
      button.addEventListener("auxclick", (event) => {
        if (event.button !== 1) return;
        event.preventDefault();
        closeCharacterTab(button.dataset.characterTab);
      });
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        const currentIndex = data.openCharacterIds.indexOf(
          button.dataset.characterTab,
        );
        const direction = event.key === "ArrowRight" ? 1 : -1;
        const nextIndex =
          (currentIndex + direction + data.openCharacterIds.length) %
          data.openCharacterIds.length;
        openCharacterTab(data.openCharacterIds[nextIndex]);
      });
    });
    el.view
      .querySelectorAll("[data-close-character-tab]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          closeCharacterTab(button.dataset.closeCharacterTab);
        });
      });
    el.view
      .querySelector("[data-add-character-split]")
      .addEventListener("click", addCharacterSplit);
    el.view
      .querySelector("[data-close-character-splits]")
      ?.addEventListener("click", closeCharacterSplits);
    el.view
      .querySelectorAll("[data-remove-character-split]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          removeCharacterSplit(button.dataset.removeCharacterSplit);
        });
      });

    mountCharacterEditors();
    el.view
      .querySelectorAll("[data-character-deceased]")
      .forEach((checkbox) => {
        checkbox.addEventListener("change", (event) => {
          const character = findCharacter(
            event.target.dataset.characterDeceased,
          );
          const file = data.characterFiles[character.id];
          file.isDead = event.target.checked;
          persist();
          renderCharacterList();
          toast(
            file.isDead
              ? `${character.name}を死亡者として一覧から非表示にしました`
              : `${character.name}を人物一覧に戻しました`,
          );
        });
      });
  }

  function renderMapDialog() {
    const map = findMap(data.selectedMapId);
    el.mapDialogBody.innerHTML = `
      <div class="trial-modal-page">
        <div class="trial-page-heading">
          <div>
            <p class="trial-kicker">FLOOR SELECT</p>
            <h3>${map.name} フロア</h3>
            <p>表示するフロアを切り替えられます。</p>
          </div>
          <div class="trial-floor-switch" role="group" aria-label="フロア">
            ${MAPS.map(
              (item) => `
                <button
                  class="${item.id === map.id ? "is-active" : ""}"
                  type="button"
                  data-map-id="${item.id}"
                >${item.name}</button>`,
            ).join("")}
          </div>
        </div>
        <figure class="trial-map-figure">
          <img src="${map.image}" alt="${map.name}の屋敷マップ" />
          <figcaption>
            <span><i data-lucide="map-pin" aria-hidden="true"></i>${map.name}</span>
          </figcaption>
        </figure>
      </div>`;
    el.mapDialogBody.querySelectorAll("[data-map-id]").forEach((button) => {
      button.addEventListener("click", () => {
        data.selectedMapId = button.dataset.mapId;
        persist();
        renderMapDialog();
      });
    });
    iconRefresh();
  }

  function openMapDialog() {
    renderMapDialog();
    openFloatingDialog(el.mapDialog);
  }

  function renderRulesMarkdown(markdown) {
    const parsed = window.marked
      ? window.marked.parse(markdown)
      : `<pre>${escapeHtml(markdown)}</pre>`;
    return window.DOMPurify ? window.DOMPurify.sanitize(parsed) : parsed;
  }

  async function loadRules() {
    if (state.rulesHtml) {
      el.rulesContent.innerHTML = state.rulesHtml;
      return;
    }
    if (!state.rulesPromise) {
      state.rulesPromise = fetch("./Assets/規則.md")
        .then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
        .then((markdown) => {
          state.rulesHtml = renderRulesMarkdown(markdown);
          return state.rulesHtml;
        })
        .catch((error) => {
          state.rulesPromise = null;
          throw error;
        });
    }
    try {
      el.rulesContent.innerHTML = await state.rulesPromise;
    } catch (error) {
      el.rulesContent.innerHTML = `
        <div class="trial-modal-error">
          <i data-lucide="triangle-alert" aria-hidden="true"></i>
          <div>
            <strong>規則を読み込めませんでした</strong>
            <p>ページを再読み込みして、もう一度お試しください。</p>
          </div>
        </div>`;
      console.error(error);
    }
    iconRefresh();
  }

  function openRulesDialog() {
    openFloatingDialog(el.rulesDialog);
    loadRules();
  }

  function renderReference() {
    el.view.innerHTML = `
      <div class="trial-content-page">
        <div class="trial-page-heading">
          <div>
            <p class="trial-kicker">REFERENCE / REGULATIONS</p>
            <h2>裁判資料</h2>
            <p>推理中に確認したい用語と牢屋敷の規則です。</p>
          </div>
          <div class="trial-page-icon"><i data-lucide="book-open-text" aria-hidden="true"></i></div>
        </div>
        <div class="trial-reference-grid">
          <section class="trial-reference-card">
            <div class="trial-reference-title">
              <i data-lucide="sparkles" aria-hidden="true"></i>
              <div><p class="trial-kicker">TERMS</p><h3>重要用語</h3></div>
            </div>
            <dl>
              <div><dt>魔女</dt><dd>国に災厄をもたらす不死の存在。魔女化につれ殺意や妄想に支配される。</dd></div>
              <div><dt>魔女因子</dt><dd>魔女となる者が生まれつき持つ因子。強いストレスで活性化する。</dd></div>
              <div><dt>なれはて</dt><dd>完全に魔女化した者が行き着く、人の形を失った存在。</dd></div>
              <div><dt>処刑</dt><dd>耐え難い苦痛を与え、完全な魔女化を短時間で進行させる儀式。</dd></div>
              <div><dt>大魔女</dt><dd>ゴクチョーによれば、見つけることで何かが起こる存在。</dd></div>
            </dl>
          </section>
          <section class="trial-reference-card trial-reference-rules">
            <div class="trial-reference-title">
              <i data-lucide="scroll-text" aria-hidden="true"></i>
              <div><p class="trial-kicker">FULL REGULATIONS</p><h3>牢屋敷の規則</h3></div>
            </div>
            <div class="trial-reference-rules-copy">
              <p>
                生活規則、見張りの巡回、自由時間、魔女裁判、時間割を
                <code>規則.md</code> から読み込み、読みやすい全文表示で確認できます。
              </p>
              <button type="button" data-open-rules>
                <i data-lucide="maximize-2" aria-hidden="true"></i>
                規則をモーダルで開く
              </button>
            </div>
          </section>
        </div>
      </div>`;
    el.view
      .querySelector("[data-open-rules]")
      .addEventListener("click", openRulesDialog);
  }

  function exportCase() {
    persist();
    const lines = [
      `# ${data.title}`,
      "",
      `書き出し日時: ${new Date().toLocaleString("ja-JP")}`,
      "",
      "## 事件記録",
      "",
      ...CASE_FIELDS.flatMap((field) => [
        `### ${field.label}`,
        "",
        data.caseFile[field.key] || "_記録なし_",
        "",
      ]),
      "## 人物記録",
      "",
    ];
    CHARACTERS.forEach((character) => {
      const file = data.characterFiles[character.id];
      lines.push(
        `### ${character.name}`,
        "",
        `- 死亡: ${file.isDead ? "はい" : "いいえ"}`,
        "",
        file.note || "_記録なし_",
        "",
      );
    });
    lines.push("## 屋敷マップ", "");
    MAPS.forEach((map) => {
      lines.push(
        `### ${map.name}`,
        "",
        `![${map.name}](${map.image})`,
        "",
      );
    });
    const filename = `${data.title.replace(/[\\/:*?"<>|]/g, "_") || "捜査記録"}.md`;
    downloadText(filename, lines.join("\n"), "text/markdown;charset=utf-8");
    toast("捜査記録を書き出しました");
  }

  el.settingsButton.addEventListener("click", () => {
    el.toggle.checked = state.enabled;
    el.settingsDialog.showModal();
  });
  el.toggle.addEventListener("change", () => {
    setEnabled(el.toggle.checked);
    el.settingsDialog.close();
  });
  el.characterSearch.addEventListener("input", () => {
    state.characterQuery = el.characterSearch.value;
    renderCharacterList();
  });
  el.showDeceased.addEventListener("change", () => {
    state.showDeceased = el.showDeceased.checked;
    renderCharacterList();
  });
  el.caseSelect.addEventListener("change", () => {
    const selected = caseBook.cases.find(
      (item) => item.id === el.caseSelect.value,
    );
    if (!selected) return;
    persist();
    data = selected;
    caseBook.activeCaseId = data.id;
    state.showDeceased = false;
    persist();
    render();
    toast(`${data.title}を開きました`);
  });
  el.newCaseButton.addEventListener("click", () => {
    persist();
    const nextNumber = caseBook.cases.length + 1;
    const newCase = defaultCase(`新しい事件 ${nextNumber}`);
    caseBook.cases.push(newCase);
    caseBook.activeCaseId = newCase.id;
    data = newCase;
    state.showDeceased = false;
    persist();
    render();
    el.caseTitle.focus();
    el.caseTitle.select();
    toast("新しい事件ファイルを追加しました");
  });
  el.caseTitle.addEventListener("input", () => {
    data.title = el.caseTitle.value.trimStart().slice(0, 60);
    renderCaseSwitcher();
    schedulePersist();
  });
  el.caseTitle.addEventListener("blur", () => {
    if (!data.title.trim()) {
      data.title = "名称未設定の事件";
      el.caseTitle.value = data.title;
    }
    persist();
  });
  el.tabs.forEach((button) => {
    button.addEventListener("click", () => {
      data.activeView = button.dataset.trialView;
      persist();
      renderTabs();
      renderView();
    });
  });
  el.mapButton.addEventListener("click", openMapDialog);
  el.mapMobileButton.addEventListener("click", openMapDialog);
  el.rulesButton.addEventListener("click", openRulesDialog);
  [el.mapDialog, el.rulesDialog].forEach(makeFloatingDialogDraggable);
  window.addEventListener("resize", () => {
    [el.mapDialog, el.rulesDialog].forEach((dialog) => {
      constrainFloatingDialog(dialog);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key !== "Escape" ||
      document.querySelector(
        "dialog[open]:not(#trial-map-dialog):not(#trial-rules-dialog)",
      )
    ) {
      return;
    }
    const openDialogs = [el.mapDialog, el.rulesDialog].filter(
      (dialog) => dialog.open,
    );
    if (!openDialogs.length) return;
    openDialogs
      .sort(
        (a, b) =>
          Number.parseInt(a.style.zIndex || "0", 10) -
          Number.parseInt(b.style.zIndex || "0", 10),
      )
      .at(-1)
      .close();
    event.preventDefault();
  });
  el.exportButton.addEventListener("click", exportCase);
  el.exportMobileButton.addEventListener("click", exportCase);
  window.addEventListener("beforeunload", persist);
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.witchTrialEnabled) {
      setEnabled(event.newValue === "true", false);
    }
  });

  setEnabled(state.enabled, false);

  return {
    isEnabled: () => state.enabled,
    openSettings: () => el.settingsDialog.showModal(),
  };
}

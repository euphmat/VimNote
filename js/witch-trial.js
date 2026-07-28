import { STORAGE_KEYS } from "./config.js";

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
    activeView: "board",
    selectedCharacterId: initialCharacterId,
    openCharacterIds: [initialCharacterId],
    previewCharacterId: initialCharacterId,
    splitCharacterIds: [],
    selectedMapId: "1f",
    textareaHeights: {},
    characterFiles: Object.fromEntries(
      CHARACTERS.map((character) => [
        character.id,
        {
          basicInfo: "",
          testimony: "",
          facts: "",
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
    const legacyDetails =
      typeof file.details === "string"
        ? file.details
        : typeof file.note === "string"
          ? file.note
          : "";
    characterFiles[character.id] = {
      basicInfo:
        typeof file.basicInfo === "string"
          ? file.basicInfo.slice(0, 10000)
          : legacyDetails.slice(0, 10000),
      testimony:
        typeof file.testimony === "string" ? file.testimony.slice(0, 10000) : "",
      facts: typeof file.facts === "string" ? file.facts.slice(0, 10000) : "",
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
    activeView: ["board", "reference"].includes(saved.activeView)
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
          Number.isFinite(height) &&
          height >= 40 &&
          height <= 5000,
      ),
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
    mapDialog: document.querySelector("#trial-map-dialog"),
    mapDialogBody: document.querySelector("#trial-map-dialog-body"),
    rulesButton: document.querySelector("#trial-rules-button"),
    rulesDialog: document.querySelector("#trial-rules-dialog"),
    rulesContent: document.querySelector("#trial-rules-content"),
    exportButton: document.querySelector("#trial-export-button"),
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
        JSON.stringify({ version: 5, ...caseBook }),
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
          const hasDetails = Boolean(
            file.basicInfo.trim() ||
              file.testimony.trim() ||
              file.facts.trim()
          );
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
                  ${file.isDead ? "死亡" : hasDetails ? "記録あり" : "記録未入力"}
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
    state.textareaResizeObserver?.disconnect();
    state.textareaResizeObserver = null;
    el.view.classList.toggle("is-board", data.activeView === "board");
    if (data.activeView === "reference") {
      renderReference();
    } else {
      renderBoard();
    }
    iconRefresh();
  }

  function renderCharacterDossier(character, paneId) {
    const file = data.characterFiles[character.id];
    const fieldId = (field) => `trial-${paneId}-${character.id}-${field}`;
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
                  人物情報・証言・確認済みの事実を、このファイルに集約します。
                </p>
              </div>
            </div>
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
          </header>
          <div class="trial-dossier-body">
            <div class="trial-character-sections">
              <section class="trial-character-section">
                <label class="trial-field-label" for="${fieldId("basic")}">
                  <i data-lucide="contact" aria-hidden="true"></i>
                  基本情報
                  <span>特徴・性格・関係性・経歴</span>
                </label>
                <textarea
                  id="${fieldId("basic")}"
                  class="trial-dossier-note"
                  data-character-id="${character.id}"
                  data-character-field="basicInfo"
                  data-textarea-height-key="character:${character.id}:basicInfo"
                  maxlength="10000"
                  placeholder="${escapeHtml(character.name)}のプロフィールや人物関係…"
                >${escapeHtml(file.basicInfo)}</textarea>
              </section>
              <section class="trial-character-section">
                <label class="trial-field-label" for="${fieldId("testimony")}">
                  <i data-lucide="messages-square" aria-hidden="true"></i>
                  証言
                  <span>本人の発言・他者からの証言</span>
                </label>
                <textarea
                  id="${fieldId("testimony")}"
                  class="trial-dossier-note"
                  data-character-id="${character.id}"
                  data-character-field="testimony"
                  data-textarea-height-key="character:${character.id}:testimony"
                  maxlength="10000"
                  placeholder="誰が、いつ、何を語ったか。引用や食い違いも記録…"
                >${escapeHtml(file.testimony)}</textarea>
              </section>
              <section class="trial-character-section">
                <label class="trial-field-label" for="${fieldId("facts")}">
                  <i data-lucide="badge-check" aria-hidden="true"></i>
                  事実
                  <span>証拠から確認できた客観的な情報</span>
                </label>
                <textarea
                  id="${fieldId("facts")}"
                  class="trial-dossier-note"
                  data-character-id="${character.id}"
                  data-character-field="facts"
                  data-textarea-height-key="character:${character.id}:facts"
                  maxlength="10000"
                  placeholder="推測と分けて、確認済みの事実だけを記録…"
                >${escapeHtml(file.facts)}</textarea>
              </section>
            </div>
            <div class="trial-dossier-foot">
              <span><i data-lucide="shield-alert" aria-hidden="true"></i>事実と推測を分けて記録</span>
            </div>
          </div>
        </section>`;
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

    el.view
      .querySelectorAll("[data-character-field]")
      .forEach((textarea) => {
        textarea.addEventListener("input", () => {
          const file = data.characterFiles[textarea.dataset.characterId];
          file[textarea.dataset.characterField] = textarea.value;
          schedulePersist();
          renderCharacterList();
        });
      });
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
    trackTextareaHeights();
  }

  function renderMapDialog() {
    const map = findMap(data.selectedMapId);
    el.mapDialogBody.innerHTML = `
      <div class="trial-modal-page">
        <div class="trial-page-heading">
          <div>
            <p class="trial-kicker">FLOOR SELECT</p>
            <h3>${map.name} フロア</h3>
            <p>図面と調査メモは事件ファイルごとに保存されます。</p>
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
        <div class="trial-map-layout">
          <figure class="trial-map-figure">
            <img src="${map.image}" alt="${map.name}の屋敷マップ" />
            <figcaption>
              <span><i data-lucide="map-pin" aria-hidden="true"></i>${map.name}</span>
            </figcaption>
          </figure>
          <div class="trial-map-notes">
            <div>
              <p class="trial-kicker">FLOOR NOTES</p>
              <h3>${map.name} 調査メモ</h3>
            </div>
            <textarea
              id="trial-map-note"
              data-textarea-height-key="map:${map.id}"
              maxlength="3000"
              placeholder="現場、証拠、移動経路、立入可能な時間…"
            >${escapeHtml(data.mapNotes[map.id])}</textarea>
            <p><i data-lucide="info" aria-hidden="true"></i>フロアを切り替えても自動保存されます</p>
          </div>
        </div>
      </div>`;
    el.mapDialogBody.querySelectorAll("[data-map-id]").forEach((button) => {
      button.addEventListener("click", () => {
        data.selectedMapId = button.dataset.mapId;
        persist();
        renderMapDialog();
      });
    });
    el.mapDialogBody
      .querySelector("#trial-map-note")
      .addEventListener("input", (event) => {
        data.mapNotes[map.id] = event.target.value;
        schedulePersist();
      });
    iconRefresh();
    if (el.mapDialog.open) requestAnimationFrame(trackTextareaHeights);
  }

  function openMapDialog() {
    renderMapDialog();
    el.mapDialog.showModal();
    requestAnimationFrame(trackTextareaHeights);
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
    el.rulesDialog.showModal();
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
        "#### 基本情報",
        "",
        file.basicInfo || "_記録なし_",
        "",
        "#### 証言",
        "",
        file.testimony || "_記録なし_",
        "",
        "#### 事実",
        "",
        file.facts || "_記録なし_",
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
        data.mapNotes[map.id] || "_記録なし_",
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
  el.rulesButton.addEventListener("click", openRulesDialog);
  el.mapDialog.addEventListener("close", trackTextareaHeights);
  el.exportButton.addEventListener("click", exportCase);
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

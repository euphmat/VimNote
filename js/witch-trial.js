import { STORAGE_KEYS } from "./config.js";

const CHARACTERS = Object.freeze([
  { id: "emma", name: "桜羽エマ", image: "./Assets/Character/桜羽エマ.JPG" },
  { id: "meruru", name: "氷上メルル", image: "./Assets/Character/氷上メルル.JPG" },
  { id: "nanoka", name: "黒部ナノカ", image: "./Assets/Character/黒部ナノカ.JPG" },
  { id: "coco", name: "沢渡ココ", image: "./Assets/Character/沢渡ココ.JPG" },
  { id: "reia", name: "蓮見レイア", image: "./Assets/Character/蓮見レイア.JPG" },
  { id: "miria", name: "佐伯ミリア", image: "./Assets/Character/佐伯ミリア.JPG" },
  { id: "hanna", name: "遠野ハンナ", image: "./Assets/Character/遠野ハンナ.JPG" },
  { id: "gokucho", name: "ゴクチョー", image: "./Assets/Character/ゴクチョー.JPG" },
  { id: "sherry", name: "橘シェリー", image: "./Assets/Character/橘シェリー.JPG" },
  { id: "alisa", name: "紫藤アリサ", image: "./Assets/Character/紫藤アリサ.JPG" },
  { id: "guard", name: "看守", image: "./Assets/Character/看守.JPG" },
  { id: "hiro", name: "二階堂ヒロ", image: "./Assets/Character/二階堂ヒロ.JPG" },
  { id: "margo", name: "宝生マーゴ", image: "./Assets/Character/宝生マーゴ.JPG" },
  { id: "noa", name: "城ヶ崎ノア", image: "./Assets/Character/城ヶ崎ノア.JPG" },
  { id: "anan", name: "夏目アンアン", image: "./Assets/Character/夏目アンアン.JPG" },
]);

const MAPS = Object.freeze([
  { id: "b1", name: "B1F", image: "./Assets/Boards/B1F.jpg" },
  { id: "1f", name: "1F", image: "./Assets/Boards/1F.jpg" },
  { id: "2f", name: "2F", image: "./Assets/Boards/2F.jpg" },
]);

const STATUSES = Object.freeze([
  { id: "unknown", label: "未確認" },
  { id: "clear", label: "シロ寄り" },
  { id: "watch", label: "要注意" },
  { id: "suspect", label: "最重要容疑" },
  { id: "victim", label: "被害者" },
]);

const CATEGORIES = Object.freeze({
  evidence: { label: "証拠", icon: "search-check" },
  testimony: { label: "証言", icon: "message-square-quote" },
  contradiction: { label: "矛盾", icon: "git-compare-arrows" },
  theory: { label: "仮説", icon: "lightbulb" },
});

const TIME_SLOTS = Object.freeze([
  { id: "06-10", time: "6:00–10:00", label: "朝の自由時間", note: "朝食／監房開錠" },
  { id: "10-12", time: "10:00–12:00", label: "監房滞在", note: "看守の管理チェック" },
  { id: "12-15", time: "12:00–15:00", label: "昼の自由時間", note: "昼食／屋敷内を移動可能" },
  { id: "15-17", time: "15:00–17:00", label: "監房滞在", note: "月曜15時は焼却炉が稼働" },
  { id: "17-22", time: "17:00–22:00", label: "夜の自由時間", note: "夕食／シャワー利用可能" },
  { id: "22-06", time: "22:00–翌6:00", label: "消灯・外出禁止", note: "監房内で就寝" },
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function defaultCase() {
  return {
    title: "第1の事件・捜査記録",
    activeView: "board",
    selectedCharacterId: CHARACTERS[0].id,
    selectedMapId: "1f",
    characterFiles: Object.fromEntries(
      CHARACTERS.map((character) => [
        character.id,
        { status: "unknown", note: "" },
      ]),
    ),
    memos: [],
    timeline: Object.fromEntries(TIME_SLOTS.map((slot) => [slot.id, ""])),
    mapNotes: Object.fromEntries(MAPS.map((map) => [map.id, ""])),
  };
}

function loadCase() {
  const fallback = defaultCase();
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.witchTrialCase) || "null",
    );
    if (!saved || typeof saved !== "object") return fallback;
    const characterFiles = { ...fallback.characterFiles };
    CHARACTERS.forEach((character) => {
      const file = saved.characterFiles?.[character.id];
      if (!file || typeof file !== "object") return;
      characterFiles[character.id] = {
        status: STATUSES.some((status) => status.id === file.status)
          ? file.status
          : "unknown",
        note: typeof file.note === "string" ? file.note.slice(0, 5000) : "",
      };
    });
    return {
      title:
        typeof saved.title === "string" && saved.title.trim()
          ? saved.title.slice(0, 60)
          : fallback.title,
      activeView: ["board", "timeline", "map", "reference"].includes(
        saved.activeView,
      )
        ? saved.activeView
        : fallback.activeView,
      selectedCharacterId: CHARACTERS.some(
        (character) => character.id === saved.selectedCharacterId,
      )
        ? saved.selectedCharacterId
        : fallback.selectedCharacterId,
      selectedMapId: MAPS.some((map) => map.id === saved.selectedMapId)
        ? saved.selectedMapId
        : fallback.selectedMapId,
      characterFiles,
      memos: Array.isArray(saved.memos)
        ? saved.memos
            .filter((memo) => memo?.id && memo?.title)
            .slice(0, 300)
            .map((memo) => ({
              id: String(memo.id),
              category: CATEGORIES[memo.category] ? memo.category : "evidence",
              title: String(memo.title).slice(0, 80),
              body: typeof memo.body === "string" ? memo.body.slice(0, 2000) : "",
              asset: normalizeAsset(memo.asset),
              createdAt: Number(memo.createdAt) || Date.now(),
              updatedAt: Number(memo.updatedAt) || Number(memo.createdAt) || Date.now(),
            }))
        : [],
      timeline: Object.fromEntries(
        TIME_SLOTS.map((slot) => [
          slot.id,
          typeof saved.timeline?.[slot.id] === "string"
            ? saved.timeline[slot.id].slice(0, 3000)
            : "",
        ]),
      ),
      mapNotes: Object.fromEntries(
        MAPS.map((map) => [
          map.id,
          typeof saved.mapNotes?.[map.id] === "string"
            ? saved.mapNotes[map.id].slice(0, 3000)
            : "",
        ]),
      ),
    };
  } catch {
    return fallback;
  }
}

function normalizeAsset(asset) {
  if (
    asset?.kind === "character" &&
    CHARACTERS.some((character) => character.id === asset.id)
  ) {
    return { kind: "character", id: asset.id };
  }
  if (asset?.kind === "map" && MAPS.some((map) => map.id === asset.id)) {
    return { kind: "map", id: asset.id };
  }
  return null;
}

function findCharacter(id) {
  return CHARACTERS.find((character) => character.id === id) || CHARACTERS[0];
}

function findMap(id) {
  return MAPS.find((map) => map.id === id) || MAPS[1];
}

function assetDetails(asset) {
  if (asset?.kind === "character") return findCharacter(asset.id);
  if (asset?.kind === "map") return findMap(asset.id);
  return null;
}

function formatMemoDate(timestamp) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
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
  const data = loadCase();
  const state = {
    enabled: localStorage.getItem(STORAGE_KEYS.witchTrialEnabled) === "true",
    characterQuery: "",
    saveTimer: null,
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
    caseTitle: document.querySelector("#trial-case-title"),
    saveState: document.querySelector("#trial-save-state"),
    tabs: [...document.querySelectorAll("[data-trial-view]")],
    view: document.querySelector("#trial-view"),
    addMemo: document.querySelector("#trial-add-memo-button"),
    exportButton: document.querySelector("#trial-export-button"),
    memoDialog: document.querySelector("#trial-memo-dialog"),
    memoForm: document.querySelector("#trial-memo-form"),
    memoDialogTitle: document.querySelector("#trial-memo-dialog-title"),
    memoId: document.querySelector("#trial-memo-id"),
    memoCategory: document.querySelector("#trial-memo-category"),
    memoTitle: document.querySelector("#trial-memo-title"),
    memoBody: document.querySelector("#trial-memo-body"),
    assetPicker: document.querySelector("#trial-asset-picker"),
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
      localStorage.setItem(STORAGE_KEYS.witchTrialCase, JSON.stringify(data));
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
    renderCharacterList();
    renderTabs();
    renderView();
    iconRefresh();
  }

  function renderCharacterList() {
    const query = state.characterQuery.trim().toLocaleLowerCase("ja-JP");
    const visibleCharacters = CHARACTERS.filter((character) =>
      character.name.toLocaleLowerCase("ja-JP").includes(query),
    );
    el.characterCount.textContent = String(visibleCharacters.length);
    el.characterList.innerHTML = visibleCharacters
      .map((character) => {
        const file = data.characterFiles[character.id];
        const status =
          STATUSES.find((item) => item.id === file.status) || STATUSES[0];
        return `
          <button
            class="trial-character-row${
              data.selectedCharacterId === character.id ? " is-active" : ""
            }"
            type="button"
            data-character-id="${character.id}"
          >
            <img src="${character.image}" alt="" />
            <span class="trial-character-row-copy">
              <strong>${escapeHtml(character.name)}</strong>
              <small class="trial-status is-${file.status}">
                <i aria-hidden="true"></i>${status.label}
              </small>
            </span>
            <i data-lucide="chevron-right" aria-hidden="true"></i>
          </button>`;
      })
      .join("");
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
        button.addEventListener("click", () => {
          data.selectedCharacterId = button.dataset.characterId;
          data.activeView = "board";
          persist();
          render();
        });
      });
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
    if (data.activeView === "timeline") {
      renderTimeline();
    } else if (data.activeView === "map") {
      renderMap();
    } else if (data.activeView === "reference") {
      renderReference();
    } else {
      renderBoard();
    }
    iconRefresh();
  }

  function renderBoard() {
    const character = findCharacter(data.selectedCharacterId);
    const file = data.characterFiles[character.id];
    const suspectCount = Object.values(data.characterFiles).filter(
      (item) => item.status === "suspect",
    ).length;
    const reviewedCount = Object.values(data.characterFiles).filter(
      (item) => item.status !== "unknown",
    ).length;
    const memoCards = [...data.memos]
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .map(renderMemoCard)
      .join("");
    el.view.innerHTML = `
      <div class="trial-dashboard">
        <section class="trial-overview-card">
          <div>
            <p class="trial-kicker">INVESTIGATION STATUS</p>
            <h2>事実を集め、矛盾を見つける。</h2>
            <p>人物の供述と時間、場所を照合し、裁判までに推理を組み立てます。</p>
          </div>
          <div class="trial-stat-grid">
            <div><strong>${data.memos.length}</strong><span>事件メモ</span></div>
            <div><strong>${reviewedCount}<small> / ${CHARACTERS.length}</small></strong><span>人物確認</span></div>
            <div class="is-alert"><strong>${suspectCount}</strong><span>最重要容疑</span></div>
          </div>
        </section>

        <section class="trial-dossier">
          <div class="trial-dossier-image">
            <img src="${character.image}" alt="${escapeHtml(character.name)}" />
            <span>SUBJECT ${String(CHARACTERS.indexOf(character) + 1).padStart(2, "0")}</span>
          </div>
          <div class="trial-dossier-body">
            <div class="trial-dossier-heading">
              <div>
                <p class="trial-kicker">CHARACTER DOSSIER</p>
                <h2>${escapeHtml(character.name)}</h2>
              </div>
              <label class="trial-status-select">
                <span>判定</span>
                <select id="trial-character-status">
                  ${STATUSES.map(
                    (status) =>
                      `<option value="${status.id}"${
                        status.id === file.status ? " selected" : ""
                      }>${status.label}</option>`,
                  ).join("")}
                </select>
              </label>
            </div>
            <label class="trial-field-label" for="trial-character-note">
              人物メモ
              <span>供述・アリバイ・関係性</span>
            </label>
            <textarea
              id="trial-character-note"
              class="trial-dossier-note"
              maxlength="5000"
              placeholder="${escapeHtml(character.name)}の発言、アリバイ、気になる行動を記録…"
            >${escapeHtml(file.note)}</textarea>
            <div class="trial-dossier-foot">
              <span><i data-lucide="shield-alert" aria-hidden="true"></i>事実と推測を分けて記録</span>
              <button id="trial-memo-for-character" type="button">
                <i data-lucide="image-plus" aria-hidden="true"></i>
                この人物の画像でメモ
              </button>
            </div>
          </div>
        </section>

        <section class="trial-memos-section">
          <div class="trial-section-heading">
            <div>
              <p class="trial-kicker">CASE NOTES</p>
              <h2>事件メモ</h2>
            </div>
            <button id="trial-inline-add-memo" class="trial-secondary-button" type="button">
              <i data-lucide="plus" aria-hidden="true"></i>追加
            </button>
          </div>
          ${
            memoCards
              ? `<div class="trial-memo-grid">${memoCards}</div>`
              : `<div class="trial-empty-state">
                  <div><i data-lucide="notebook-pen" aria-hidden="true"></i></div>
                  <h3>最初の手がかりを記録しましょう</h3>
                  <p>人物または屋敷マップの画像を添えて、証拠・証言・矛盾・仮説を整理できます。</p>
                  <button id="trial-empty-add-memo" class="trial-primary-button" type="button">
                    <i data-lucide="plus" aria-hidden="true"></i>事件メモを作成
                  </button>
                </div>`
          }
        </section>
      </div>`;

    el.view
      .querySelector("#trial-character-status")
      .addEventListener("change", (event) => {
        file.status = event.target.value;
        persist();
        renderCharacterList();
        renderBoard();
      });
    el.view
      .querySelector("#trial-character-note")
      .addEventListener("input", (event) => {
        file.note = event.target.value;
        schedulePersist();
      });
    el.view
      .querySelector("#trial-memo-for-character")
      .addEventListener("click", () =>
        openMemoDialog(null, { kind: "character", id: character.id }),
      );
    [
      el.view.querySelector("#trial-inline-add-memo"),
      el.view.querySelector("#trial-empty-add-memo"),
    ]
      .filter(Boolean)
      .forEach((button) =>
        button.addEventListener("click", () => openMemoDialog()),
      );
    bindMemoCardActions();
  }

  function renderMemoCard(memo) {
    const category = CATEGORIES[memo.category];
    const asset = assetDetails(memo.asset);
    return `
      <article class="trial-memo-card is-${memo.category}">
        ${
          asset
            ? `<div class="trial-memo-image">
                <img src="${asset.image}" alt="${escapeHtml(asset.name)}" />
                <span>${escapeHtml(asset.name)}</span>
              </div>`
            : ""
        }
        <div class="trial-memo-card-body">
          <div class="trial-memo-meta">
            <span><i data-lucide="${category.icon}" aria-hidden="true"></i>${category.label}</span>
            <time>${formatMemoDate(memo.updatedAt)}</time>
          </div>
          <h3>${escapeHtml(memo.title)}</h3>
          ${
            memo.body
              ? `<p>${escapeHtml(memo.body).replaceAll("\n", "<br>")}</p>`
              : '<p class="is-empty">内容は未記入です</p>'
          }
          <div class="trial-memo-actions">
            <button type="button" data-edit-memo="${memo.id}">
              <i data-lucide="pencil" aria-hidden="true"></i>編集
            </button>
            <button class="is-danger" type="button" data-delete-memo="${memo.id}">
              <i data-lucide="trash-2" aria-hidden="true"></i>削除
            </button>
          </div>
        </div>
      </article>`;
  }

  function bindMemoCardActions() {
    el.view.querySelectorAll("[data-edit-memo]").forEach((button) => {
      button.addEventListener("click", () =>
        openMemoDialog(button.dataset.editMemo),
      );
    });
    el.view.querySelectorAll("[data-delete-memo]").forEach((button) => {
      button.addEventListener("click", () => {
        const memo = data.memos.find(
          (item) => item.id === button.dataset.deleteMemo,
        );
        if (!memo || !window.confirm(`「${memo.title}」を削除しますか？`)) return;
        data.memos = data.memos.filter((item) => item.id !== memo.id);
        persist();
        renderBoard();
        toast("事件メモを削除しました");
      });
    });
  }

  function renderTimeline() {
    el.view.innerHTML = `
      <div class="trial-content-page">
        <div class="trial-page-heading">
          <div>
            <p class="trial-kicker">DAILY SCHEDULE / ALIBI</p>
            <h2>時系列とアリバイ</h2>
            <p>牢屋敷の規則に沿って、目撃情報と空白の時間を整理します。</p>
          </div>
          <div class="trial-page-icon"><i data-lucide="clock-3" aria-hidden="true"></i></div>
        </div>
        <div class="trial-timeline">
          ${TIME_SLOTS.map(
            (slot, index) => `
              <div class="trial-timeline-row">
                <div class="trial-timeline-marker">
                  <span>${String(index + 1).padStart(2, "0")}</span>
                </div>
                <div class="trial-timeline-time">
                  <strong>${slot.time}</strong>
                  <span>${slot.label}</span>
                  <small>${slot.note}</small>
                </div>
                <label>
                  <span class="sr-only">${slot.time}の記録</span>
                  <textarea
                    data-timeline-id="${slot.id}"
                    maxlength="3000"
                    placeholder="誰が、どこで、何をしていたか…"
                  >${escapeHtml(data.timeline[slot.id])}</textarea>
                </label>
              </div>`,
          ).join("")}
        </div>
      </div>`;
    el.view.querySelectorAll("[data-timeline-id]").forEach((textarea) => {
      textarea.addEventListener("input", () => {
        data.timeline[textarea.dataset.timelineId] = textarea.value;
        schedulePersist();
      });
    });
  }

  function renderMap() {
    const map = findMap(data.selectedMapId);
    el.view.innerHTML = `
      <div class="trial-content-page">
        <div class="trial-page-heading">
          <div>
            <p class="trial-kicker">PRISON MANOR / LOCATION</p>
            <h2>屋敷マップ</h2>
            <p>現場、移動経路、目撃場所をフロアごとに記録します。</p>
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
              <button id="trial-map-memo-button" type="button">
                <i data-lucide="image-plus" aria-hidden="true"></i>このマップを事件メモに添付
              </button>
            </figcaption>
          </figure>
          <div class="trial-map-notes">
            <div>
              <p class="trial-kicker">FLOOR NOTES</p>
              <h3>${map.name} 調査メモ</h3>
            </div>
            <textarea
              id="trial-map-note"
              maxlength="3000"
              placeholder="現場、証拠、移動経路、立入可能な時間…"
            >${escapeHtml(data.mapNotes[map.id])}</textarea>
            <p><i data-lucide="info" aria-hidden="true"></i>フロアを切り替えても自動保存されます</p>
          </div>
        </div>
      </div>`;
    el.view.querySelectorAll("[data-map-id]").forEach((button) => {
      button.addEventListener("click", () => {
        data.selectedMapId = button.dataset.mapId;
        persist();
        renderMap();
      });
    });
    el.view.querySelector("#trial-map-note").addEventListener("input", (event) => {
      data.mapNotes[map.id] = event.target.value;
      schedulePersist();
    });
    el.view
      .querySelector("#trial-map-memo-button")
      .addEventListener("click", () =>
        openMemoDialog(null, { kind: "map", id: map.id }),
      );
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
          <section class="trial-reference-card">
            <div class="trial-reference-title">
              <i data-lucide="scale" aria-hidden="true"></i>
              <div><p class="trial-kicker">WITCH TRIAL</p><h3>裁判の要点</h3></div>
            </div>
            <ol class="trial-rule-list">
              <li><span>01</span><p><strong>殺人で開廷</strong>屋敷内で殺人が起こると、危険な魔女を処刑する裁判が行われる。</p></li>
              <li><span>02</span><p><strong>議論と多数決</strong>指定時間内に犯人を議論し、最多票を得た者が魔女として処刑される。</p></li>
              <li><span>03</span><p><strong>発見後は捜査可能</strong>死体発見から裁判開始まで、拘束を解除され屋敷内を捜査できる。</p></li>
              <li><span>04</span><p><strong>特定失敗は全員処刑</strong>合理的証拠を伴う全会一致の「犯人なし」を除き、全員が処刑される。</p></li>
            </ol>
          </section>
          <section class="trial-reference-card trial-reference-wide">
            <div class="trial-reference-title">
              <i data-lucide="shield" aria-hidden="true"></i>
              <div><p class="trial-kicker">DAILY RULES</p><h3>検証に使える生活規則</h3></div>
            </div>
            <div class="trial-rule-chips">
              <span>自由時間外は監房</span>
              <span>看守が全エリアを巡回</span>
              <span>衣服は毎日ダストシュートへ</span>
              <span>焼却炉は月曜15時に稼働</span>
              <span>怪我・体調不良時は医務室可</span>
              <span>付き添いは1人まで</span>
              <span>22時から翌6時は外出禁止</span>
              <span>シャワーは17時から22時</span>
            </div>
          </section>
        </div>
      </div>`;
  }

  function renderAssetPicker(selectedAsset = null) {
    const selectedValue = selectedAsset
      ? `${selectedAsset.kind}:${selectedAsset.id}`
      : "none";
    el.assetPicker.innerHTML = `
      <label class="trial-asset-option is-none">
        <input type="radio" name="trial-asset" value="none"${
          selectedValue === "none" ? " checked" : ""
        } />
        <span><i data-lucide="image-off" aria-hidden="true"></i></span>
        <small>画像なし</small>
      </label>
      ${CHARACTERS.map(
        (character) => `
          <label class="trial-asset-option">
            <input type="radio" name="trial-asset" value="character:${character.id}"${
              selectedValue === `character:${character.id}` ? " checked" : ""
            } />
            <span><img src="${character.image}" alt="" /></span>
            <small>${escapeHtml(character.name)}</small>
          </label>`,
      ).join("")}
      ${MAPS.map(
        (map) => `
          <label class="trial-asset-option is-map">
            <input type="radio" name="trial-asset" value="map:${map.id}"${
              selectedValue === `map:${map.id}` ? " checked" : ""
            } />
            <span><img src="${map.image}" alt="" /></span>
            <small>${map.name} マップ</small>
          </label>`,
      ).join("")}`;
    iconRefresh();
  }

  function openMemoDialog(memoId = null, initialAsset = null) {
    const memo = data.memos.find((item) => item.id === memoId) || null;
    el.memoDialogTitle.textContent = memo ? "事件メモを編集" : "事件メモを追加";
    el.memoId.value = memo?.id || "";
    el.memoCategory.value = memo?.category || "evidence";
    el.memoTitle.value = memo?.title || "";
    el.memoBody.value = memo?.body || "";
    renderAssetPicker(memo?.asset || initialAsset);
    el.memoDialog.showModal();
    setTimeout(() => el.memoTitle.focus(), 0);
  }

  function selectedAssetFromForm() {
    const value = el.assetPicker.querySelector(
      'input[name="trial-asset"]:checked',
    )?.value;
    if (!value || value === "none") return null;
    const [kind, id] = value.split(":");
    return normalizeAsset({ kind, id });
  }

  function saveMemoFromForm() {
    const title = el.memoTitle.value.trim();
    if (!title) return;
    const existing = data.memos.find((memo) => memo.id === el.memoId.value);
    if (existing) {
      existing.category = el.memoCategory.value;
      existing.title = title;
      existing.body = el.memoBody.value.trim();
      existing.asset = selectedAssetFromForm();
      existing.updatedAt = Date.now();
    } else {
      data.memos.unshift({
        id: crypto.randomUUID(),
        category: el.memoCategory.value,
        title,
        body: el.memoBody.value.trim(),
        asset: selectedAssetFromForm(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    persist();
    el.memoDialog.close();
    data.activeView = "board";
    render();
    toast(existing ? "事件メモを更新しました" : "事件メモを追加しました");
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
      const status =
        STATUSES.find((item) => item.id === file.status)?.label || "未確認";
      lines.push(
        `### ${character.name} — ${status}`,
        "",
        file.note || "_メモなし_",
        "",
      );
    });
    lines.push("## 事件メモ", "");
    data.memos.forEach((memo) => {
      const asset = assetDetails(memo.asset);
      lines.push(
        `### [${CATEGORIES[memo.category].label}] ${memo.title}`,
        "",
        ...(asset ? [`![${asset.name}](${asset.image})`, ""] : []),
        memo.body || "_内容なし_",
        "",
      );
    });
    lines.push("## 時系列", "");
    TIME_SLOTS.forEach((slot) => {
      lines.push(
        `### ${slot.time} ${slot.label}`,
        "",
        data.timeline[slot.id] || "_記録なし_",
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
  el.caseTitle.addEventListener("input", () => {
    data.title = el.caseTitle.value.trimStart().slice(0, 60);
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
  el.addMemo.addEventListener("click", () => openMemoDialog());
  el.exportButton.addEventListener("click", exportCase);
  el.memoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveMemoFromForm();
  });
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

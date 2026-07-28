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

const TIME_SLOTS = Object.freeze([
  { id: "06-10", time: "6:00–10:00", label: "朝の自由時間", note: "朝食／監房開錠" },
  { id: "10-12", time: "10:00–12:00", label: "監房滞在", note: "看守の管理チェック" },
  { id: "12-15", time: "12:00–15:00", label: "昼の自由時間", note: "昼食／屋敷内を移動可能" },
  { id: "15-17", time: "15:00–17:00", label: "監房滞在", note: "月曜15時は焼却炉が稼働" },
  { id: "17-22", time: "17:00–22:00", label: "夜の自由時間", note: "夕食／シャワー利用可能" },
  { id: "22-06", time: "22:00–翌6:00", label: "消灯・外出禁止", note: "監房内で就寝" },
]);

function emptyCharacterTimeNotes() {
  return Object.fromEntries(TIME_SLOTS.map((slot) => [slot.id, ""]));
}

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
        { details: "", isDead: false, timeNotes: emptyCharacterTimeNotes() },
      ]),
    ),
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
      const savedDetails =
        typeof file.details === "string"
          ? file.details
          : typeof file.note === "string"
            ? file.note
            : "";
      characterFiles[character.id] = {
        details: savedDetails.slice(0, 10000),
        isDead: file.isDead === true,
        timeNotes: Object.fromEntries(
          TIME_SLOTS.map((slot) => [
            slot.id,
            typeof file.timeNotes?.[slot.id] === "string"
              ? file.timeNotes[slot.id].slice(0, 5000)
              : "",
          ]),
        ),
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
  const data = loadCase();
  const state = {
    enabled: localStorage.getItem(STORAGE_KEYS.witchTrialEnabled) === "true",
    characterQuery: "",
    showDeceased: false,
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
    showDeceased: document.querySelector("#trial-show-deceased"),
    deceasedCount: document.querySelector("#trial-deceased-count"),
    caseTitle: document.querySelector("#trial-case-title"),
    saveState: document.querySelector("#trial-save-state"),
    tabs: [...document.querySelectorAll("[data-trial-view]")],
    view: document.querySelector("#trial-view"),
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
          const hasDetails = Boolean(file.details.trim());
          return `
            <button
              class="trial-character-row${
                data.selectedCharacterId === character.id ? " is-active" : ""
              }${file.isDead ? " is-deceased" : ""}"
              type="button"
              data-character-id="${character.id}"
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
                  ${file.isDead ? "死亡" : hasDetails ? "詳細あり" : "詳細未記入"}
                </small>
              </span>
              <i data-lucide="chevron-right" aria-hidden="true"></i>
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
    const recordedTimeCount = TIME_SLOTS.filter(
      (slot) => file.timeNotes[slot.id].trim(),
    ).length;
    const detailedCharacterCount = Object.values(data.characterFiles).filter(
      (item) => item.details.trim(),
    ).length;
    const alibiCharacterCount = Object.values(data.characterFiles).filter(
      (item) => TIME_SLOTS.some((slot) => item.timeNotes[slot.id].trim()),
    ).length;
    const totalTimeNoteCount = Object.values(data.characterFiles).reduce(
      (total, item) =>
        total +
        TIME_SLOTS.filter((slot) => item.timeNotes[slot.id].trim()).length,
      0,
    );
    el.view.innerHTML = `
      <div class="trial-dashboard">
        <section class="trial-overview-card">
          <div>
            <p class="trial-kicker">CHARACTER RECORDS</p>
            <h2>人物を知り、供述を整理する。</h2>
            <p>人物の特徴や関係性を詳しく記録し、時間・場所と照合できます。</p>
          </div>
          <div class="trial-stat-grid">
            <div><strong>${detailedCharacterCount}<small> / ${CHARACTERS.length}</small></strong><span>詳細記入</span></div>
            <div><strong>${alibiCharacterCount}<small> / ${CHARACTERS.length}</small></strong><span>アリバイ記入</span></div>
            <div><strong>${totalTimeNoteCount}<small> / ${CHARACTERS.length * TIME_SLOTS.length}</small></strong><span>時間帯記録</span></div>
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
              <label class="trial-death-check">
                <input
                  id="trial-character-deceased"
                  type="checkbox"
                  ${file.isDead ? "checked" : ""}
                />
                <span aria-hidden="true">
                  <i data-lucide="check"></i>
                </span>
                <strong>死亡</strong>
              </label>
            </div>
            <label class="trial-field-label" for="trial-character-details">
              人物詳細
              <span>特徴・性格・関係性・経歴など</span>
            </label>
            <textarea
              id="trial-character-details"
              class="trial-dossier-note trial-character-details"
              maxlength="10000"
              placeholder="${escapeHtml(character.name)}について分かったことを詳しく記録…"
            >${escapeHtml(file.details)}</textarea>
            <div class="trial-character-time-heading">
              <div class="trial-field-label">
                供述・アリバイ
                <span>24時間の行動記録をまとめて表示</span>
              </div>
              <span id="trial-character-time-count" class="trial-character-time-count">
                <i data-lucide="clock-3" aria-hidden="true"></i>
                ${recordedTimeCount} / ${TIME_SLOTS.length} 時間帯
              </span>
            </div>
            <div
              class="trial-character-time-list"
              aria-label="${escapeHtml(character.name)}の24時間の供述・アリバイ"
            >
              ${TIME_SLOTS.map(
                (slot) => `
                  <label class="trial-character-time-row">
                    <span class="trial-character-time-context">
                      <strong>${slot.time}</strong>
                      <span>
                        <b>${slot.label}</b>
                        <small>${slot.note}</small>
                      </span>
                    </span>
                    <textarea
                      class="trial-dossier-note"
                      data-character-time-id="${slot.id}"
                      maxlength="5000"
                      placeholder="${escapeHtml(character.name)}が${slot.time}に、どこで何をしていたか…"
                    >${escapeHtml(file.timeNotes[slot.id])}</textarea>
                  </label>`,
              ).join("")}
            </div>
            <div class="trial-dossier-foot">
              <span><i data-lucide="shield-alert" aria-hidden="true"></i>事実と推測を分けて記録</span>
            </div>
          </div>
        </section>
      </div>`;

    el.view
      .querySelector("#trial-character-details")
      .addEventListener("input", (event) => {
        file.details = event.target.value;
        schedulePersist();
        renderCharacterList();
      });
    el.view
      .querySelector("#trial-character-deceased")
      .addEventListener("change", (event) => {
        file.isDead = event.target.checked;
        persist();
        renderCharacterList();
        toast(
          file.isDead
            ? `${character.name}を死亡者として一覧から非表示にしました`
            : `${character.name}を人物一覧に戻しました`,
        );
      });
    el.view.querySelectorAll("[data-character-time-id]").forEach((textarea) => {
      textarea.addEventListener("input", (event) => {
        file.timeNotes[textarea.dataset.characterTimeId] = event.target.value;
        const timeCount = TIME_SLOTS.filter(
          (slot) => file.timeNotes[slot.id].trim(),
        ).length;
        const countLabel = el.view.querySelector("#trial-character-time-count");
        if (countLabel) {
          countLabel.innerHTML = `
            <i data-lucide="clock-3" aria-hidden="true"></i>
            ${timeCount} / ${TIME_SLOTS.length} 時間帯`;
          iconRefresh();
        }
        schedulePersist();
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
        "#### 人物詳細",
        "",
        file.details || "_詳細なし_",
        "",
      );
      TIME_SLOTS.forEach((slot) => {
        lines.push(
          `#### ${slot.time} ${slot.label}`,
          "",
          file.timeNotes[slot.id] || "_記録なし_",
          "",
        );
      });
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
  el.showDeceased.addEventListener("change", () => {
    state.showDeceased = el.showDeceased.checked;
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

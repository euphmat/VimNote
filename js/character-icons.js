import { STORAGE_KEYS } from "./config.js";

const INLINE_CHARACTER_TITLE = "vimnote-character-icon";
const CHARACTER_DRAG_MIME = "application/x-vimnote-character-icon";

export const characters = Object.freeze([
  { id: "emma", name: "桜羽エマ", shortName: "エマ", image: "./Assets/Character/桜羽エマ.JPG" },
  { id: "meruru", name: "氷上メルル", shortName: "メルル", image: "./Assets/Character/氷上メルル.JPG" },
  { id: "nanoka", name: "黒部ナノカ", shortName: "ナノカ", image: "./Assets/Character/黒部ナノカ.JPG" },
  { id: "coco", name: "沢渡ココ", shortName: "ココ", image: "./Assets/Character/沢渡ココ.JPG" },
  { id: "reia", name: "蓮見レイア", shortName: "レイア", image: "./Assets/Character/蓮見レイア.JPG" },
  { id: "miria", name: "佐伯ミリア", shortName: "ミリア", image: "./Assets/Character/佐伯ミリア.JPG" },
  { id: "hanna", name: "遠野ハンナ", shortName: "ハンナ", image: "./Assets/Character/遠野ハンナ.JPG" },
  { id: "gokucho", name: "ゴクチョー", shortName: "ゴクチョー", image: "./Assets/Character/ゴクチョー.JPG" },
  { id: "sherry", name: "橘シェリー", shortName: "シェリー", image: "./Assets/Character/橘シェリー.JPG" },
  { id: "alisa", name: "紫藤アリサ", shortName: "アリサ", image: "./Assets/Character/紫藤アリサ.JPG" },
  { id: "guard", name: "看守", shortName: "看守", image: "./Assets/Character/看守.JPG" },
  { id: "hiro", name: "二階堂ヒロ", shortName: "ヒロ", image: "./Assets/Character/二階堂ヒロ.JPG" },
  { id: "margo", name: "宝生マーゴ", shortName: "マーゴ", image: "./Assets/Character/宝生マーゴ.JPG" },
  { id: "noa", name: "城ヶ崎ノア", shortName: "ノア", image: "./Assets/Character/城ヶ崎ノア.JPG" },
  { id: "anan", name: "夏目アンアン", shortName: "アンアン", image: "./Assets/Character/夏目アンアン.JPG" },
]);

function loadPaletteState() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.characterIcons) || "null",
    );
    const validIds = new Set(characters.map((character) => character.id));
    return {
      deceasedIds: new Set(
        Array.isArray(saved?.deceasedIds)
          ? saved.deceasedIds.filter((id) => validIds.has(id))
          : [],
      ),
      showDeceased: saved?.showDeceased === true,
    };
  } catch {
    return { deceasedIds: new Set(), showDeceased: false };
  }
}

function persistPaletteState(state) {
  try {
    localStorage.setItem(
      STORAGE_KEYS.characterIcons,
      JSON.stringify({
        deceasedIds: [...state.deceasedIds],
        showDeceased: state.showDeceased,
      }),
    );
  } catch {
    // Keep the current-session state when storage is unavailable.
  }
}

function characterMarkdown(character, alt = character.shortName) {
  return `![${alt}](${character.image} "${INLINE_CHARACTER_TITLE}")`;
}

function createInlineWidget(editor, character, getMark) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "character-inline-icon";
  button.title = `${character.name}（クリックで削除）`;
  button.setAttribute("aria-label", `${character.name}のアイコンを文中から削除`);

  const image = document.createElement("img");
  image.src = character.image;
  image.alt = "";
  const label = document.createElement("span");
  label.textContent = character.shortName;
  button.append(image, label);

  button.addEventListener("mousedown", (event) => event.stopPropagation());
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const range = getMark()?.find();
    if (!range) return;
    editor.replaceRange("", range.from, range.to, "+delete");
    editor.focus();
  });
  return button;
}

export function createCharacterIconInserter({
  editor,
  trigger,
  menu,
  grid,
  onInsert = () => {},
}) {
  let inlineMarks = [];
  let windowDrag = null;
  const paletteState = loadPaletteState();
  const characterCards = new Map();
  const closeButton = menu.querySelector("[data-character-icon-close]");
  const dragHandle = menu.querySelector("[data-character-icon-drag-handle]");
  const showDeceased = menu.querySelector("#character-show-deceased");
  const deceasedCount = menu.querySelector("#character-deceased-count");

  function renderCharacterVisibility() {
    showDeceased.checked = paletteState.showDeceased;
    deceasedCount.textContent = String(paletteState.deceasedIds.size);
    menu.classList.toggle("is-showing-deceased", paletteState.showDeceased);
    characterCards.forEach(({ card, input }, characterId) => {
      const deceased = paletteState.deceasedIds.has(characterId);
      input.checked = deceased;
      card.classList.toggle("is-deceased", deceased);
      card.classList.toggle(
        "hidden",
        deceased && !paletteState.showDeceased,
      );
    });
  }

  function updateDeceased(characterId, deceased) {
    if (deceased) {
      paletteState.deceasedIds.add(characterId);
    } else {
      paletteState.deceasedIds.delete(characterId);
    }
    persistPaletteState(paletteState);
    renderCharacterVisibility();
  }

  function refreshUsageState() {
    const content = editor.getValue();
    characterCards.forEach(({ card, button }, characterId) => {
      const character = characters.find((item) => item.id === characterId);
      if (!character) return;
      const used = [
        characterMarkdown(character),
        characterMarkdown(character, character.name),
      ].some((markdown) => content.includes(markdown));
      card.classList.toggle("is-used", used);
      button.title = used
        ? `${character.name}を挿入（このノートで使用済み）`
        : `${character.name}を挿入`;
      button.setAttribute(
        "aria-label",
        used
          ? `${character.name}のアイコンを挿入、このノートで使用済み`
          : `${character.name}のアイコンを挿入`,
      );
    });
  }

  function isNativePopoverOpen() {
    return (
      typeof menu.showPopover === "function" &&
      menu.matches(":popover-open")
    );
  }

  function isMenuOpen() {
    return isNativePopoverOpen() || !menu.classList.contains("hidden");
  }

  function keepWindowInViewport() {
    if (!isMenuOpen()) return;
    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.left, margin),
      Math.max(margin, window.innerWidth - rect.width - margin),
    );
    const top = Math.min(
      Math.max(rect.top, margin),
      Math.max(margin, window.innerHeight - rect.height - margin),
    );
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.right = "auto";
  }

  function closeMenu({ restoreFocus = false } = {}) {
    if (isNativePopoverOpen()) menu.hidePopover();
    menu.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus();
  }

  function openMenu() {
    menu.classList.remove("hidden");
    if (typeof menu.showPopover === "function" && !isNativePopoverOpen()) {
      menu.showPopover();
    }
    trigger.setAttribute("aria-expanded", "true");
    requestAnimationFrame(keepWindowInViewport);
  }

  function insert(character, position = editor.getCursor()) {
    const markdown = characterMarkdown(character);
    editor.replaceRange(markdown, position, position, "+input");
    editor.setCursor({ line: position.line, ch: position.ch + markdown.length });
    editor.focus();
    onInsert(character);
  }

  function refresh() {
    inlineMarks.forEach((mark) => mark.clear());
    inlineMarks = [];
    editor.operation(() => {
      editor.eachLine((lineHandle) => {
        const line = editor.getLineNumber(lineHandle);
        if (line === null) return;
        characters.forEach((character) => {
          const variants = new Set([
            characterMarkdown(character),
            characterMarkdown(character, character.name),
          ]);
          variants.forEach((markdown) => {
            let from = 0;
            while (from < lineHandle.text.length) {
              const ch = lineHandle.text.indexOf(markdown, from);
              if (ch < 0) break;
              let mark;
              const widget = createInlineWidget(editor, character, () => mark);
              mark = editor.markText(
                { line, ch },
                { line, ch: ch + markdown.length },
                {
                  replacedWith: widget,
                  atomic: true,
                  clearOnEnter: false,
                  handleMouseEvents: true,
                },
              );
              inlineMarks.push(mark);
              from = ch + markdown.length;
            }
          });
        });
      });
    });
    refreshUsageState();
  }

  characters.forEach((character) => {
    const card = document.createElement("div");
    card.className = "character-icon-card";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "character-icon-option";
    button.draggable = true;
    button.title = `${character.name}を挿入`;
    button.setAttribute("aria-label", `${character.name}のアイコンを挿入`);

    const image = document.createElement("img");
    image.src = character.image;
    image.alt = "";
    const label = document.createElement("span");
    label.textContent = character.shortName;
    button.append(image, label);

    const deceasedToggle = document.createElement("label");
    deceasedToggle.className = "character-toggle character-deceased-toggle";
    const deceasedInput = document.createElement("input");
    deceasedInput.type = "checkbox";
    deceasedInput.setAttribute("role", "switch");
    deceasedInput.setAttribute("aria-label", `${character.name}を死亡者として非表示`);
    const deceasedTrack = document.createElement("span");
    deceasedTrack.className = "character-toggle-track";
    deceasedTrack.setAttribute("aria-hidden", "true");
    const deceasedLabel = document.createElement("span");
    deceasedLabel.textContent = "死亡";
    deceasedToggle.append(deceasedInput, deceasedTrack, deceasedLabel);

    button.addEventListener("click", () => insert(character));
    button.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData(CHARACTER_DRAG_MIME, character.id);
      event.dataTransfer.setData("text/plain", characterMarkdown(character));
      button.classList.add("is-dragging");
    });
    button.addEventListener("dragend", () => {
      button.classList.remove("is-dragging");
      editor.getWrapperElement().classList.remove("is-character-icon-dragover");
    });
    deceasedInput.addEventListener("change", () => {
      updateDeceased(character.id, deceasedInput.checked);
    });

    card.append(button, deceasedToggle);
    grid.append(card);
    characterCards.set(character.id, {
      card,
      input: deceasedInput,
      button,
    });
  });

  showDeceased.addEventListener("change", () => {
    paletteState.showDeceased = showDeceased.checked;
    persistPaletteState(paletteState);
    renderCharacterVisibility();
  });
  renderCharacterVisibility();

  trigger.addEventListener("click", () => {
    if (!isMenuOpen()) {
      openMenu();
    } else {
      closeMenu({ restoreFocus: true });
    }
  });

  closeButton.addEventListener("click", () => closeMenu({ restoreFocus: true }));

  dragHandle.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 || event.target.closest("button")) return;
    const rect = menu.getBoundingClientRect();
    windowDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: rect.left,
      top: rect.top,
    };
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.top}px`;
    menu.style.right = "auto";
    menu.classList.add("is-dragging");
    dragHandle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });

  dragHandle.addEventListener("pointermove", (event) => {
    if (!windowDrag || event.pointerId !== windowDrag.pointerId) return;
    const margin = 8;
    const rect = menu.getBoundingClientRect();
    const left = Math.min(
      Math.max(windowDrag.left + event.clientX - windowDrag.startX, margin),
      Math.max(margin, window.innerWidth - rect.width - margin),
    );
    const top = Math.min(
      Math.max(windowDrag.top + event.clientY - windowDrag.startY, margin),
      Math.max(margin, window.innerHeight - rect.height - margin),
    );
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  });

  function finishWindowDrag(event) {
    if (!windowDrag || event.pointerId !== windowDrag.pointerId) return;
    dragHandle.releasePointerCapture(event.pointerId);
    windowDrag = null;
    menu.classList.remove("is-dragging");
  }

  dragHandle.addEventListener("pointerup", finishWindowDrag);
  dragHandle.addEventListener("pointercancel", finishWindowDrag);
  window.addEventListener("resize", keepWindowInViewport);

  const wrapper = editor.getWrapperElement();
  wrapper.addEventListener("dragover", (event) => {
    if (!Array.from(event.dataTransfer.types).includes(CHARACTER_DRAG_MIME)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    wrapper.classList.add("is-character-icon-dragover");
  });
  wrapper.addEventListener("dragleave", (event) => {
    if (!wrapper.contains(event.relatedTarget)) {
      wrapper.classList.remove("is-character-icon-dragover");
    }
  });
  wrapper.addEventListener("drop", (event) => {
    const characterId = event.dataTransfer.getData(CHARACTER_DRAG_MIME);
    const character = characters.find((item) => item.id === characterId);
    if (!character) return;
    event.preventDefault();
    wrapper.classList.remove("is-character-icon-dragover");
    const position = editor.coordsChar(
      { left: event.clientX, top: event.clientY },
      "window",
    );
    insert(character, position);
  });

  editor.on("changes", refresh);
  refresh();

  return { closeMenu, refresh };
}

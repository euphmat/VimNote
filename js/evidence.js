import { STORAGE_KEYS } from "./config.js";

function loadEvidenceItems() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.evidenceItems) || "[]",
    );
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((item) => item && typeof item.name === "string" && item.name.trim())
      .map((item) => ({
        id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
        name: item.name.trim().slice(0, 80),
        memo: typeof item.memo === "string" ? item.memo.slice(0, 2000) : "",
        updatedAt: Number.isFinite(item.updatedAt) ? item.updatedAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function persistEvidenceItems(items) {
  try {
    localStorage.setItem(STORAGE_KEYS.evidenceItems, JSON.stringify(items));
  } catch {
    // Keep edits available for the current session when storage is unavailable.
  }
}

export function createEvidenceManager({
  trigger,
  menu,
  list,
  empty,
  form,
  nameInput,
  memoInput,
  onOpen = () => {},
  onChange = () => {},
  onIconsChanged = () => {},
}) {
  let items = loadEvidenceItems();
  let editingId = null;
  let windowDrag = null;
  const addButton = menu.querySelector("[data-evidence-add]");
  const closeButton = menu.querySelector("[data-evidence-close]");
  const cancelButton = menu.querySelector("[data-evidence-cancel]");
  const dragHandle = menu.querySelector("[data-evidence-drag-handle]");
  const submitButton = form.querySelector('button[type="submit"]');

  function isNativePopoverOpen() {
    return typeof menu.showPopover === "function" && menu.matches(":popover-open");
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

  function closeForm() {
    editingId = null;
    form.reset();
    form.classList.add("hidden");
    addButton.setAttribute("aria-expanded", "false");
  }

  function openForm(item = null) {
    editingId = item?.id || null;
    nameInput.value = item?.name || "";
    memoInput.value = item?.memo || "";
    submitButton.textContent = item ? "更新" : "追加";
    form.classList.remove("hidden");
    addButton.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => nameInput.focus());
  }

  function render() {
    list.replaceChildren();
    const sortedItems = [...items].sort((a, b) => b.updatedAt - a.updatedAt);
    empty.classList.toggle("hidden", sortedItems.length > 0);

    sortedItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "evidence-card";

      const content = document.createElement("div");
      content.className = "evidence-card-content";
      const name = document.createElement("h3");
      name.textContent = item.name;
      const memo = document.createElement("p");
      memo.textContent = item.memo || "メモなし";
      memo.classList.toggle("is-empty", !item.memo);
      content.append(name, memo);

      const actions = document.createElement("div");
      actions.className = "evidence-card-actions";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "evidence-card-button";
      editButton.setAttribute("aria-label", `${item.name}を編集`);
      editButton.innerHTML = '<i data-lucide="pencil" aria-hidden="true"></i>';
      editButton.addEventListener("click", () => openForm(item));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "evidence-card-button is-danger";
      deleteButton.setAttribute("aria-label", `${item.name}を削除`);
      deleteButton.innerHTML = '<i data-lucide="trash-2" aria-hidden="true"></i>';
      deleteButton.addEventListener("click", () => {
        if (!window.confirm(`「${item.name}」を削除しますか？`)) return;
        items = items.filter((candidate) => candidate.id !== item.id);
        persistEvidenceItems(items);
        if (editingId === item.id) closeForm();
        render();
        onChange("証拠品を削除しました");
      });

      actions.append(editButton, deleteButton);
      card.append(content, actions);
      list.append(card);
    });

    onIconsChanged();
  }

  function openMenu() {
    onOpen();
    menu.classList.remove("hidden");
    if (typeof menu.showPopover === "function" && !isNativePopoverOpen()) {
      menu.showPopover();
    }
    trigger.setAttribute("aria-expanded", "true");
    requestAnimationFrame(keepWindowInViewport);
  }

  function closeMenu({ restoreFocus = false } = {}) {
    closeForm();
    if (isNativePopoverOpen()) menu.hidePopover();
    menu.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
    if (restoreFocus) trigger.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      return;
    }
    const now = Date.now();
    const existing = items.find((item) => item.id === editingId);
    if (existing) {
      existing.name = name;
      existing.memo = memoInput.value.trim();
      existing.updatedAt = now;
    } else {
      items.push({
        id: crypto.randomUUID(),
        name,
        memo: memoInput.value.trim(),
        updatedAt: now,
      });
    }
    persistEvidenceItems(items);
    closeForm();
    render();
    onChange(existing ? "証拠品を更新しました" : "証拠品を追加しました");
  });

  trigger.addEventListener("click", () => {
    if (isMenuOpen()) closeMenu({ restoreFocus: true });
    else openMenu();
  });
  addButton.addEventListener("click", () => {
    if (form.classList.contains("hidden") || editingId) openForm();
    else closeForm();
  });
  cancelButton.addEventListener("click", closeForm);
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
    menu.style.left = `${Math.min(
      Math.max(windowDrag.left + event.clientX - windowDrag.startX, margin),
      Math.max(margin, window.innerWidth - rect.width - margin),
    )}px`;
    menu.style.top = `${Math.min(
      Math.max(windowDrag.top + event.clientY - windowDrag.startY, margin),
      Math.max(margin, window.innerHeight - rect.height - margin),
    )}px`;
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
  window.addEventListener("storage", (event) => {
    if (event.key !== STORAGE_KEYS.evidenceItems) return;
    items = loadEvidenceItems();
    closeForm();
    render();
  });
  menu.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    if (!form.classList.contains("hidden")) closeForm();
    else closeMenu({ restoreFocus: true });
  });

  render();
  return { closeMenu };
}

const EDITOR_OPTIONS = Object.freeze({
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
});

let vimBindingsInstalled = false;

function installHeadingLineStyles(editor) {
  const styledLines = new WeakMap();

  function refreshHeadingLines() {
    editor.operation(() => {
      editor.eachLine((lineHandle) => {
        const previousLevel = styledLines.get(lineHandle);
        const match = lineHandle.text.match(/^\s{0,3}(#{1,6})(?:\s+|$)/);
        const nextLevel = match ? match[1].length : 0;

        if (previousLevel === nextLevel) return;
        if (previousLevel) {
          editor.removeLineClass(
            lineHandle,
            "background",
            `cm-heading-line-${previousLevel}`,
          );
        }
        if (nextLevel) {
          editor.addLineClass(
            lineHandle,
            "background",
            `cm-heading-line-${nextLevel}`,
          );
          styledLines.set(lineHandle, nextLevel);
        } else {
          styledLines.delete(lineHandle);
        }
      });
    });
  }

  editor.on("changes", refreshHeadingLines);
  refreshHeadingLines();
}

function isEscapedBacktick(text, index) {
  let backslashes = 0;
  for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor -= 1) {
    backslashes += 1;
  }
  return backslashes % 2 === 1;
}

function inlineCodeRanges(text) {
  const ranges = [];
  let cursor = 0;

  while (cursor < text.length) {
    if (text[cursor] !== "`" || isEscapedBacktick(text, cursor)) {
      cursor += 1;
      continue;
    }

    const start = cursor;
    while (text[cursor] === "`") cursor += 1;
    const delimiterLength = cursor - start;
    let closingStart = cursor;

    while (closingStart < text.length) {
      if (text[closingStart] !== "`") {
        closingStart += 1;
        continue;
      }

      let closingEnd = closingStart;
      while (text[closingEnd] === "`") closingEnd += 1;
      if (closingEnd - closingStart === delimiterLength) {
        ranges.push({ from: start, to: closingEnd });
        cursor = closingEnd;
        break;
      }
      closingStart = closingEnd;
    }

    if (closingStart >= text.length) cursor = start + delimiterLength;
  }

  return ranges;
}

function installInlineCodeBadges(editor) {
  let badges = [];

  function refreshInlineCodeBadges() {
    badges.forEach((badge) => badge.clear());
    badges = [];
    let fence = null;

    editor.operation(() => {
      editor.eachLine((lineHandle) => {
        const line = editor.getLineNumber(lineHandle);
        if (line === null) return;

        const fenceMatch = lineHandle.text.match(/^\s{0,3}(`{3,}|~{3,})/);
        if (fenceMatch) {
          const marker = fenceMatch[1];
          if (!fence) {
            fence = { character: marker[0], length: marker.length };
          } else if (
            marker[0] === fence.character &&
            marker.length >= fence.length &&
            lineHandle.text.slice(fenceMatch[0].length).trim() === ""
          ) {
            fence = null;
          }
          return;
        }

        if (fence || /^ {4}/.test(lineHandle.text)) return;

        inlineCodeRanges(lineHandle.text).forEach((range) => {
          const badge = editor.markText(
            { line, ch: range.from },
            { line, ch: range.to },
            {
              className: "cm-inline-code-badge",
              startStyle: "cm-inline-code-badge-start",
              endStyle: "cm-inline-code-badge-end",
              inclusiveLeft: false,
              inclusiveRight: false,
            },
          );
          badge.vimNoteInlineCodeBadge = true;
          badges.push(badge);
        });
      });
    });
  }

  editor.on("changes", refreshInlineCodeBadges);
  refreshInlineCodeBadges();
}

function installVimBindings() {
  if (vimBindingsInstalled) return;
  vimBindingsInstalled = true;

  CodeMirror.Vim.map("jj", "<Esc>", "insert");
  CodeMirror.Vim.defineEx("write", "w", (editor) => {
    editor.state.vimNoteSave?.();
  });
  CodeMirror.Vim.defineEx("nohlsearch", "noh", (editor) => {
    if (editor.state.vimNoteClearSearch) {
      editor.state.vimNoteClearSearch();
      return;
    }
    clearVimSearch(editor);
  });
}

export function clearVimSearch(editor) {
  try {
    CodeMirror.Vim.handleKey(editor, "<Esc>");
    editor
      .getAllMarks()
      .filter((mark) => !mark.vimNoteInlineCodeBadge)
      .forEach((mark) => mark.clear());
  } catch {
    // Search marks are internal to the Vim addon; Escape still closes search.
  }
}

export function createVimMarkdownEditor(
  textarea,
  { onSave, onClearSearch } = {},
) {
  installVimBindings();
  const editor = CodeMirror.fromTextArea(textarea, {
    ...EDITOR_OPTIONS,
    extraKeys: {
      Tab(instance) {
        instance.replaceSelection("  ", "end");
      },
    },
  });
  editor.state.vimNoteSave = onSave;
  editor.state.vimNoteClearSearch = onClearSearch;
  installHeadingLineStyles(editor);
  installInlineCodeBadges(editor);
  return editor;
}

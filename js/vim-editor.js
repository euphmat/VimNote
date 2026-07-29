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
    editor.getAllMarks().forEach((mark) => mark.clear());
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
  return editor;
}

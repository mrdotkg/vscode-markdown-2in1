export function setupCursorTracking() {
  let debounceTimer = null;

  document.addEventListener("selectionchange", () => {
    // rangeCount check — yehi crash ka reason hai
    if (!window.vditor || !window.getSelection().rangeCount) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const pos = window.vditor.getCursorPosition();
      if (pos) window.handler.emit("cursor", pos);
    }, 200);
  });
}

export function setupFocusManagement() {
  window.addEventListener("focus", () => window.vditor.focus());
}

export function restoreCursorFromPoint(pos) {
  if (!pos) return;
  const editor = document.querySelector(".vditor-ir .vditor-reset");
  if (!editor) return;

  // Editor ka bounding rect lo — pos editor-relative hai, screen-relative chahiye
  const rect = editor.getBoundingClientRect();
  const x = rect.left + pos.left;
  const y = rect.top + pos.top;

  // Browser se pucho — is pixel par kaun sa text node + offset hai
  const range =
    document.caretRangeFromPoint?.(x, y) || // Chrome/Safari
    (document.caretPositionFromPoint &&
      (() => {
        const cp = document.caretPositionFromPoint(x, y);
        if (!cp) return null;
        const r = document.createRange();
        r.setStart(cp.offsetNode, cp.offset);
        r.collapse(true);
        return r;
      })());

  if (!range) return;

  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  if (window.vditor.ir) window.vditor.ir.range = range;
  window.vditor.focus();
}

export const addScrollListener = () => {
  const container = [
    ".vditor-reset",
    // ".vditor-ir .vditor-reset",
    // ".vditor-wysiwyg .vditor-reset",
    // ".vditor-ir__preview",
    // ".vditor-ir",
    // ".vditor",
  ]
    .map((sel) => document.querySelector(sel))
    .find(Boolean);

  if (!container) return setTimeout(addScrollListener, 100);
  if (!handler) return;

  let last = 0;
  container.addEventListener("scroll", (e) => {
    const now = Date.now();
    if (now - last < 50) return;
    last = now;
    handler.emit("scroll", { scrollTop: e.target.scrollTop - 70 });
  });

  let lastWin = 0;
  window.addEventListener("scroll", () => {
    const now = Date.now();
    if (now - lastWin < 50) return;
    lastWin = now;
    handler.emit("scroll", {
      scrollTop:
        (window.pageYOffset || document.documentElement.scrollTop) - 70,
    });
  });
};

export function scrollEditor(top) {
  if (!top) return;
  const tryScroll = () => {
    window.scrollTo({ top: top + 70, behavior: "auto" });
    setTimeout(() => {
      const current = window.pageYOffset || document.documentElement.scrollTop;
      if (Math.abs(current - (top + 70)) > 5) {
        document.documentElement.scrollTop = document.body.scrollTop = top + 70;
      }
    }, 100);
  };
  const hack = setInterval(() => {
    const editor = document.querySelector(".vditor-reset");
    editor ? editor.scrollTo({ top, behavior: "auto" }) : tryScroll();
    tryScroll();
    clearInterval(hack);
  }, 10);
}

export const openLink = () => {
  const clickCallback = (e) => {
    const ele = e.target;
    e.stopPropagation();
    if (!(isCompose(e) || ["dblclick", "auxclick"].includes(e.type))) return;

    if (ele.tagName === "A") handler.emit("openLink", ele.href);
    else if (ele.tagName === "IMG") {
      const parent = ele.parentElement;
      if (parent?.tagName === "A" && parent.href)
        return handler.emit("openLink", parent.href);
      if (ele.src?.startsWith("http")) handler.emit("openLink", ele.src);
    }
  };

  document
    .querySelector(".vditor-wysiwyg")
    .addEventListener(
      "click",
      (e) => (e.ctrlKey || e.metaKey) && clickCallback(e),
    );

  document.querySelector(".vditor-ir").addEventListener("click", (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    let ele = e.target;
    if (ele.classList.contains("vditor-ir__link"))
      ele = ele.nextElementSibling?.nextElementSibling?.nextElementSibling;
    if (ele.classList.contains("vditor-ir__marker--link"))
      handler.emit("openLink", ele.textContent);
  });
};

export const imageParser = (viewAbsoluteLocal) => {
  if (!viewAbsoluteLocal) return;
  new MutationObserver((mutations) => {
    mutations.forEach((m) =>
      m.addedNodes.forEach((node) => {
        if (!node.querySelector) return;
        node.querySelectorAll("img").forEach((img) => {
          const url = img.src;
          if (
            !url.startsWith("http") &&
            (url.startsWith("vscode-webview-resource") ||
              url.includes("file:///"))
          ) {
            img.src = `https://file+.vscode-resource.vscode-cdn.net/${url.split("file:///")[1]}`;
          }
        });
      }),
    );
  }).observe(document, { childList: true, subtree: true });
};

export const preventBlurPropagation = () => {
  document.getElementById("editor").addEventListener(
    "blur",
    (e) => {
      e.stopPropagation();
      e.preventDefault();
      return false;
    },
    true,
  );
};

export function annotateBlocks(root, rules = []) {
  rules.forEach(({ selector, category, contextKey }) => {
    if (!selector || !contextKey) return;
    root.querySelectorAll(selector).forEach((el) => {
      // NOTE: no preventDefaultContextMenuItems here — root handles it
      el.dataset.vscodeContext = JSON.stringify({
        [contextKey]: category,
      });
    });
  });
}

export function setupContextSystem(editorRoot, rules) {
  // Root context
  editorRoot.dataset.vscodeContext = JSON.stringify({
    preventDefaultContextMenuItems: true,
    hasSelection: false,
  });

  // Child elements annotation — DOM change pe re-run
  const annotate = debounce(() => annotateBlocks(editorRoot, rules), 80);
  new MutationObserver((mutations) => {
    if (mutations.some((m) => m.addedNodes.length)) annotate();
  }).observe(editorRoot, { childList: true, subtree: true });

  // Selection state
  document.addEventListener(
    "selectionchange",
    debounce(() => {
      patchContext(editorRoot, {
        hasSelection: !!window.getSelection()?.toString().trim(),
      });
    }, 30),
  );

  annotate(); // initial pass
}

function patchContext(el, patch) {
  try {
    const ctx = JSON.parse(el.dataset.vscodeContext || "{}");
    el.dataset.vscodeContext = JSON.stringify({ ...ctx, ...patch });
  } catch (e) {
    console.error("patchContext failed", e);
  }
}

function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
function isCompose(e) {
  return e.metaKey || e.ctrlKey;
}
function matchShortcut(hotkey, event) {
  const matchAlt = (hotkey.match(/!/) != null) == event.altKey;
  const matchMeta = (hotkey.match(/⌘/) != null) == event.metaKey;
  const matchCtrl = (hotkey.match(/\^/) != null) == event.ctrlKey;
  const matchShifter = (hotkey.match(/\+/) != null) == event.shiftKey;

  if (matchAlt && matchCtrl && matchShifter && matchMeta) {
    return hotkey.match(new RegExp(`\\b${event.key}\\b`, "i"));
  }
}
const isMac = navigator.userAgent.includes("Mac OS");
const keyCodes = [222, 219, 57, 192, 56]; // const keys = ['"', "{", "(", "`", "*"];

export const autoSymbol = (handler, editor, config) => {
  let _exec = document.execCommand.bind(document);
  document.execCommand = (cmd, ...args) => {
    if (cmd === "delete") {
      setTimeout(() => {
        return _exec(cmd, ...args);
      });
    } else {
      return _exec(cmd, ...args);
    }
  };
  window.addEventListener(
    "keydown",
    async (e) => {
      if (matchShortcut("^⌘e", e) || matchShortcut("^!e", e)) {
        e.stopPropagation();
        e.preventDefault();
        return handler.emit("editInVSCode", true);
      }

      if (
        isMac &&
        config.preventMacOptionKey &&
        e.altKey &&
        e.shiftKey &&
        ["Digit1", "Digit2", "KeyW"].includes(e.code)
      ) {
        return e.preventDefault();
      }
      if (e.code == "F12") return handler.emit("developerTool");
      if (isCompose(e)) {
        if (e.altKey && isMac) {
          e.preventDefault();
        }
        switch (e.code) {
          case "KeyS":
            vscodeEvent.emit("doSave", editor.getValue());
            e.stopPropagation();
            e.preventDefault();
            break;
          case "KeyV":
            if (e.shiftKey) {
              const text = await navigator.clipboard.readText();
              if (text) document.execCommand("insertText", false, text.trim());
              e.stopPropagation();
            } else if (document.getSelection()?.toString()) {
              // 修复剪切后选中文本没有被清除
              document.execCommand("delete");
            }
            e.preventDefault();
            break;
        }
      }
      if (!keyCodes.includes(e.keyCode)) return;
      const selectText = document.getSelection().toString();
      if (selectText != "") {
        return;
      }
      if (e.key == "(") {
        document.execCommand("insertText", false, ")");
        document.getSelection().modify("move", "left", "character");
      } else if (e.key == "{") {
        document.execCommand("insertText", false, "}");
        document.getSelection().modify("move", "left", "character");
      } else if (e.key == '"') {
        document.execCommand("insertText", false, e.key);
        document.getSelection().modify("move", "left", "character");
      } else if (e.key == "[") {
        document.execCommand("insertText", false, "]");
        document.getSelection().modify("move", "left", "character");
      } else if (e.key == "`") {
        document.execCommand("insertText", false, "`");
        document.getSelection().modify("move", "left", "character");
      } else if (e.key == "*") {
        document.execCommand("insertText", false, "*");
        document.getSelection().modify("move", "left", "character");
      }
    },
    isMac ? true : undefined,
  );

  window.onresize = () => {
    document.getElementById("editor").style.height =
      `${document.documentElement.clientHeight}px`;
  };
  let app;
  let needFocus = false;
  window.onblur = () => {
    if (!app) {
      app = document.querySelector(".vditor-reset");
    }
    const targetNode = document.getSelection()?.baseNode?.parentNode;
    if (!app?.contains(targetNode)) {
      needFocus = false;
      return;
    }
    const curPosition = targetNode?.offsetTop ?? 0;
    const appPosition = app?.scrollTop ?? 0;
    if (appPosition - curPosition < window.innerHeight) {
      needFocus = true;
    }
  };
  window.onfocus = () => {
    if (!app) {
      app = document.querySelector(".vditor-reset");
    }
    if (needFocus) {
      app.focus();
      needFocus = false;
    }
  };
};

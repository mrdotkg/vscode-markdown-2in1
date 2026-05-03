//----------------------
function patchContext(el, patch) {
  try {
    const ctx = JSON.parse(el.dataset.vscodeContext || "{}");
    el.dataset.vscodeContext = JSON.stringify({ ...ctx, ...patch });
  } catch (e) {
    console.error("patchContext failed", e);
  }
}
function getActiveContext() {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return {};
  let el = sel.getRangeAt(0).startContainer;
  if (el?.nodeType === 3) el = el.parentElement;
  while (el && el !== document.body) {
    if (el.dataset?.vscodeContext) {
      try {
        const ctx = JSON.parse(el.dataset.vscodeContext);
        if (ctx.section || ctx.item) return ctx;
      } catch {}
    }
    el = el.parentElement;
  }
  return {};
}
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
function isLeaderKey(e) {
  return e.metaKey || e.ctrlKey;
}
//----------------------

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
  const isImage = (url) => /\.(png|jpe?g|gif|bmp|webp|svg|ico|avif|apng)(\?.*)?$/i.test(url);
  const canOpen = (url) =>
    !!url &&
    (/^https?:\/\//i.test(url) || /^(mailto|tel):/i.test(url) ||
      (/^(file:|vscode-webview-resource:)/i.test(url) && isImage(url)));

  const resolve = (el) => {
    if (el.tagName === "A") return el.getAttribute("href") || el.href;
    if (el.tagName === "IMG") {
      const link = el.closest("a");
      if (link) {
        const href = link.getAttribute("href") || link.href;
        if (canOpen(href)) return href;
      }
      return el.currentSrc || el.src;
    }
    return null;
  };

  const emit = (e, leader = false) => {
    if (leader && !isLeaderKey(e)) return;
    const target = resolve(e.target);
    if (!canOpen(target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    handler.emit("openLink", target);
  };

  document.querySelectorAll(".vditor-ir, .vditor-wysiwyg").forEach((editor) => {
    editor.addEventListener("click", (e) => emit(e, true));
    editor.addEventListener("dblclick", emit, true);
  });

  document.querySelector(".vditor-reset")?.addEventListener("scroll", (e) =>
    handler.emit("scroll", { scrollTop: e.target.scrollTop - 70 }),
  );

  document.querySelector(".vditor-ir")?.addEventListener("click", (e) => {
    if (!isLeaderKey(e)) return;
    let el = e.target;
    if (el.classList.contains("vditor-ir__link")) {
      el = el.nextElementSibling?.nextElementSibling?.nextElementSibling;
    }
    if (el.classList.contains("vditor-ir__marker--link")) {
      const target = el.textContent;
      if (canOpen(target)) handler.emit("openLink", target);
    }
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
      const hasSelection = !!window.getSelection()?.toString().trim();
      patchContext(editorRoot, { hasSelection });
      handler.emit("contextChange", { hasSelection, ...getActiveContext() });
    }, 30),
  );
  editorRoot.addEventListener(
    "click",
    debounce(() => {
      const hasSelection = !!window.getSelection()?.toString().trim();
      handler.emit("contextChange", { hasSelection, ...getActiveContext() });
    }, 50),
  );

  annotate(); // initial pass
}

export const asyncDelete = () => {
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
};
export const resizeEditorTab = () => {
  window.onresize = () => {
    document.getElementById("editor").style.height =
      `${document.documentElement.clientHeight}px`;
  };
};
// AFTER
export const disableFS = () => {
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform);
  document.getElementById("editor").addEventListener(
    "keydown",
    (e) => {
      const leader = isMac ? e.metaKey : e.ctrlKey;
      if (
        (leader && e.key === "'") ||
        (leader && e.altKey && ["7", "8", "9"].includes(e.key))
      ) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
};
export const trackSelectionState = () => {
  document.addEventListener("selectionchange", () => {
    const text = window.vditor?.getSelection()?.toString() ?? "";
    handler.emit("selectionChange", text);
  });
};

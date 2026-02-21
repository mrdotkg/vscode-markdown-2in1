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

export const addScrollListener = () => {
  const container = [
    ".vditor-reset",
    ".vditor-ir .vditor-reset",
    ".vditor-wysiwyg .vditor-reset",
    ".vditor-ir__preview",
    ".vditor-ir",
    ".vditor",
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
      if (window.vditor?.currentMode === "ir") {
        const sel = window.getSelection();
        if (sel.rangeCount) window.vditor.ir.range = sel.getRangeAt(0);
      }
      return false;
    },
    true,
  );
};

export function setupFocusManagement() {
  const state = {
    cursorPosition: null,
    selection: null,
    hasFocus: false,
    savedRange: null,
  };

  const getIRSelection = () => {
    if (window.vditor?.currentMode !== "ir") return null;
    const sel = window.getSelection();
    if (!sel.rangeCount) return null;
    const range = sel.getRangeAt(0);
    const ir = document.querySelector(".vditor-ir .vditor-reset");
    if (ir?.contains(range.startContainer) || ir?.contains(range.endContainer))
      return {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        collapsed: range.collapsed,
      };
    return null;
  };

  const setIRSelection = (data) => {
    if (!data || window.vditor?.currentMode !== "ir") return false;
    try {
      const range = document.createRange();
      range.setStart(data.startContainer, data.startOffset);
      range.setEnd(data.endContainer, data.endOffset);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      if (window.vditor.ir) window.vditor.ir.range = range;
      return true;
    } catch {
      return false;
    }
  };

  const saveState = () => {
    if (!window.vditor) return;
    try {
      state.cursorPosition = window.vditor.getCursorPosition();
      state.selection = getIRSelection();
      state.hasFocus = !!document.activeElement?.closest(".vditor-ir");
      if (window.vditor.ir?.range)
        state.savedRange = window.vditor.ir.range.cloneRange();
    } catch {}
  };

  const restoreState = () => {
    if (!window.vditor) return;
    try {
      window.vditor.focus();
      if (window.vditor.currentMode === "ir") {
        setTimeout(() => {
          if (
            !(state.selection && setIRSelection(state.selection)) &&
            state.savedRange
          ) {
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(state.savedRange);
            if (window.vditor.ir) window.vditor.ir.range = state.savedRange;
          }
        }, 10);
      }
    } catch {}
  };

  window.addEventListener("blur", saveState);
  window.addEventListener("focus", () => setTimeout(restoreState, 50));
}

export function annotateBlocks(root, rules = []) {
  if (!rules || rules.length === 0) return;
  
  rules.forEach((rule) => {
    // Handle both old array format and new ContextRule format for backward compatibility
    const selector = typeof rule === "string" ? rule[0] : rule.selector;
    const contextKey = typeof rule === "string" ? null : rule.contextKey;
    const contextName = typeof rule === "string" ? rule[1] : rule.vscWebviewContext;
    
    if (!selector) return;
    
    root.querySelectorAll(selector).forEach((el) => {
      const ctx = {};
      if (contextKey && contextName) {
        ctx[contextKey] = contextName;
      }
      if (Object.keys(ctx).length) {
        el.dataset.vscodeContext = JSON.stringify(ctx);
      }
    });
  });
}

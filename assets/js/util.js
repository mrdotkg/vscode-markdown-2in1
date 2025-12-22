export const openLink = () => {
  const clickCallback = (e) => {
    let ele = e.target;
    e.stopPropagation();
    const isSpecial = ["dblclick", "auxclick"].includes(e.type);
    if (!isCompose(e) && !isSpecial) {
      return;
    }
    if (ele.tagName == "A") {
      handler.emit("openLink", ele.href);
    } else if (ele.tagName == "IMG") {
      const parent = ele.parentElement;
      if (parent?.tagName == "A" && parent.href) {
        handler.emit("openLink", parent.href);
        return;
      }
      const src = ele.src;
      if (src?.match(/http/)) {
        handler.emit("openLink", src);
      }
    }
  };
  const content = document.querySelector(".vditor-wysiwyg");
  content.addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey) {
      clickCallback(e);
    }
  });
  document.querySelector(".vditor-ir").addEventListener("click", (e) => {
    if (e.ctrlKey || e.metaKey) {
      let ele = e.target;
      if (ele.classList.contains("vditor-ir__link")) {
        ele =
          e.target.nextElementSibling?.nextElementSibling?.nextElementSibling;
      }
      if (ele.classList.contains("vditor-ir__marker--link")) {
        handler.emit("openLink", ele.textContent);
      }
    }
  });
};

export const addScrollListener = () => {
  const possibleContainers = [
    ".vditor-reset",
    ".vditor-ir .vditor-reset",
    ".vditor-wysiwyg .vditor-reset",
    ".vditor-ir__preview",
    ".vditor-ir",
    ".vditor",
  ];

  let scrollContainer = null;
  for (const selector of possibleContainers) {
    scrollContainer = document.querySelector(selector);
    if (scrollContainer) {
      break;
    }
  }

  if (!scrollContainer) {
    setTimeout(addScrollListener, 100);
    return;
  }

  if (typeof handler === "undefined" || handler === null) {
    return;
  }

  let lastScrollTime = 0;
  scrollContainer.addEventListener("scroll", (e) => {
    const now = Date.now();
    if (now - lastScrollTime < 50) return;
    lastScrollTime = now;

    const scrollTop = e.target.scrollTop - 70;
    handler.emit("scroll", { scrollTop });
  });

  let lastWindowScrollTime = 0;
  window.addEventListener("scroll", (e) => {
    const now = Date.now();
    if (now - lastWindowScrollTime < 50) return;
    lastWindowScrollTime = now;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    handler.emit("scroll", { scrollTop: scrollTop - 70 });
  });
};

export function scrollEditor(top) {
  if (!top || top <= 0) {
    return;
  }

  const tryWindowScroll = () => {
    window.scrollTo({ top: top + 70, behavior: "auto" });

    setTimeout(() => {
      const currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;
      if (Math.abs(currentScroll - (top + 70)) > 5) {
        document.documentElement.scrollTop = top + 70;
        document.body.scrollTop = top + 70;
      }
    }, 100);
  };

  const scrollHack = setInterval(() => {
    const editorContainer = document.querySelector(".vditor-reset");
    if (!editorContainer) {
      tryWindowScroll();
      clearInterval(scrollHack);
      return;
    }

    editorContainer.scrollTo({ top, behavior: "auto" });

    tryWindowScroll();

    clearInterval(scrollHack);
  }, 10);
}

export const imageParser = (viewAbsoluteLocal) => {
  if (!viewAbsoluteLocal) return;
  var observer = new MutationObserver((mutationList) => {
    for (var mutation of mutationList) {
      for (var node of mutation.addedNodes) {
        if (!node.querySelector) continue;
        const imgs = node.querySelectorAll("img");
        for (const img of imgs) {
          const url = img.src;
          if (url.startsWith("http")) {
            continue;
          }
          if (
            url.startsWith("vscode-webview-resource") ||
            url.includes("file:///")
          ) {
            img.src = `https://file+.vscode-resource.vscode-cdn.net/${
              url.split("file:///")[1]
            }`;
          }
        }
      }
    }
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
  });
};

export const preventBlurPropagation = () => {
  document.getElementById('editor').addEventListener(
    "blur",
    (event) => {
      event.stopPropagation();
      event.preventDefault();

      if (window.vditor && window.vditor.currentMode === "ir") {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          window.vditor.ir.range = selection.getRangeAt(0);
        }
      }

      return false;
    },
    true
  );
};

export function setupFocusManagement() {
  let editorState = {
    cursorPosition: null,
    selection: null,
    hasFocus: false,
    savedRange: null,
    wasEditing: false,
  };

  function getIRSelection() {
    if (window.vditor && window.vditor.currentMode === "ir") {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const irElement = document.querySelector(".vditor-ir .vditor-reset");

        if (
          irElement &&
          (irElement.contains(range.startContainer) ||
            irElement.contains(range.endContainer))
        ) {
          return {
            startContainer: range.startContainer,
            startOffset: range.startOffset,
            endContainer: range.endContainer,
            endOffset: range.endOffset,
            collapsed: range.collapsed,
          };
        }
      }
    }
    return null;
  }

  function setIRSelection(rangeData) {
    if (rangeData && window.vditor && window.vditor.currentMode === "ir") {
      try {
        const range = document.createRange();
        range.setStart(rangeData.startContainer, rangeData.startOffset);
        range.setEnd(rangeData.endContainer, rangeData.endOffset);

        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);

        if (window.vditor.ir) {
          window.vditor.ir.range = range;
        }

        return true;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  function saveState() {
    if (!window.vditor) return;

    try {
      editorState.cursorPosition = window.vditor.getCursorPosition();
      editorState.selection = getIRSelection();
      editorState.hasFocus =
        document.activeElement?.closest(".vditor-ir") !== null;

      if (window.vditor.ir && window.vditor.ir.range) {
        editorState.savedRange = window.vditor.ir.range.cloneRange();
      }
    } catch (e) {}
  }

  function restoreState() {
    if (!window.vditor) return;

    try {
      window.vditor.focus();

      if (window.vditor.currentMode === "ir") {
        setTimeout(() => {
          let restored = false;

          if (editorState.selection) {
            restored = setIRSelection(editorState.selection);
          }

          if (!restored && editorState.savedRange) {
            try {
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(editorState.savedRange);
              if (window.vditor.ir) {
                window.vditor.ir.range = editorState.savedRange;
              }
              restored = true;
            } catch (e) {}
          }

          if (!restored) {
            window.vditor.focus();
          }
        }, 10);
      }

      setTimeout(() => {
        if (window.vditor && window.vditor.currentMode === "ir") {
          const irElement = document.querySelector(".vditor-ir .vditor-reset");
          if (irElement) {
            window.vditor.focus();
            irElement.focus();

            setTimeout(() => {
              if (document.activeElement !== irElement) {
                irElement.click();
                irElement.focus();
              }
            }, 20);
          }
        }
      }, 100);

      if (window.vditor && window.vditor.currentMode === "ir") {
        setTimeout(() => {
          const irElement = document.querySelector(".vditor-ir .vditor-reset");
          if (irElement) {
            try {
              const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
              });
              irElement.dispatchEvent(clickEvent);

              const inputEvent = new Event("input", {
                bubbles: true,
                cancelable: true,
              });
              irElement.dispatchEvent(inputEvent);

              if (irElement.contentEditable) {
                irElement.setAttribute("contenteditable", "true");
                irElement.focus();
              }
            } catch (e) {}
          }
        }, 80);
      }
    } catch (e) {}
  }

  window.addEventListener("blur", () => {
    saveState();
  });

  window.addEventListener("focus", () => {
    setTimeout(restoreState, 50);
  });
}
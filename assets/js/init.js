import {
  restoreCursorFromPoint,
  setupCursorTracking,
  asyncDelete,
  resizeEditorTab,
  setupContextSystem,
  openLink,
  imageParser,
  scrollEditor,
  addScrollListener,
  preventBlurPropagation,
  setupFocusManagement,
  disableFS,
  trackSelectionState,
  trackTrustedKeystrokes,
} from "./util.js";

// ─── Zoom Utilities ──────────────────────────────────────────────────────────
const MIN_ZOOM = -5; // Roughly 84% (2^(-5/10))
const MAX_ZOOM = 5; // Roughly 148% (2^(5/10))
const ZOOM_STEP = 1; // Increment by 1 level
let tempZoom = 0; // Shared temp zoom state - accessible to all handlers
let currentBaseFontSize = 15; // Store base font size for broadcast updates
let currentZoomConfig = {}; // Store current zoom config for broadcast updates

// Convert zoom level to multiplier (matches VS Code: 2^(zoomLevel/10))
const getZoomMultiplier = (zoomLevel) => Math.pow(2, zoomLevel / 10);

const applyZoom = (baseFontSize, zoomConfig) => {
  // If mouseWheelZoom is on, apply temporary session zoom
  // Otherwise, apply window.zoomLevel from config
  const zoomLevel = zoomConfig.mouseWheelZoom
    ? zoomConfig.tempZoom
    : zoomConfig.zoomLevel;
  const multiplier = getZoomMultiplier(zoomLevel);

  // Use CSS transform: scale() at the document root - this affects everything proportionally
  // This is how VS Code's window zoom works
  const root = document.documentElement;
  root.style.transform = `scale(${multiplier})`;
  root.style.transformOrigin = "0 0";
  // set root --markdown-font-size variable to baseFontSize * multiplier to ensure markdown preview scales with editor zoom
  root.style.setProperty(
    "--markdown-font-size",
    `${baseFontSize * multiplier}px`,
  );
};

const setupZoom = (baseFontSize, zoomConfig) => {
  // Store for use in broadcast handlers
  currentBaseFontSize = baseFontSize;
  currentZoomConfig = { ...zoomConfig };

  if (!zoomConfig.mouseWheelZoom) {
    // If mouseWheelZoom is off, just apply the window.zoomLevel once
    applyZoom(baseFontSize, { ...zoomConfig, tempZoom: 0 });
    return;
  }

  // If mouseWheelZoom is on, setup Ctrl+wheel for temporary session zoom
  const wheelHandler = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    tempZoom += e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
    tempZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, tempZoom));
    applyZoom(baseFontSize, { ...zoomConfig, tempZoom });
    // Broadcast temp zoom change to all other tabs
    handler.emit("tempZoomChanged", { tempZoom });
  };

  // Attach to the editor element for better event capture
  const editor = document.getElementById("editor");
  if (editor) {
    editor.addEventListener("wheel", wheelHandler, { passive: false });
  } else {
    window.addEventListener("wheel", wheelHandler, { passive: false });
  }
};

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const vscode = typeof acquireVsCodeApi !== "undefined" && acquireVsCodeApi();
const events = {};
const state = JSON.parse(document.getElementById("app-config").getHTML());
const EDITOR = "editor";
const rules = state.contextRules || [];

document.getElementById(EDITOR).classList.add(state.platform);
document.body.classList.toggle(
  "scrollBeyondLastLine",
  state.scrollBeyondLastLine,
);

// ─── Messaging ───────────────────────────────────────────────────────────────
window.addEventListener(
  "message",
  ({ data: d }) => d && events[d.type]?.(d.content),
);

window.handler = {
  on: (e, fn) => ((events[e] = fn), window.handler),
  emit: (e, d) => vscode?.postMessage({ type: e, content: d }),
};

let lastNativeKey = null;
const toKeyString = ({ ctrlKey, altKey, shiftKey, key }) =>
  [ctrlKey && "ctrl", altKey && "alt", shiftKey && "shift", key?.toLowerCase()]
    .filter(Boolean)
    .join("+");

function parseKeyString(keyString) {
  const parts = keyString.split("+");
  const eventInit = {
    key: "",
    code: "",
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    bubbles: true,
    cancelable: true,
  };

  parts.forEach((part) => {
    const p = part.trim().toLowerCase();
    switch (p) {
      case "ctrl":
        eventInit.ctrlKey = true;
        break;
      case "alt":
        eventInit.altKey = true;
        break;
      case "shift":
        eventInit.shiftKey = true;
        break;
      case "meta":
      case "cmd":
      case "command":
        eventInit.metaKey = true;
        break;
      default:
        // actual key
        eventInit.key = part;
        if (/^[0-9]$/.test(part)) {
          eventInit.code = "Digit" + part;
        } else if (/^[a-z]$/i.test(part)) {
          eventInit.code = "Key" + part.toUpperCase();
        } else {
          eventInit.code = part;
        }
        break;
    }
  });

  return eventInit;
}

// ─── Handlers ────────────────────────────────────────────────────────────────
handler
  .on("updateScrollBeyondLastLine", (v) =>
    document.body.classList.toggle("scrollBeyondLastLine", v),
  )

  .on("updateActiveColorThemeKind", (v) =>
    vditor.setTheme(v === "light" ? "vs" : "vs2015"),
  )

  .on("pasteImageMarkdown", (markdown) => {
    window.vditor.focus();
    window.vditor.insertMD(markdown);
  })

  .on("vditorCommand", (hotkeys) => {
    const nativeHandled = lastNativeKey === hotkeys;
    lastNativeKey = null;

    if (!nativeHandled) {
      // Menu / palette triggered — vditor has no idea, dispatch synthetic keys
      window.vditor.focus();
      ["keydown", "keypress", "keyup"].forEach((t) =>
        (document.activeElement || window.vditor.ir.element).dispatchEvent(
          new KeyboardEvent(t, parseKeyString(hotkeys)),
        ),
      );
    }
  })
  .on("updateMdConfig", (mdConfig) => {
    console.log("[markpen] Received updateMdConfig:", mdConfig);
    if (mdConfig?.fontSize && mdConfig?.zoomLevel !== undefined) {
      // Store the config for broadcast updates
      currentBaseFontSize = mdConfig.fontSize;
      currentZoomConfig = {
        zoomLevel: mdConfig.zoomLevel,
        mouseWheelZoom: mdConfig.mouseWheelZoom || false,
        tempZoom: 0,
      };
      // Reset temp zoom when config updates
      tempZoom = 0;
      applyZoom(mdConfig.fontSize, currentZoomConfig);
    }
    if (mdConfig?.fontFamily != null) {
      document.documentElement.style.setProperty(
        "--markdown-font-family",
        mdConfig.fontFamily,
      );
    }
  })

  .on("updateTempZoom", (data) => {
    // Broadcast from another tab - update local tempZoom and apply
    tempZoom = data.tempZoom;
    applyZoom(currentBaseFontSize, { ...currentZoomConfig, tempZoom });
  })

  .on("open", (md) => {
    const { config, mdConfig, editorConfig } = md;
    if (mdConfig?.fontSize && mdConfig?.zoomLevel !== undefined) {
      applyZoom(mdConfig.fontSize, {
        zoomLevel: mdConfig.zoomLevel,
        mouseWheelZoom: mdConfig.mouseWheelZoom || false,
        tempZoom: 0,
      });
    }
    if (mdConfig?.fontFamily != null) {
      document.documentElement.style.setProperty(
        "--markdown-font-family",
        mdConfig.fontFamily,
      );
    }
    window.vditor = new Vditor(EDITOR, {
      value: md.content,
      height: document.documentElement.clientHeight,
      mode: "ir",
      lang: config.editorLanguage || "en_US",
      tab: "  ",
      toolbarConfig: { tipPosition: "south", hide: config.hideToolbar },
      cache: { enable: false },
      customWysiwygToolbar: () => {},
      preview: {
        theme: { current: "none" },
        markdown: { toc: false, codeBlockPreview: true },
        hljs: {
          enable: true,
          style: document.body.classList.contains("vscode-dark")
            ? "vs2015"
            : "vs",
          lineNumber: config.previewCodeHighlight.showLineNumber,
        },
        extPath: md.rootPath,
        math: { engine: "KaTeX", inlineDigit: true },
        mode: "editor",
      },
      extPath: md.rootPath,
      input: (c) => handler.emit("save", c),
      upload: {
        url: "/image",
        accept: "image/*",
        handler(files) {
          const reader = new FileReader();
          reader.onloadend = () => handler.emit("img", reader.result);
          reader.readAsBinaryString(files[0]);
        },
      },

      after() {
        setupZoom(md.mdConfig?.fontSize || 14, {
          zoomLevel: md.mdConfig?.zoomLevel || 0,
          mouseWheelZoom: md.mdConfig?.mouseWheelZoom || false,
        });
        setupCursorTracking();
        if (md.cursor) setTimeout(() => restoreCursorFromPoint(md.cursor), 150);
        asyncDelete();
        resizeEditorTab();
        trackTrustedKeystrokes();
        disableFS();
        trackSelectionState();
        handler.on("update", (c) => window.vditor.setValue(c));
        openLink();
        setupContextSystem(document.getElementById("editor"), rules);
        preventBlurPropagation();
        addScrollListener();
        scrollEditor(md.scrollTop);
        setupFocusManagement();
        imageParser(true);
      },
    });
  })

  .emit("init");

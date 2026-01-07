/**
 * Feature definitions - single source of truth for all markdown formatting features
 * Contains metadata, keybindings, icons, and configuration
 * No exposure/visibility logic - pure data only
 */

export interface Feature {
  id: string;
  command: string;
  title: string;
  category: string;
  icon: string;
  text?: string;
  keybinding?: string;
  keyEvent?: KeyEventConfig;
  weight: number;
  enabledByDefault: boolean;
  showInEditorTitle?: boolean;
  showInEditorContextMenu?: boolean;
  showInStatusBar?: boolean;
  showInWebviewContextMenu?: boolean;
}

export interface KeyEventConfig {
  key: string;
  code: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  bubbles?: boolean;
  cancelable?: boolean;
}

export const Features: Feature[] = [
  // Headings
  {
    id: "insertH1",
    command: "vsc-markdown.insertH1",
    title: "Insert H1 Heading",
    category: "headings",
    icon: "$(symbol-text)",
    text: "H1",
    keybinding: "ctrl+alt+1",
    weight: 100,
    enabledByDefault: false,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "1",
      code: "Digit1",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertH2",
    command: "vsc-markdown.insertH2",
    title: "Insert H2 Heading",
    category: "headings",
    icon: "$(symbol-text)",
    text: "H2",
    keybinding: "ctrl+alt+2",
    weight: 99,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "2",
      code: "Digit2",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertH3",
    command: "vsc-markdown.insertH3",
    title: "Insert H3 Heading",
    category: "headings",
    icon: "$(symbol-text)",
    text: "H3",
    keybinding: "ctrl+alt+3",
    weight: 98,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "3",
      code: "Digit3",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertH4",
    command: "vsc-markdown.insertH4",
    title: "Insert H4 Heading",
    category: "headings",
    icon: "$(symbol-text)",
    text: "H4",
    keybinding: "ctrl+alt+4",
    weight: 97,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "4",
      code: "Digit4",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertH5",
    command: "vsc-markdown.insertH5",
    title: "Insert H5 Heading",
    category: "headings",
    icon: "$(symbol-text)",
    text: "H5",
    keybinding: "ctrl+alt+5",
    weight: 96,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "5",
      code: "Digit5",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertH6",
    command: "vsc-markdown.insertH6",
    title: "Insert H6 Heading",
    category: "headings",
    icon: "$(symbol-text)",
    text: "H6",
    keybinding: "ctrl+alt+6",
    weight: 95,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "6",
      code: "Digit6",
      ctrlKey: true,
      altKey: true,
      bubbles: true,
      cancelable: true,
    },
  },

  // Text Formatting
  {
    id: "insertBold",
    command: "vsc-markdown.insertBold",
    title: "Insert Bold Text",
    category: "formatting",
    icon: "$(bold)",
    keybinding: "ctrl+b",
    weight: 90,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "b",
      code: "KeyB",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertItalic",
    command: "vsc-markdown.insertItalic",
    title: "Insert Italic Text",
    category: "formatting",
    icon: "$(italic)",
    keybinding: "ctrl+i",
    weight: 89,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "i",
      code: "KeyI",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertStrikethrough",
    command: "vsc-markdown.insertStrikethrough",
    title: "Insert Strikethrough",
    category: "formatting",
    icon: "$(strikethrough)",
    keybinding: "ctrl+shift+s",
    weight: 88,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "s",
      code: "KeyS",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertCode",
    command: "vsc-markdown.insertCode",
    title: "Insert Inline Code",
    category: "formatting",
    icon: "$(symbol-string)",
    keybinding: "ctrl+grave",
    weight: 87,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: true,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "`",
      code: "Backquote",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },

  // Lists
  {
    id: "insertList",
    command: "vsc-markdown.insertList",
    title: "Insert Unordered List",
    category: "lists",
    icon: "$(list-unordered)",
    keybinding: "ctrl+l",
    weight: 85,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "l",
      code: "KeyL",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertOrderedList",
    command: "vsc-markdown.insertOrderedList",
    title: "Insert Ordered List",
    category: "lists",
    icon: "$(list-ordered)",
    keybinding: "ctrl+shift+l",
    weight: 84,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "l",
      code: "KeyL",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertTaskList",
    command: "vsc-markdown.insertTaskList",
    title: "Insert Task List",
    category: "lists",
    icon: "$(tasklist)",
    keybinding: "ctrl+j",
    weight: 83,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "j",
      code: "KeyJ",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "toggleTaskCheck",
    command: "vsc-markdown.toggleTaskCheck",
    title: "Toggle Task Check",
    category: "lists",
    icon: "$(check)",
    keybinding: "ctrl+shift+j",
    weight: 82,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "j",
      code: "KeyJ",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "indentList",
    command: "vsc-markdown.indentList",
    title: "Indent List",
    category: "lists",
    icon: "$(indent)",
    keybinding: "tab",
    weight: 81,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "Tab",
      code: "Tab",
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "unindentList",
    command: "vsc-markdown.unindentList",
    title: "Unindent List",
    category: "lists",
    icon: "$(outdent)",
    keybinding: "shift+tab",
    weight: 80,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "Tab",
      code: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },

  // Links and Code Blocks
  {
    id: "insertLink",
    command: "vsc-markdown.insertLink",
    title: "Insert Link",
    category: "blocks",
    icon: "$(link)",
    keybinding: "ctrl+k",
    weight: 75,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "k",
      code: "KeyK",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "toggleLinkInput",
    command: "vsc-markdown.toggleLinkInput",
    title: "Toggle Link Input",
    category: "blocks",
    icon: "$(link)",
    keybinding: "alt+enter",
    weight: 74,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "Enter",
      code: "Enter",
      altKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertImage",
    command: "vsc-markdown.insertImage",
    title: "Insert Image",
    category: "blocks",
    icon: "$(file-media)",
    keybinding: "",
    weight: 73,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
  },
  {
    id: "insertCodeBlock",
    command: "vsc-markdown.insertCodeBlock",
    title: "Insert Code Block",
    category: "blocks",
    icon: "$(code)",
    keybinding: "ctrl+u",
    weight: 72,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "u",
      code: "KeyU",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },

  // Tables and Quotes
  {
    id: "insertTable",
    command: "vsc-markdown.insertTable",
    title: "Insert Table",
    category: "blocks",
    icon: "$(table)",
    keybinding: "ctrl+t",
    weight: 71,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "t",
      code: "KeyT",
      ctrlKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertQuote",
    command: "vsc-markdown.insertQuote",
    title: "Insert Block Quote",
    category: "blocks",
    icon: "$(quote)",
    keybinding: "ctrl+shift+q",
    weight: 70,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "q",
      code: "KeyQ",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "insertHorizontalRule",
    command: "vsc-markdown.insertHorizontalRule",
    title: "Insert Horizontal Rule",
    category: "blocks",
    icon: "$(minus)",
    keybinding: "ctrl+shift+h",
    weight: 69,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: "h",
      code: "KeyH",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },


  // Utilities
  {
    id: "pasteClipboardImage",
    command: "vsc-markdown.pasteClipboardImage",
    title: "Paste Clipboard Image",
    category: "utilities",
    icon: "$(clippy)",
    keybinding: "",
    weight: 55,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
  },
  {
    id: "switchEditor",
    command: "vsc-markdown.switchEditor",
    title: "Switch Editor",
    category: "utilities",
    icon: "$(multiple-windows)",
    keybinding: "ctrl+shift+p",
    weight: 54,
    enabledByDefault: true,
    showInEditorTitle: true,
    showInEditorContextMenu: false,
    showInStatusBar: false,
    showInWebviewContextMenu: false,
    keyEvent: {
      key: "p",
      code: "KeyP",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "openPreview",
    command: "vsc-markdown.openPreview",
    title: "Open Preview",
    category: "utilities",
    icon: "$(open-preview)",
    keybinding: "ctrl+shift+v",
    weight: 53,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: false,
    keyEvent: {
      key: "v",
      code: "KeyV",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "formatDocument",
    command: "vsc-markdown.formatDocument",
    title: "Format Document",
    category: "utilities",
    icon: "$(formatting)",
    keybinding: "ctrl+shift+f",
    weight: 52,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: false,
    keyEvent: {
      key: "f",
      code: "KeyF",
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    },
  },
  {
    id: "uploadImage",
    command: "vsc-markdown.uploadImage",
    title: "Upload Image",
    category: "utilities",
    icon: "$(cloud-upload)",
    keybinding: "",
    weight: 51,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
  },
  {
    id: "exportHtml",
    command: "vsc-markdown.exportHtml",
    title: "Export as HTML",
    category: "utilities",
    icon: "$(file-code)",
    keybinding: "",
    weight: 50,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: false,
  },
  {
    id: "exportPdf",
    command: "vsc-markdown.exportPdf",
    title: "Export as PDF",
    category: "utilities",
    icon: "$(file-pdf)",
    keybinding: "",
    weight: 49,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: false,
  },

  // Text Case Conversions
  {
    id: "convertToUppercase",
    command: "vsc-markdown.convertToUppercase",
    title: "Convert to Uppercase",
    category: "text",
    icon: "$(symbol-text)",
    keybinding: "",
    weight: 45,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
  },
  {
    id: "convertToLowercase",
    command: "vsc-markdown.convertToLowercase",
    title: "Convert to Lowercase",
    category: "text",
    icon: "$(symbol-text)",
    keybinding: "",
    weight: 44,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
  },
  {
    id: "convertToTitleCase",
    command: "vsc-markdown.convertToTitleCase",
    title: "Convert to Title Case",
    category: "text",
    icon: "$(symbol-text)",
    keybinding: "",
    weight: 43,
    enabledByDefault: true,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
  },
  // Emoji and Special Chars
  {
    id: "insertEmoji",
    command: "vsc-markdown.insertEmoji",
    title: "Insert Emoji",
    category: "special",
    icon: "$(smiley)",
    keybinding: ":",
    weight: 61,
    enabledByDefault: false,
    showInEditorTitle: false,
    showInEditorContextMenu: true,
    showInStatusBar: false,
    showInWebviewContextMenu: true,
    keyEvent: {
      key: ":",
      code: "Colon",
      bubbles: true,
      cancelable: true,
    },
  },
];

// Category metadata for display names
export const CategoryMetadata: Record<string, { name: string; icon: string }> = {
  headings: { name: "Headings", icon: "$(heading)" },
  formatting: { name: "Text Formatting", icon: "$(bold)" },
  lists: { name: "Lists", icon: "$(list-unordered)" },
  blocks: { name: "Blocks", icon: "$(quote)" },
  special: { name: "Special Elements", icon: "$(symbol-special)" },
  utilities: { name: "Utilities", icon: "$(tools)" },
  text: { name: "Text Conversion", icon: "$(symbol-text)" },
  help: { name: "Help", icon: "$(question)" },
};

export type ShowKey =
  | "showInEditorTitle"
  | "showInEditorContextMenu"
  | "showInStatusBar"
  | "showInWebviewContextMenu";

// Exported Feature class with helper static methods
export class FeatureModel implements Feature {
  id: string;
  command: string;
  title: string;
  category: string;
  icon: string;
  text?: string;
  keybinding?: string;
  keyEvent?: KeyEventConfig;
  weight: number;
  enabledByDefault: boolean;
  showInEditorTitle?: boolean;
  showInEditorContextMenu?: boolean;
  showInStatusBar?: boolean;
  showInWebviewContextMenu?: boolean;

  constructor(feature: Feature) {
    Object.assign(this, feature);
  }

  static get(showKey: ShowKey, onlyEnabled = true): Feature[] {
    return Features.filter(f =>
      (onlyEnabled ? f.enabledByDefault : true) && (f as any)[showKey] === true
    );
  }
}

// Helper filter functions for feature visibility
export function getEditorTitleFeatures(): Feature[] {
  return FeatureModel.get("showInEditorTitle");
}

export function getEditorContextFeatures(): Feature[] {
  return FeatureModel.get("showInEditorContextMenu");
}

export function getStatusBarFeatures(): Feature[] {
  return FeatureModel.get("showInStatusBar");
}

export function getWebviewContextFeatures(): Feature[] {
  return FeatureModel.get("showInWebviewContextMenu");
}

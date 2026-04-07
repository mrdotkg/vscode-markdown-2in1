import { promises as fs } from "fs";
import { Features } from "./common/features";
import { Addons } from "./common/addons";
import { Holder } from "./common/holder";
import path from "path";

const allFeatures = [...Features, ...Addons];
const prefix = (cmd: string) => `markpen.${cmd}`;
const mdActive = "activeCustomEditorId == 'markpen'";
const mdFile = "editorLangId == markdown || resourceExtname == '.md'";
const INLINE_SELECTORS = new Set(["strong", "em", "del", "code", "a", "input"]);
const isInline = (sel: string) => INLINE_SELECTORS.has(sel.split(/[\s,>]/)[0]);

// Derive group string from category — no contextGroup key needed
function buildGroup(f: any, counters: Record<string, number>): string {
  const cat = (f.category ?? "misc").toLowerCase().replace(/\s+/g, "_");
  counters[cat] = (counters[cat] ?? 0) + 1;
  return `${cat}@${counters[cat]}`;
}

// Derive when clause from selector + category — no contextKey/vscWebviewContext needed
function buildWhen(f: any): string {
  const base = mdActive;

  if (f.selector) {
    const key = isInline(f.selector) ? "item" : "section";
    return `${base} && ${key} == '${f.category}'`;
  }

  // No selector — command applies within a category context
  switch (f.category) {
    case "Headings":
      return `${base} && section == 'Headings'`;
    case "Table":
      return `${base} && section == 'Table'`;
    case "Lists":
      return `${base} && section == 'Lists'`;
    case "Code":
      return `${base} && section == 'Code'`;
    case "Blockquote":
      return `${base} && section == 'Blockquote'`;
    case "Emphasis":
      return `${base} && hasSelection`;
    default:
      return base; // always visible
  }
}

const mapMenu = (key: string, when: string, group?: string) =>
  Holder.menus[key]
    .split(" ")
    .filter(Boolean)
    .map((cmd) => ({ command: prefix(cmd), when, ...(group && { group }) }));

function isEquivalent(binding: string, evt: any): boolean {
  const parts = binding.toLowerCase().split("+");
  return (
    !!evt.ctrlKey === parts.includes("ctrl") &&
    !!evt.altKey === parts.includes("alt") &&
    !!evt.shiftKey === parts.includes("shift") &&
    parts.includes(evt.key.toLowerCase())
  );
}
const counters: Record<string, number> = {};

const contributes = {
  customEditors: [
    {
      viewType: "markpen",
      displayName: "MarkPen",
      priority: "default",
      selector: [
        { filenamePattern: "**/*.md" },
        { filenamePattern: "**/*.markdown" },
      ],
    },
  ],
  commands: allFeatures.map((f: any) => ({
    command: prefix(f.command),
    title: f.title,
    icon: f.icon,
    category: "MarkPen",
  })),
  keybindings: allFeatures
    .filter((f: any) => f.keybinding)
    .map((f: any) => {
      const overlaps = f.keyEvent && isEquivalent(f.keybinding, f.keyEvent);
      return {
        command: prefix(f.command),
        key: f.keybinding,
        when: mdActive + ` && webviewFocus`,
      };
    }),
  menus: {
    commandPalette: mapMenu("commandPalette", mdActive),
    "editor/context": mapMenu("editor/context", mdFile, "1_modification@1"),
    "editor/title": mapMenu("editor/title", mdFile, "navigation@-2"),
    "editor/title/context": mapMenu(
      "editor/title/context",
      mdActive,
      "navigation@-2",
    ),
    // webview/context — fully derived, no manual group/when keys on features
    "webview/context": allFeatures.map((f: any) => ({
      command: prefix(f.command),
      when: buildWhen(f),
      group: buildGroup(f, counters),
    })),
  },
  configuration: {
    title: "MarkPen",
    properties: {
      "markpen.menus": {
        type: "object",
        default: Holder.menus,
        markdownDescription: "Customize menu... (options: h1, h2, etc.)",
      },
      "markpen.openOutline": {
        type: "boolean",
        default: true,
        description: "Open markdown outline.",
      },
      "markpen.hideToolbar": {
        type: "boolean",
        default: false,
        description: "Hide markdown toolbar.",
      },
      "markpen.previewCode": {
        type: "boolean",
        default: true,
        description: "Preview code in markdown.",
      },
      "markpen.previewCodeHighlight.showLineNumber": {
        type: "boolean",
        default: false,
        description: "Show line numbers.",
      },
      "markpen.workspacePathAsImageBasePath": {
        type: "boolean",
        default: false,
        description: "Workspace as base path.",
      },
      "markpen.pasterImgPath": {
        type: "string",
        default: "image/${fileName}/${now}.png",
        description: "Image paste path.",
      },
    },
  },
};

(async () => {
  const file = path.join(__dirname, "../package.json");
  const pkg = JSON.parse(await fs.readFile(file, "utf-8"));
  pkg.contributes = contributes;
  await fs.writeFile(file, JSON.stringify(pkg, null, 2));
  console.log("✅ Package.json updated");
})().catch(console.error);

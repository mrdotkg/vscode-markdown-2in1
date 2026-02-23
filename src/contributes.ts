import { promises as fs } from "fs";
import { Features, ExtendedFeatures } from "./common/features";
import { Holder } from "./common/holder";
import path from "path";

const allFeatures = [...Features, ...ExtendedFeatures];
const prefix = (cmd: string) => `markpen.${cmd}`;
const mdActive = "activeCustomEditorId == 'markpen'";
const mdFile = "editorLangId == markdown || resourceExtname == '.md'";

// Map helper for menus
const mapMenu = (key: string, when: string, group?: string) =>
  Holder.menus[key]
    .split(" ")
    .filter(Boolean)
    .map((cmd) => ({ command: prefix(cmd), when, ...(group && { group }) }));
function isEquivalent(binding: string, evt: any): boolean {
  // naive parse: split modifiers and key
  const parts = binding.toLowerCase().split("+");
  return (
    !!evt.ctrlKey === parts.includes("ctrl") &&
    !!evt.altKey === parts.includes("alt") &&
    !!evt.shiftKey === parts.includes("shift") &&
    parts.includes(evt.key.toLowerCase())
  );
}

const contributes = {
  customEditors: [
    {
      viewType: "markpen",
      displayName: "Mark↓Pen",
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
    category: "Mark↓Pen",
  })),
  keybindings: allFeatures
    .filter((f: any) => f.keybinding)
    .map((f: any) => {
      const overlaps = f.keyEvent && isEquivalent(f.keybinding, f.keyEvent);
      return {
        command: prefix(f.command),
        key: f.keybinding,
        when: overlaps ? `${mdActive} && false` : `${mdActive} && true`,
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
    "webview/context": Features.map((f: any) => ({
      command: prefix(f.command),
      group: f.contextGroup || (f.contextKey ? "1_item_ops@1" : f.group),
      when: `activeCustomEditorId == 'markpen'${f.contextKey ? ` && ${f.contextKey} == ${f.vscWebviewContext}` : ""}`,
    })),
  },
  configuration: {
    title: "Mark↓Pen",
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

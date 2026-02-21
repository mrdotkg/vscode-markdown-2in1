import { promises as fs } from "fs";
import { Features, ExtendedFeatures } from "./common/features";
import { Holder } from "./common/holder";
import path from "path";

const allFeatures = [...Features, ...ExtendedFeatures];
const prefix = (cmd: string) => `markdown2in1.${cmd}`;
const mdActive = "markdown2in1.isMarkdownEditorActive";
const mdFile = "editorLangId == markdown || resourceExtname == '.md'";

const buildWebviewContextMenus = () => {
  const items = Features.map((f: any) => ({
    command: prefix(f.command),
    group: f.contextGroup || (f.contextKey ? "1_item_ops@1" : undefined),
    ...(f.contextKey && { when: `${f.contextKey} == ${f.vscWebviewContext}` }),
  }));
  return [
    ...items.filter((i) => i.when),
    ...items.filter((i) => !i.when && i.group),
  ];
};

// Map helper for menus
const mapMenu = (key: string, when: string, group?: string) =>
  Holder.menus[key]
    .split(" ")
    .filter(Boolean)
    .map((cmd) => ({ command: prefix(cmd), when, ...(group && { group }) }));

const contributes = {
  customEditors: [
    {
      viewType: "markdown2in1",
      displayName: "Markdown 2-in-1",
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
    category: "Markdown 2-in-1",
  })),
  keybindings: allFeatures
    .filter((f: any) => f.keybinding)
    .map((f: any) => ({
      command: prefix(f.command),
      key: f.keybinding,
      when: mdActive,
    })),
  menus: {
    commandPalette: mapMenu("commandPalette", mdActive),
    "editor/context": mapMenu("editor/context", mdFile, "1_modification@1"),
    "editor/title": mapMenu("editor/title", mdFile, "navigation@-2"),
    "editor/title/context": mapMenu(
      "editor/title/context",
      mdActive,
      "navigation@-2",
    ),
    "webview/context": buildWebviewContextMenus(),
  },
  configuration: {
    title: "Markdown 2-in-1",
    properties: {
      "markdown2in1.menus": {
        type: "object",
        default: Holder.menus,
        markdownDescription: "Customize menu... (options: h1, h2, etc.)",
      },
      "markdown2in1.openOutline": {
        type: "boolean",
        default: true,
        description: "Open markdown outline.",
      },
      "markdown2in1.hideToolbar": {
        type: "boolean",
        default: false,
        description: "Hide markdown toolbar.",
      },
      "markdown2in1.previewCode": {
        type: "boolean",
        default: true,
        description: "Preview code in markdown.",
      },
      "markdown2in1.previewCodeHighlight.showLineNumber": {
        type: "boolean",
        default: false,
        description: "Show line numbers.",
      },
      "markdown2in1.workspacePathAsImageBasePath": {
        type: "boolean",
        default: false,
        description: "Workspace as base path.",
      },
      "markdown2in1.pasterImgPath": {
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

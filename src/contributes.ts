import { promises as fs } from "fs";
import { Features } from "./common/features";
import { Addons } from "./common/addons";
import { Holder } from "./common/holder";
import path from "path";

const allFeatures = [...Features, ...Addons];
const prefix = (cmd: string) => `markpen.${cmd}`;
const editorIsActive = "activeCustomEditorId == 'markpen'";
const fileIsMarkdown = "editorLangId == markdown || resourceExtname == '.md'";
const CATEGORY_ORDER = ["Table", "Heading", "List", "Code", "Insert", "Format"];

// Group features by category for organized menu layout
function groupByCategory(): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  allFeatures.forEach((f: any) => {
    const cat = f.category ?? "Other";
    (groups[cat] ??= []).push(f);
  });
  return groups;
}

function buildCategoryGroup(category: string, itemIndex: number): string {
  const orderIndex = CATEGORY_ORDER.indexOf(category);
  if (orderIndex === -1) {
    return `${category.toLowerCase()}@${itemIndex}`;
  }
  return `${orderIndex}_${category.toLowerCase()}@${itemIndex}`;
}

function buildWhen(f: any): string {
  if (["Heading", "Table", "List", "Code"].includes(f.category)) {
    return `${editorIsActive} && section == '${f.category}'`;
  }

  return editorIsActive;
}

const mapMenu = (key: string, when: string, group?: string) =>
  Holder.menus[key]
    .split(" ")
    .filter(Boolean)
    .map((cmd) => ({ command: prefix(cmd), when, ...(group && { group }) }));

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
      return {
        command: prefix(f.command),
        key: f.keybinding,
        when: editorIsActive + ` && webviewFocus`,
      };
    }),
  menus: {
    commandPalette: mapMenu("commandPalette", editorIsActive),
    "editor/context": mapMenu(
      "editor/context",
      fileIsMarkdown,
      "1_modification@1",
    ),
    "editor/title": mapMenu("editor/title", fileIsMarkdown, "navigation@-2"),
    "editor/title/context": mapMenu(
      "editor/title/context",
      editorIsActive,
      "navigation@-2",
    ),
    // webview/context — flat category-grouped with visibility logic (like statusbar)
    "webview/context": (() => {
      const categoryGroups = groupByCategory();
      const orderedGroups = CATEGORY_ORDER.filter((cat) => categoryGroups[cat]);

      return orderedGroups.flatMap((category) =>
        categoryGroups[category].map((f: any, itemIndex: number) => ({
          command: prefix(f.command),
          when: buildWhen(f),
          group: buildCategoryGroup(category, itemIndex),
        })),
      );
    })(),
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

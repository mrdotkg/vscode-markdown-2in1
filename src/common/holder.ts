import { TextDocument, Webview } from "vscode";
import { Features } from "./features";

export enum ContextKind {
  Section = "webviewSection",
  Item = "webviewItemElement",
}

export class Holder {
  public static doc: TextDocument | null;
  public static webview: Webview | null;

  // Process features into rules and groups in one pass
  private static data = Features.reduce(
    (acc, f: any) => {
      if (f.selector && f.contextKey && f.vscWebviewContext) {
        acc.rules[f.selector] ??= { ...f, commands: [] };
        acc.rules[f.selector].commands.push(f.command);
      }
      (acc.groups[f.category || "Misc"] ??= []).push(f.command);
      return acc;
    },
    {
      rules: {} as Record<string, any>,
      groups: {} as Record<string, string[]>,
    },
  );

  public static contextRules = Object.values(this.data.rules);
  public static menuGroups = Object.entries(this.data.groups).map(
    ([name, commands]) => ({ name, commands }),
  );

  public static contexts = Object.fromEntries(
    this.contextRules.map((r: any) => [
      r.selector,
      `${r.contextKey} == ${r.vscWebviewContext}`,
    ]),
  );

  public static menus = {
    commandPalette: `toggle ${Features.map((f: any) => f.command).join(" ")}`,
    "editor/context": "toggle",
    "editor/title": "toggle undo",
    "editor/title/context": "toggle undo redo",
    statusBar:
      "Headings Lists bold italic strikethrough link inlinecode codeblock blockquote hr Tables",
  };

  public static exportContextRulesForWebview = () =>
    JSON.stringify(this.contextRules);
  public static getAllCommands = () => Features.map((f: any) => f.command);
}

// Minimal Compatibility Layer
export const ContextRegistry = {
  rules: Holder.contextRules,
  exportForWebview: Holder.exportContextRulesForWebview,
  getContexts: () => Holder.contexts,
  getAllCommands: Holder.getAllCommands,
};

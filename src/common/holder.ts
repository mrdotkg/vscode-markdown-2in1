import { TextDocument, Webview } from "vscode";
import { Features } from "./features";
import { Addons } from "./addons";

// These selectors are inline elements → use 'item' key
// Everything else is block → use 'section' key
const INLINE_SELECTORS = new Set(["strong", "em", "del", "code", "a", "input"]);
const isInline = (sel: string) => INLINE_SELECTORS.has(sel.split(/[\s,>]/)[0]);

export class Holder {
  static doc: TextDocument | null;
  static webview: Webview | null;
  static isCustomEditorActive: boolean = false;
  static lastSelection: string = "";

  // Derive context rules purely from selector + category
  // No contextKey / vscWebviewContext needed on Feature anymore
  static contextRules = (() => {
    const seen = new Set<string>();
    return Features.filter((f: any) => f.selector && f.category)
      .filter((f: any) => {
        if (seen.has(f.selector)) return false;
        seen.add(f.selector);
        return true;
      })
      .map((f: any) => ({
        selector: f.selector,
        category: f.category,
        contextKey: isInline(f.selector) ? "item" : "section",
      }));
  })();

  // Group Features by Category, default group Misc.
  static menuGroups: Record<string, string[]> = (() => {
    const groups: Record<string, string[]> = {};
    Features.forEach((f: any) => {
      (groups[f.category ?? "Misc"] ??= []).push(f.command);
    });
    return groups;
  })();

  static menus = {
    commandPalette: `toggle ${Features.map((f: any) => f.command).join(" ")} ${Addons.map((a: any) => a.command).join(" ")}`,
    "editor/context": "toggle",
    "editor/title": "toggle undo",
    "editor/title/context": "toggle undo redo",
    statusBar:
      "cycleHeading bold italic strikethrough link inlinecode unordered ordered checked blockquote",
  };

  static exportContextRulesForWebview = () =>
    JSON.stringify(this.contextRules);
  static getAllCommands = () => Features.map((f: any) => f.command);
}

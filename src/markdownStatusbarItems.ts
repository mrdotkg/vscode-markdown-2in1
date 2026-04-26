import * as vscode from "vscode";
import { Features } from "./common/features";
import { Addons } from "./common/addons";
import { Holder } from "./common/holder";

interface Ctx {
  section?: string;
  item?: string;
  hasSelection?: boolean;
}

export class StatusBar {
  private items = new Map<
    string,
    { item: vscode.StatusBarItem; when: (ctx: Ctx) => boolean }
  >();
  private wc: vscode.StatusBarItem;
  private active = false;
  private ctx: Ctx = {};

  constructor() {
    const all = [...Addons, ...Features] as any[];
    const findF = (cmd: string) =>
      Features.find((f) => f.command === cmd) ||
      Addons.find((a) => a.command === cmd);
    const cap = (k: string) => k.trim().replace(/^./, (c) => c.toUpperCase());

    const formatTooltip = (
      cmds: string[],
      sep = true,
    ): vscode.MarkdownString => {
      const rows = cmds.map((c) => {
        const f = findF(c);
        const kb =
          f?.keybinding
            ?.split("+")
            .map((k) => `\`${cap(k)}\``)
            .join(" + ") || "";
        const title = `\`${f?.icon || ""}\` ${f?.title || c}`;
        return `[${title} ${kb ? ` ${kb}` : ""}](command:markpen.${c})`;
      });
      const md = new vscode.MarkdownString(
        rows.join(sep ? "\n\n---\n\n" : "\n"),
      );
      md.isTrusted = true;
      md.supportThemeIcons = true;
      return md;
    };

    const moreItems = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      2,
    );
    moreItems.text = "$(triangle-down)MarkPen";

    // Get insert commands dynamically from category "Insert"
    const insertCmds = all.filter((f: any) => f.category === "Insert").map((f: any) => f.command);
    
    const insertItems = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      501,
    );
    insertItems.text = "$(plus) Insert $(triangle-down)";
    insertItems.tooltip = formatTooltip(insertCmds);

    let p = 500;
    const moreItemsList: any[] = [];

    // Get Format category items for status bar
    const formatCmds = all.filter((f: any) => f.category === "Format").map((f: any) => f.command);

    for (const f of all) {
      // Add to status bar if in Format category
      if (formatCmds.includes(f.command)) {
        const item = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Left,
          p--,
        );
        item.command = `markpen.${f.command}`;
        item.text = f.icon;
        item.tooltip = formatTooltip([f.command], false);
        this.items.set(f.command, { item, when: () => true });
      } else if (!insertCmds.includes(f.command) && !["Heading", "List", "Table"].includes(f.category)) {
        // Everything else (except Insert, Heading, List, Table) goes to More
        moreItemsList.push(f);
      }
    }

    if (moreItemsList.length) {
      moreItems.tooltip = formatTooltip(moreItemsList.map((f) => f.command));
    }

    // Add Insert and More buttons to the items map for proper management
    this.items.set("insert-button", { item: insertItems, when: () => true });
    if (moreItemsList.length) {
      this.items.set("more-button", { item: moreItems, when: () => true });
    }

    ["Heading", "List", "Table"].forEach((cat, i) => {
      const item = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        490 - i,
      );
      const feats = Features.filter((f: any) => f.category === cat);
      item.text =
        cat === "Heading"
          ? "$(symbol-number) Heading $(triangle-down)"
          : cat === "List"
            ? "$(list-unordered) List $(triangle-down)"
            : "$(table) Table $(triangle-down)";
      item.tooltip = formatTooltip(feats.map((f) => f.command));
      const when =
        cat === "List"
          ? (ctx: Ctx) => ["List", "Format"].includes(ctx.section || "")
          : (ctx: Ctx) => ctx.section === cat;
      this.items.set(`category-${cat}`, { item, when });
    });

    this.wc = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      1,
    );
    this.wc.tooltip = "Word count";
  }

  update(active?: boolean, ctx?: Ctx) {
    if (active !== undefined) this.active = active;
    if (ctx !== undefined) this.ctx = ctx;
    if (active === false) this.ctx = {};
    this._wc();
    this._render();
  }

  dispose() {
    this.items.forEach(({ item }) => item.dispose());
    this.items.clear();
    this.wc.dispose();
  }

  private _render() {
    if (!this.active) {
      this.items.forEach(({ item }) => item.hide());
      this.wc.hide();
      return;
    }
    this.wc.show();
    this.items.forEach(({ item, when }) =>
      when(this.ctx) ? item.show() : item.hide(),
    );
  }

  private _wc() {
    const text = Holder.doc?.getText() ?? "";
    const plain = text
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`[^`]*`/g, " ")
      .replace(/!\[.*?\]\(.*?\)/g, " ")
      .replace(/\[.*?\]\(.*?\)/g, " ")
      .replace(/#{1,6}\s/g, " ")
      .replace(/[*_~`>|]/g, " ");
    const words = plain
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    const mins = Math.ceil(words / 200);
    this.wc.text = `${words} words`;
    this.wc.tooltip = `${words} words · ${mins < 1 ? "<1 min" : `~${mins} min`} read`;
  }
}

import * as vscode from "vscode";
import { Features } from "./common/features";
import { Holder } from "./common/holder";

export class StatusBar {
  private items = new Map<string, vscode.StatusBarItem>();

  constructor() {
    let p = 100;
    const findF = (cmd: string) => Features.find((f) => f.command === cmd);

    const getTooltip = (cmds: string[]) => {
      const rows = cmds.map((c) => {
        const f = findF(c);
        const kb =
          f?.keybinding
            ?.split("+")
            .map((k) => `\`${k.trim()}\``)
            .join(" + ") || "";
        return `| [\`${f?.icon || ""}\` ${f?.title || c}](command:markpen.${c}) | ${kb} |`;
      });
      const md = new vscode.MarkdownString(
        `| | |\n|--|--|\n${rows.join("\n")}`,
      );
      return Object.assign(md, { isTrusted: true, supportThemeIcons: true });
    };

    Holder.menus.statusBar.split(" ").forEach((name) => {
      const item = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        p--,
      );
      const f = findF(name);

      // AFTER (Record lookup — simpler)
      const groupCmds = Holder.menuGroups[name]; // string[] | undefined
      item.text = groupCmds ? `${name} $(triangle-down)` : f?.icon || "";
      item.command = `markpen.${groupCmds ? groupCmds[0] : name}`;
      item.tooltip = getTooltip(groupCmds ?? [name]);

      this.items.set(name, item);
    });

    const wc = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      p,
    );
    wc.tooltip = "Word Count";
    this.items.set("wc", wc);
    this.update();
  }

  update = () => {
    const text = Holder.doc?.getText() || "";

    // Markdown syntax strip करो before counting
    const plain = text
      .replace(/```[\s\S]*?```/g, " ") // code blocks
      .replace(/`[^`]*`/g, " ") // inline code
      .replace(/!\[.*?\]\(.*?\)/g, " ") // images
      .replace(/\[.*?\]\(.*?\)/g, " ") // links
      .replace(/#{1,6}\s/g, " ") // headings
      .replace(/[*_~`>|]/g, " "); // special chars

    const words = plain
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
    const mins = Math.ceil(words / 200); // average reading speed: 200 wpm
    const timeStr = mins < 1 ? "<1 min" : `~${mins} min`;

    this.items.get("wc")!.text = `$(book) ${words} words`;
    this.items.get("wc")!.tooltip = `${words} words · Reading time: ${timeStr}`;
  };
  show = () => this.items.forEach((i) => i.show());
  hide = () => this.items.forEach((i) => i.hide());
  dispose = () => {
    this.items.forEach((i) => i.dispose());
    this.items.clear();
  };
}

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
      const group = Holder.menuGroups.find((g) => g.name === name);
      const f = findF(name);

      item.text = group ? `${name} $(triangle-down)` : f?.icon || "";
      item.command = `markpen.${group ? group.commands[0] : name}`;
      item.tooltip = getTooltip(group ? group.commands : [name]);
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

  update = () =>
    (this.items.get("wc")!.text = `${Holder.doc?.getText().length || 0} W`);
  show = () => this.items.forEach((i) => i.show());
  hide = () => this.items.forEach((i) => i.hide());
  dispose = () => {
    this.items.forEach((i) => i.dispose());
    this.items.clear();
  };
}

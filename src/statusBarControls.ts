import * as vscode from "vscode";
import { Hotkeys } from "./common/hotkeys";
import { MarkdownService } from "./editorServices";

export class Toolbar {
  private countStatus: vscode.StatusBarItem;
  private buttons: Map<string, vscode.StatusBarItem> = new Map();

  constructor() {
    this.countStatus = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );

    this.createDynamicButtons();
    this.setupButtons();
  }

  private createDynamicButtons() {
    let priority = 1020;
    
    Hotkeys.forEach((config, index) => {
      const button = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left, 
        priority--
      );
      this.buttons.set(config.command, button);
    });
  }

  private setupButtons() {
    Hotkeys.forEach((config) => {
      const button = this.buttons.get(config.command);
      if (!button || !config) return;

      // Set button text from config or use icon
      button.text = config.text || config.icon || config.title;
      
      // Set tooltip
      button.tooltip = config.title;
      
      // Set command
      button.command = config.command;
    });
  }

  updateCount(content: string) {
    this.countStatus.text = `${content.length} Words`;
  }

  show() {
    this.countStatus.show();
    this.buttons.forEach(button => button.show());
  }

  hide() {
    this.countStatus.hide();
    this.buttons.forEach(button => button.hide());
  }

  dispose() {
    this.countStatus.dispose();
    this.buttons.forEach(button => button.dispose());
    this.buttons.clear();
  }
}

import * as vscode from "vscode";
import { Features } from "./common/features";
import { Output } from "./common/utility";

export class CommandsPalette {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public async registerCommands(): Promise<void> {
    const existingCommands = new Set<string>(
      await vscode.commands.getCommands(true)
    );
    const { Util } = require("./common/utility");
    Output.log("🔧 Registering Commands Palette features...");
    for (const feature of Features) {
      Output.log(`➡️ Processing feature: ${feature.id} - ${feature.title}`);
      const isEnabled = vscode.workspace
        .getConfiguration("vsc-markdown")
        .get(`features.${feature.id}.enabled`, feature.enabledByDefault);

      // if (!isEnabled) continue;
      // if (existingCommands.has(feature.command)) continue;
      const disposable = vscode.commands.registerCommand(feature.command, async () => {
        Output.log(`⚙️ Executing feature: ${feature.id} - ${feature.title}`);
        if (feature.keyEvent) {
          Util.format(feature.title, feature.keyEvent);
        }
      });
      this.context.subscriptions.push(disposable);
    }
  }
}

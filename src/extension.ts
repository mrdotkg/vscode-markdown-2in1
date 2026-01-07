import * as vscode from "vscode";
import { Editor } from "./editor";
import { CommandsPalette } from "./commandsPalette";

export async function activate(context: vscode.ExtensionContext) {
  //1. Resolve a custom text editor for markdown files
  const customEditor = new Editor(context);

  //2. Register this custom text editor
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider("vsc-markdown", customEditor, {
      webviewOptions: {
        retainContextWhenHidden: true,
        enableFindWidget: true,
      },
    })
  );

  //3. Use default text editor for git previews of markdown files
  const config = vscode.workspace.getConfiguration("workbench");
  const configKey = "editorAssociations";
  const settings = config.get(configKey);
  ["git:/**/*.md", "gitlens:/**/*.md", "git-graph:/**/*.md"].forEach(
    (association) => (settings[association] = "default")
  );
  config.update(configKey, settings, true);

  //4. Expose other custom vscode components
  //4.1 Menu Editor/title
  //4.2 Menu Editor/context
  //4.3 Command Palette
  new CommandsPalette(context).registerCommands();

  //4.4 Keyboard Shortcuts
  //4.5 Status Bar Controls
  //4.6 Settings, Default Settings
  //4.7 Custom Editor Context Menu
}

export function deactivate() {}

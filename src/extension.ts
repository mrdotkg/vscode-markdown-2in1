import { commands, window, workspace, ExtensionContext } from "vscode";
import { MarkdownCustomEditor } from "./markdownCustomEditor";
import { MarkdownEditorService as MD } from "./markdownEditorServices";
import { Features, ExtendedFeatures } from "./common/features";
import { Holder } from "./common/holder";

const prefix = "markdown2in1";
const activeCtx = `${prefix}.isMarkdownEditorActive`;

export function activate(context: ExtensionContext) {
  // Batch update git editor associations
  const config = workspace.getConfiguration("workbench");
  const associations = { ...config.get("editorAssociations", {}) };
  ["git", "gitlens", "git-graph"].forEach(
    (s) => (associations[`${s}:/**/*.md`] = "default"),
  );
      // Search/Find results ke liye bhi same
    // VS Code search results is scheme se open karta hai
    associations[`search-editor:/**/*.md`] = "default";
  config.update("editorAssociations", associations, true);

  const reg = (id: string, handler: (...args: any[]) => any) =>
    commands.registerCommand(`${prefix}.${id}`, handler);

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((e) => {
      if (e?.document.languageId !== "markdown") {
        Holder.webview = null;
        commands.executeCommand("setContext", activeCtx, false);
      }
    }),
    ...Features.map((f) => reg(f.command, () => MD.builtin(f.keyEvent))),
    ...ExtendedFeatures.map((f) => reg(f.command, MD.toggle)),
    reg("noop", () => {}),
    window.registerCustomEditorProvider(
      prefix,
      new MarkdownCustomEditor(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
          enableFindWidget: true,
        },
      },
    ),
  );
}

export function deactivate() {
  commands.executeCommand(
    "setContext",
    `${prefix}.isMarkdownEditorActive`,
    false,
  );
}

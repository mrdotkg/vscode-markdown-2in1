import { commands, window, workspace, ExtensionContext } from "vscode";
import { MarkdownCustomEditor } from "./markdownCustomEditor";
import { MarkdownEditorService as MD } from "./markdownEditorServices";
import { Features, ExtendedFeatures } from "./common/features";
import { Holder } from "./common/holder";

const customEditorId = "markdown2in1";

export function activate(context: ExtensionContext) {
  // Batch update git editor associations
  const config = workspace.getConfiguration("workbench");
  const associations = { ...config.get("editorAssociations", {}) };
  ["git", "gitlens", "git-graph"].forEach(
    (s) => (associations[`${s}:/**/*.md`] = "default"),
  );
  associations[`search-editor:/**/*.md`] = "default";
  config.update("editorAssociations", associations, true);

  const reg = (id: string, handler: (...args: any[]) => any) =>
    commands.registerCommand(`${customEditorId}.${id}`, handler);
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((e) => {
      if (e?.document.languageId !== "markdown") {
        Holder.webview = null;
      }
    }),
    ...Features.map((f) => reg(f.command, () => MD.builtin(f.keyEvent))),
    ...ExtendedFeatures.map((f) => reg(f.command, MD.toggle)),
    reg("noop", () => {}),
    window.registerCustomEditorProvider(
      customEditorId,
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

}

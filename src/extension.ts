import {
  commands,
  window,
  workspace,
  ExtensionContext,
  Uri,
  languages,
} from "vscode";
import { MarkdownCustomEditor } from "./markdownCustomEditor";
import { MarkdownEditorService as MD } from "./markdownEditorServices";
import { Features } from "./common/features";
import { Holder } from "./common/holder";

const eId = "markpen";
const { registerCommand } = commands;

export function activate(context: ExtensionContext) {
  const config = workspace.getConfiguration("workbench");
  const associations = { ...config.get("editorAssociations", {}) };
  ["git", "gitlens", "git-graph"].forEach(
    (s) => (associations[`${s}:/**/*.md`] = "default"),
  );
  associations[`search-editor:/**/*.md`] = "default";
  config.update("editorAssociations", associations, true);

  const dir = context.extensionPath;

  // Global configuration listener - broadcast to all open webviews
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration("markdown.preview.fontSize") ||

        e.affectsConfiguration("markdown.preview.fontFamily") ||
        e.affectsConfiguration("window.zoomLevel") ||
        e.affectsConfiguration("editor.mouseWheelZoom")
      ) {
        const mdPrev = workspace.getConfiguration("markdown.preview");
        const ed = workspace.getConfiguration("editor");
        const win = workspace.getConfiguration("window");
        const config = {
          fontSize: mdPrev.get<number>("fontSize") || 15,
          fontFamily: mdPrev.get<string>("fontFamily"),
          zoomLevel: win.get<number>("zoomLevel") || 0,
          mouseWheelZoom: ed.get<boolean>("mouseWheelZoom") || false,
        };
        console.log("[markpen] Broadcasting updateMdConfig:", config);
        MarkdownCustomEditor.broadcastToWebviews("updateMdConfig", config);
      }
    }),
  );

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((e) => {
      if (e?.document.languageId !== "markdown") Holder.webview = null;
    }),
    window.registerCustomEditorProvider(
      eId,
      new MarkdownCustomEditor(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
          enableFindWidget: true,
        },
      },
    ),
    registerCommand(`${eId}.toggle`, (uri?: Uri) => MD.toggle(uri)),
    registerCommand(`${eId}.cycleHeading`, () => MD.cycleHeading()),
    registerCommand(`${eId}.pasteimage`, () => MD.pasteimage(dir)),
    // registerCommand(`${eId}.cut`, () => MD.cut()),
    // registerCommand(`${eId}.paste`, () => MD.paste()),
    registerCommand(`${eId}.replaceInFiles`, async () => {
      const uri = Holder.doc?.uri;
      if (uri) {
        await commands.executeCommand("workbench.action.findInFiles", {
          filesToInclude: uri.fsPath,
          query: Holder.lastSelection,
          replace: "", // replace mode open karta hai
          triggerSearch: true,
        });
      }
    }),
    registerCommand(`${eId}.openKeyboardShortcuts`, async () => {
      try {
        await commands.executeCommand(
          "workbench.action.openGlobalKeybindings",
          "@ext:butterops.markpen",
        );
      } catch (e) {
        console.error("Keybindings error:", e);
      }
    }),
    ...Features.map((f) =>
      registerCommand(`${eId}.${f.command}`, () =>
        MD.vditorCommand(f.hotkey),
      ),
    ),
  );
}

export function deactivate() {}

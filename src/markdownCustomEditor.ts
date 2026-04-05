import {
  CustomTextEditorProvider,
  Webview,
  ExtensionContext,
  TextDocument,
  WebviewPanel,
  Uri,
  commands,
  workspace,
  WorkspaceEdit,
  Range,
  window,
  ColorThemeKind,
  env,
} from "vscode";
import { readFileSync } from "fs";
import { basename } from "path";
import { Handler } from "./common/handler";
import { StatusBar } from "./markdownStatusbarItems";
import { Holder } from "./common/holder";

export class MarkdownCustomEditor implements CustomTextEditorProvider {
  constructor(private context: ExtensionContext) {}
  private static statusBar?: StatusBar;
  private static openEditors = new Set<string>(); // Track open editor URIs
  private webview!: Webview;
  private content!: string;
  private getFolders = () =>
    Array.from({ length: 26 }, (_, i) =>
      Uri.file(`${String.fromCharCode(65 + i)}:/`),
    );
  private postToWebview = (type: string, value: any) =>
    this.webview.postMessage({ type, value });
  private updateTextDocument = (doc: TextDocument, content: string) => {
    const edit = new WorkspaceEdit();
    edit.replace(doc.uri, new Range(0, 0, doc.lineCount, 0), content);
    return workspace.applyEdit(edit);
  };
  private setupEditorEvents(
    doc: TextDocument,
    handler: any,
    toggleUI: Function,
    rootPath: string, // ← add this
  ) {
    let lastSave = 0;
    const scrollKey = `scrollTop_${doc.uri.fsPath}`;
    const cursorKey = `cursor_${doc.uri.fsPath}`;

    handler.panel.onDidChangeViewState((e: any) =>
      toggleUI(e.webviewPanel.active),
    );

    window.onDidChangeActiveColorTheme((e) =>
      this.postToWebview(
        "updateActiveColorThemeKind",
        e.kind === ColorThemeKind.Dark ? "dark" : "light",
      ),
    );

    handler
      .on("init", () => {
        if (!MarkdownCustomEditor.statusBar) {
          MarkdownCustomEditor.statusBar = new StatusBar();
        }
        handler.emit("open", {
          title: basename(doc.uri.fsPath),
          rootPath, // ← add this

          config: workspace.getConfiguration("markpen"),
          scrollTop: this.context.workspaceState.get(scrollKey, 0),
          cursor: this.context.workspaceState.get(cursorKey, null),
          language: env.language,
          content: this.content,
        });
        MarkdownCustomEditor.statusBar?.update();
        MarkdownCustomEditor.statusBar?.show();
      })
      .on("externalUpdate", (e: any) => {
        const text = e.document.getText()?.replace(/\r/g, "");
        if (Date.now() - lastSave < 800 || this.content === text) return;
        this.content = text;
        MarkdownCustomEditor.statusBar?.update();
        handler.emit("update", text);
      })
      .on("command", (cmd: string) => commands.executeCommand(cmd))
      .on("openLink", (u: string) => {
        const target = Uri.parse(u.replace(/https:\/\/file.*\.net/i, ""));
        u.includes("file")
          ? commands.executeCommand("vscode.open", target)
          : env.openExternal(target);
      })
      .on("scroll", ({ scrollTop }: any) =>
        this.context.workspaceState.update(scrollKey, scrollTop),
      )
      .on("cursor", (pos) => {
        this.context.workspaceState.update(cursorKey, pos);
      })
      .on("selectionChange", (text) => {
        Holder.lastSelection = text ?? "";
      })
      .on("save", (newVal: string) => {
        lastSave = Date.now();
        this.content = newVal;
        MarkdownCustomEditor.statusBar?.update();
        this.updateTextDocument(doc, newVal);
        doc.save(); // ← VSCode ko batao "ye already save hai"
      });
  }

  resolveCustomTextEditor(doc: TextDocument, panel: WebviewPanel) {
    const uriStr = (u: Uri) => panel.webview.asWebviewUri(u).toString();
    const extPath = this.context.extensionPath;
    this.webview = Object.assign(panel.webview, {
      options: {
        enableScripts: true,
        localResourceRoots: [Uri.file("/"), ...this.getFolders()],
      },
      html: readFileSync(`${extPath}/editor.html`, "utf8")
        .replace("{{rootPath}}", uriStr(Uri.file(extPath)))
        .replace(
          "{{baseUrl}}",
          uriStr(Uri.joinPath(doc.uri, ".."))
            .replace(/\?.+$/, "")
            .replace("https://git", "https://file"),
        )
        .replace(
          "{{configs}}",
          JSON.stringify({
            platform: process.platform,
            scrollBeyondLastLine: workspace
              .getConfiguration("editor")
              .get("scrollBeyondLastLine"),
            contextRules: Holder.contextRules,
          }),
        )
        .replace(/((src|href)=("|')?)(\/\/)/gi, "$1http://")
        .replace(
          /((src|href)=("|'))((?!(http|#)).+?["'])/gi,
          `$1${uriStr(Uri.file(extPath))}/$4`,
        ),
    });

    this.content = doc.getText();
    Holder.doc = doc;
    Holder.webview = this.webview;

    const toggleUI = (active: boolean) => {
      Holder.isCustomEditorActive = active;
      if (active) {
        if (!MarkdownCustomEditor.statusBar) {
          MarkdownCustomEditor.statusBar = new StatusBar();
        }
        // Set doc and webview FIRST before updating status bar
        Holder.doc = doc;
        Holder.webview = this.webview;
        MarkdownCustomEditor.statusBar?.update();
        MarkdownCustomEditor.statusBar?.show();
      } else {
        MarkdownCustomEditor.statusBar?.hide();
      }
    };

    toggleUI(panel.active);
    
    // Track this editor
    const docUri = doc.uri.toString();
    MarkdownCustomEditor.openEditors.add(docUri);
    
    // Listen for panel close to hide statusbar if no more markdown editors are active
    panel.onDidDispose(() => {
      MarkdownCustomEditor.openEditors.delete(docUri);
      if (MarkdownCustomEditor.openEditors.size === 0) {
        MarkdownCustomEditor.statusBar?.hide();
      }
    });
    
    // still in resolveCustomTextEditor, already has uriStr and extPath in scope
    this.setupEditorEvents(
      doc,
      Handler.bind(panel, doc.uri),
      toggleUI,
      uriStr(Uri.file(extPath)), // ← pass rootPath here
    );
    workspace.onDidChangeConfiguration(
      (e) =>
        e.affectsConfiguration("editor.scrollBeyondLastLine") &&
        this.postToWebview(
          "updateScrollBeyondLastLine",
          workspace.getConfiguration("editor").get("scrollBeyondLastLine"),
        ),
    );
  }
}

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
  private statusBar = new StatusBar();
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
  ) {
    let lastSave = 0;
    const scrollKey = `scrollTop_${doc.uri.fsPath}`;

    handler.panel.onDidChangeViewState((e: any) =>
      toggleUI(e.webviewPanel.active),
    );
    handler.panel.onDidDispose(() => {
      this.statusBar.hide();
    });

    window.onDidChangeActiveColorTheme((e) =>
      this.postToWebview(
        "updateActiveColorThemeKind",
        e.kind === ColorThemeKind.Dark ? "dark" : "light",
      ),
    );

    handler
      .on("init", () => {
        handler.emit("open", {
          title: basename(doc.uri.fsPath),
          config: workspace.getConfiguration("markpen"),
          scrollTop: this.context.workspaceState.get(scrollKey, 0),
          language: env.language,
          content: this.content,
        });
        this.statusBar.update();
      })
      .on("externalUpdate", (e: any) => {
        const text = e.document.getText()?.replace(/\r/g, "");
        if (Date.now() - lastSave < 800 || this.content === text) return;
        this.content = text;
        this.statusBar.update();
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
      .on("save", (newVal: string) => {
        lastSave = Date.now();
        this.content = newVal;
        this.statusBar.update();
        this.updateTextDocument(doc, newVal);
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
      active
        ? (this.statusBar.update(), this.statusBar.show())
        : this.statusBar.hide();
      if (active) {
        Holder.doc = doc;
        Holder.webview = this.webview;
      }
    };

    toggleUI(panel.active);
    this.setupEditorEvents(doc, Handler.bind(panel, doc.uri), toggleUI);

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

import * as vscode from "vscode";
import { WebviewHandler } from "./common/utility";
import { StatusBarControls } from "./statusBar";
import { Holder } from "./common/utility";
import { ContextMenu } from "./webviewContextMenu";
import { CommandsPalette } from "./commandsPalette";
import { KeyboardShortcuts } from "./keyboardShortcuts";

export class Editor implements vscode.CustomTextEditorProvider {
  private statusBarControls: StatusBarControls;
  private commandsPalette: CommandsPalette;
  private keyboardShortcuts: KeyboardShortcuts;
  private document: vscode.TextDocument;
  private handler: any;
  private webview: vscode.Webview;
  private content: string;
  private rootPath: string;
  private contextPath: string;

  constructor(private context: vscode.ExtensionContext) {
    this.contextPath = `${this.context.extensionPath}`;

    this.statusBarControls = new StatusBarControls(context);
    this.commandsPalette = new CommandsPalette(context);
    this.keyboardShortcuts = new KeyboardShortcuts(context);
    // this.commandsPalette.registerCommands();
    this.keyboardShortcuts.registerShortcuts();

    // Switch Editor Command
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        "vsc-markdown.switchEditor",
        (uri?: vscode.Uri) => {
          this.switchEditor(uri);
        }
      )
    );

    // Track active text editor changes
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        const isMarkdown = editor?.document.languageId === "markdown";
        if (!isMarkdown) Holder.activeWebview = null;
      })
    );
  }

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): void | Thenable<void> {
    function getFolders(): vscode.Uri[] {
      const data = [];
      for (let i = 65; i <= 90; i++) {
        data.push(vscode.Uri.file(`${String.fromCharCode(i)}:/`));
      }
      return data;
    }

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file("/"), ...getFolders()],
    };

    // Initialize class properties
    this.document = document;
    this.handler = WebviewHandler.bind(webviewPanel, document.uri);
    this.webview = this.handler.panel.webview;
    this.content = document.getText();
    this.webview.html = this.renderHtmlTemplate(
      this.webview
        .asWebviewUri(vscode.Uri.file(this.contextPath))
        .toString(),
      {
        platform: process.platform,
        scrollBeyondLastLine: vscode.workspace
          .getConfiguration("editor")
          .get("scrollBeyondLastLine"),
        contextMenuGroups: ContextMenu.getInstance().getGroupedMenuItems(),
      }
    );

    this.rootPath = this.webview
      .asWebviewUri(vscode.Uri.file(`${this.contextPath}`))
      .toString();
    this.setupEditorState();
    this.setupEditorEvents();
  }

  private renderHtmlTemplate(rp, c) {
    const { Util } = require("./common/utility");
    return Util.buildPath(
      require("fs")
        .readFileSync(`${this.contextPath}/editor.html`, "utf8")
        .replace("{{rootPath}}", rp)
        .replace(`{{configs}}`, JSON.stringify(c)),
      this.webview,
      this.contextPath
    );
  }

  private setupEditorState() {
    Holder.activeDocument = this.document;
    Holder.activeWebview  = this.webview;
    const updateWebviewConfig = () => {
      const scrollBeyondLastLine = vscode.workspace
        .getConfiguration("editor")
        .get<boolean>("scrollBeyondLastLine");
      Holder.activeWebview.postMessage({type: "updateScrollBeyondLastLine", content: scrollBeyondLastLine});
    };
    updateWebviewConfig();
    this.handler.panel.onDidChangeViewState((e: any) => {
      Holder.activeDocument = e.webviewPanel.visible
        ? this.document
        : Holder.activeDocument;
      if (e.webviewPanel.visible) {
        this.statusBarControls.updateCount(this.content);
        this.statusBarControls.show();
       Holder.activeWebview  = this.webview;
      } else {
        this.statusBarControls.hide();
        Holder.activeWebview = null;
      }
    });
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("editor.scrollBeyondLastLine")) {
        updateWebviewConfig();
      }
    });
    vscode.window.onDidChangeActiveColorTheme((e) => {
      const themeValue =
        e.kind === vscode.ColorThemeKind.Dark ? "dark" : "light";
      Holder.activeWebview.postMessage({type: "updateActiveColorThemeKind", content: themeValue});
    });
  }

  private setupEditorEvents() {
    let lastManualSaveTime: number;
    const self = this;
    const config = vscode.workspace.getConfiguration("vsc-markdown");

    function isRecentManualSave(lastManualSaveTime: number): boolean {
      return lastManualSaveTime && Date.now() - lastManualSaveTime < 800;
    }
    function updateToolbarAndContent(content: string) {
      self.content = content;
      self.statusBarControls.updateCount(content);
    }
    function updateTextDocument(document: vscode.TextDocument, content: any) {
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        document.uri,
        new vscode.Range(0, 0, document.lineCount, 0),
        content
      );
      return vscode.workspace.applyEdit(edit);
    }

    this.handler
      .on("init", () => {
        const scrollTop = this.context.workspaceState.get(
          `scrollTop_${this.document.uri.fsPath}`,
          0
        );
        this.handler.emit("open", {
          title: require("path").basename(this.document.uri.fsPath),
          config,
          scrollTop,
          language: vscode.env.language,
          rootPath: this.rootPath,
          content: this.content,
        });
        updateToolbarAndContent(this.content);
        this.statusBarControls.show();
      })
      .on("externalUpdate", (e: any) => {
        if (isRecentManualSave(lastManualSaveTime)) return;
        const updatedText = e.document.getText()?.replace(/\r/g, "");
        if (this.content == updatedText) return;
        updateToolbarAndContent(updatedText);
        this.handler.emit("update", updatedText);
      })
      .on("command", (command: string) => {
        vscode.commands.executeCommand(command);
      })
      .on("openLink", (uri: string) => {
        const resReg = /https:\/\/file.*\.net/i;
        if (uri.match(resReg)) {
          const localPath = uri.replace(resReg, "");
          vscode.commands.executeCommand(
            "vscode.open",
            vscode.Uri.parse(localPath)
          );
        } else {
          vscode.env.openExternal(vscode.Uri.parse(uri));
        }
      })
      .on("scroll", ({ scrollTop }: { scrollTop: number }) => {
        setTimeout(() => {
          this.context.workspaceState.update(
            `scrollTop_${this.document.uri.fsPath}`,
            scrollTop
          );
        }, 150);
      })
      .on("save", (newContent: string) => {
        if (isRecentManualSave(lastManualSaveTime)) return;
        updateToolbarAndContent(newContent);
        updateTextDocument(this.document, newContent);
      });
  }

  public switchEditor(uri: vscode.Uri) {
    const editor = vscode.window.activeTextEditor;
    if (!uri) uri = editor?.document.uri;
    const type = editor ? "vsc-markdown" : "default";
    vscode.commands.executeCommand("vscode.openWith", uri, type);
  }
  public static format(type, shortcut) {
    if (!Holder.activeWebview) return false;
    Holder.activeWebview.postMessage({
      type: "vditorCommand",
      content: {
        type,
        shortcut,
      },
    });
  }
}

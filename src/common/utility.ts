"user strict";
import { EventEmitter } from "events";
import { existsSync } from "fs";
import * as vscode from "vscode";
import {
  OutputChannel,
  ExtensionContext,
  TextDocument,
  workspace,
  WebviewPanel,
  Uri,
  window,
} from "vscode";

const prefix = "MDIR";

export class WebviewHandler {
  constructor(public panel: WebviewPanel, private eventEmitter: EventEmitter) {}

  on(event: string, callback: (content: any) => any | Promise<any>): this {
    if (event != "init") {
      const listens = this.eventEmitter.listeners(event);
      if (listens.length >= 1) {
        this.eventEmitter.removeListener(event, listens[0] as any);
      }
    }
    this.eventEmitter.on(event, async (content: any) => {
      try {
        await callback(content);
      } catch (error) {
        Output.debug(error);
        window.showErrorMessage(error.message);
      }
    });
    return this;
  }

  emit(event: string, content?: any) {
    this.panel.webview.postMessage({ type: event, content });
    return this;
  }

  public static bind(panel: WebviewPanel, uri: Uri): WebviewHandler {
    const eventEmitter = new EventEmitter();

    const fileWatcher = workspace.createFileSystemWatcher(uri.fsPath);
    fileWatcher.onDidChange((e) => {
      eventEmitter.emit("fileChange", e);
    });

    const changeDocumentSubscription = workspace.onDidChangeTextDocument(
      (e) => {
        if (
          e.document.uri.toString() === uri.toString() &&
          e.contentChanges.length > 0
        ) {
          eventEmitter.emit("externalUpdate", e);
        }
      }
    );
    panel.onDidDispose(() => {
      fileWatcher.dispose();
      changeDocumentSubscription.dispose();
      eventEmitter.emit("dispose");
    });

    // bind from webview
    panel.webview.onDidReceiveMessage((message) => {
      eventEmitter.emit(message.type, message.content);
    });
    return new WebviewHandler(panel, eventEmitter);
  }
}

export class Holder {
  public static activeDocument: TextDocument | null;
  public static activeWebview: vscode.Webview | null = null;
}

export class Output {
  public static debug(value: any) {
    this.log(value, false);
  }

  public static log(value: any, showLog = true) {
    if (this.outputChannel == null) {
      this.outputChannel = window.createOutputChannel("vsc-markdown");
    }
    if (showLog) this.outputChannel.show(true);
    this.outputChannel.appendLine(`${value}`);
    this.outputChannel.appendLine(
      "-----------------------------------------------------------------------------------------"
    );
  }

  private static outputChannel: OutputChannel;
}

export class FileUtil {
  private static context: ExtensionContext;
  public static init(context: ExtensionContext) {
    this.context = context;
  }
  public static getLastPath(key: string | string[], path = "") {
    // 获取已经保存的路径
    let basePath: string;
    if (!Array.isArray(key)) {
      key = [key];
    }
    for (const itemKey of key) {
      basePath = this.context.globalState.get(itemKey + "SelectorPath");
      if (basePath) break;
    }
    if (basePath && !existsSync(basePath)) {
      basePath = workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";
    } else {
      basePath = "";
    }
    return Uri.file(basePath + path);
  }
}

export class Global {
  public static getConfig<T>(key: string, defaultValue?: T): T {
    const config = workspace.getConfiguration(prefix);
    return config.get<T>(key, defaultValue);
  }

  public static async updateConfig(name: string, value: any) {
    const config = workspace.getConfiguration(prefix);
    const meta = config.inspect(name);
    const newValue = meta?.defaultValue == value ? undefined : value;
    await config.update(name, newValue, true);
  }
}

export class Util {
  public static buildPath(
    data: string,
    webview: vscode.Webview,
    contextPath: string
  ): string {
    return data.replace(/((src|href)=("|')?)(\/\/)/gi, "$1http://").replace(
      /((src|href)=("|'))((?!(http|#)).+?["'])/gi,
      "$1" +
        webview.asWebviewUri(
          // Convert local file path to a special URI
          vscode.Uri.file(`${contextPath}`) // Base path inside the extension
        ) +
        "/$4" // Append the original relative path
    );
  }
  public static listen(
    webviewPanel: vscode.WebviewPanel,
    uri: vscode.Uri,
    callback: () => void,
    disposeCallback?: () => void
  ) {
    const changeDocumentSubscription =
      vscode.workspace.onDidChangeTextDocument(callback);
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }
  public static limitTitle(title: string): string {
    return title.length <= 30 ? title : title.substring(0, 25) + "...";
  }
  public static format(commandTitle, commandKeyEvents) {
    if (!Holder.activeWebview) return false;
    Output.log(`📝 Formatting command: ${commandTitle} - ${commandKeyEvents}`);

    Holder.activeWebview.postMessage({
      type: "vditorCommand",
      content: {
        commandTitle,
        commandKeyEvents,
      },
    });
  }
}

export function getConfig<T>(key: string, defaultValue?: T): T | undefined {
  return vscode.workspace
    .getConfiguration("vsc-markdown")
    .get<T>(key, defaultValue);
}

export function calculateDocumentStats(text: string): {
  words: number;
  characters: number;
  lines: number;
} {
  const lines = text.split("\n").length;
  const characters = text.length;
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return { words, characters, lines };
}

import { WebviewPanel, Uri, window, workspace, Disposable } from "vscode";
import { EventEmitter } from "events";

export class Handler {
  constructor(public panel: WebviewPanel, private eventEmitter: EventEmitter) {}

  on(event: string, callback: (content: any) => any): this {
    if (event !== 'init') this.eventEmitter.removeAllListeners(event);
    
    this.eventEmitter.on(event, async (content) => {
      try { await callback(content); } 
      catch (e: any) { window.showErrorMessage(e.message); }
    });
    return this;
  }

  emit(type: string, content?: any) {
    this.panel.webview.postMessage({ type, content });
    return this;
  }

  public static bind(panel: WebviewPanel, uri: Uri): Handler {
    const ee = new EventEmitter();
    const watcher = workspace.createFileSystemWatcher(uri.fsPath);
    
    const subs = [
      watcher,
      watcher.onDidChange(e => ee.emit("fileChange", e)),
      workspace.onDidChangeTextDocument(e => {
        if (e.document.uri.toString() === uri.toString() && e.contentChanges.length) 
          ee.emit("externalUpdate", e);
      }),
      panel.webview.onDidReceiveMessage(m => ee.emit(m.type, m.content)),
      panel.onDidDispose(() => {
        subs.forEach(s => s.dispose());
        ee.emit("dispose");
      })
    ];

    return new Handler(panel, ee);
  }
}
import { WebviewPanel, Uri, window, workspace } from "vscode";
import { EventEmitter } from "events";
import { Output } from "./output";

export class Handler {

    constructor(public panel: WebviewPanel, private eventEmitter: EventEmitter) { }

    on(event: string, callback: (content: any) => any | Promise<any>): this {
        if (event != 'init') {
            const listens = this.eventEmitter.listeners(event)
            if (listens.length >= 1) {
                this.eventEmitter.removeListener(event, listens[0] as any)
            }
        }
        this.eventEmitter.on(event, async (content: any) => {
            try {
                await callback(content)
            } catch (error) {
                Output.debug(error)
                window.showErrorMessage(error.message)
            }
        })
        return this;
    }

    emit(event: string, content?: any) {
        this.panel.webview.postMessage({ type: event, content })
        return this;
    }

    public static bind(panel: WebviewPanel, uri: Uri): Handler {
        const eventEmitter = new EventEmitter();

        const fileWatcher = workspace.createFileSystemWatcher(uri.fsPath)
        fileWatcher.onDidChange(e => {
            eventEmitter.emit("fileChange", e)
        })

        const changeDocumentSubscription = workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === uri.toString() && e.contentChanges.length > 0) {
                eventEmitter.emit("externalUpdate", e)
            }
        });
        panel.onDidDispose(() => {
            fileWatcher.dispose()
            changeDocumentSubscription.dispose()
            eventEmitter.emit("dispose")
        });

        // bind from webview
        panel.webview.onDidReceiveMessage((message) => {
            eventEmitter.emit(message.type, message.content)
        })
        return new Handler(panel, eventEmitter);
    }

}

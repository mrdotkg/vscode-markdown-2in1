import { Uri, window, commands } from "vscode";
import { Holder } from "./common/holder";

export class MarkdownEditorService {
  static toggle(uri?: Uri) {
    const target = uri || window.activeTextEditor?.document.uri;
    if (target) {
      commands.executeCommand(
        "vscode.openWith",
        target,
        window.activeTextEditor ? "markdown2in1" : "default",
      );
    }
  }

  static builtin = (content: any) =>
    Holder.webview?.postMessage({ type: "vditorCommand", content });
}

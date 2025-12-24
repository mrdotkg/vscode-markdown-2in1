import * as vscode from "vscode";
import { Editor } from "./customMdEditor";
import { MarkdownService } from "./editorServices";
import { FileUtil } from "./common/fileUtil";
import { Output } from "./common/output";

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration("workbench");
  const configKey = "editorAssociations";
  const editorAssociations = config.get(configKey);
  editorAssociations["git:/**/*.md"] = "default";
  editorAssociations["gitlens:/**/*.md"] = "default";
  editorAssociations["git-graph:/**/*.md"] = "default";
  config.update(configKey, editorAssociations, true);
  const viewOption = {
    webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true },
  };
  FileUtil.init(context);
  const markdownService = new MarkdownService(context);
  const markdownEditorProvider = new Editor(context);
  context.subscriptions.push(
    vscode.commands.registerCommand("vsc-markdown.switch", (uri) => {
      markdownService.switchEditor(uri);
    }),
    vscode.commands.registerCommand("vsc-markdown.paste", () => {
      markdownService.loadClipboardImage();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertH1", () => {
      MarkdownService.insertHeading(1);
    }),
    vscode.commands.registerCommand("vsc-markdown.insertH2", () => {
      MarkdownService.insertHeading(2);
    }),
    vscode.commands.registerCommand("vsc-markdown.insertH3", () => {
      MarkdownService.insertHeading(3);
    }),
    vscode.commands.registerCommand("vsc-markdown.insertBold", () => {
      MarkdownService.insertEmphasis("bold");
    }),
    vscode.commands.registerCommand("vsc-markdown.insertItalic", () => {
      MarkdownService.insertEmphasis("italic");
    }),
    vscode.commands.registerCommand("vsc-markdown.insertList", () => {
      MarkdownService.insertList(false);
    }),
    vscode.commands.registerCommand("vsc-markdown.insertOrderedList", () => {
      MarkdownService.insertList(true);
    }),
    vscode.commands.registerCommand("vsc-markdown.insertLink", () => {
      MarkdownService.insertLink();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertImage", () => {
      MarkdownService.insertImage();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertCodeBlock", () => {
      MarkdownService.insertCodeBlock();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertInlineCode", () => {
      MarkdownService.insertInlineCode();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertBlockquote", () => {
      MarkdownService.insertBlockquote();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertHorizontalRule", () => {
      MarkdownService.insertHorizontalRule();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertTable", () => {
      MarkdownService.insertTable();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertStrikethrough", () => {
      MarkdownService.insertStrikethrough();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertEmptyBlock", () => {
      MarkdownService.insertEmptyBlock();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertH4", () => {
      MarkdownService.insertH4();
    }),
    vscode.commands.registerCommand("vsc-markdown.insertH5", () => {
      MarkdownService.insertH5();
    }),
    vscode.window.registerCustomEditorProvider(
      "vsc-markdown",
      markdownEditorProvider,
      viewOption
    )
  );
}

export function deactivate() {}

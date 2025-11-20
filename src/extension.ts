import * as vscode from 'vscode';
import { MarkdownEditorProvider } from './provider';
import { MarkdownService } from './service';
import { FileUtil } from './common/fileUtil';

export function activate(context: vscode.ExtensionContext) {
	keepOriginDiff();
	const viewOption = { webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true } };
	FileUtil.init(context)
	const markdownService = new MarkdownService(context);
	const markdownEditorProvider = new MarkdownEditorProvider(context)
	context.subscriptions.push(
		vscode.commands.registerCommand('office.markdown.switch', (uri) => { markdownService.switchEditor(uri) }),
		vscode.commands.registerCommand('office.markdown.paste', () => { markdownService.loadClipboardImage() }),
		vscode.window.registerCustomEditorProvider("cweijan.markdownViewer", markdownEditorProvider, viewOption),
		vscode.window.registerCustomEditorProvider("cweijan.markdownViewer.optional", markdownEditorProvider, viewOption)
	);
}

export function deactivate() { }

/**
 * Git History是生成一个临时文件, 因此这里无法控制
 */
function keepOriginDiff() {
	const config = vscode.workspace.getConfiguration("workbench");
	const configKey = 'editorAssociations'
	const editorAssociations = config.get(configKey)
	const key = '{git,gitlens,git-graph}:/**/*.{md,csv,svg}'
	if (editorAssociations[key]) {
		editorAssociations[key] = undefined
		config.update(configKey, editorAssociations, true)
	}
}
import { existsSync, mkdirSync } from 'fs';
import { dirname, parse } from 'path';
import {workspace, Uri, ExtensionContext} from 'vscode';
import { Global } from './global';

export function writeFile(path: string, buffer: Buffer) {
    const dir = dirname(path)
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
    }
    workspace.fs.writeFile(Uri.file(path), buffer);
}

export function adjustImgPath(uri: Uri, withworkspace: boolean = false) {
    const imgPath = Global.getConfig<string>("pasterImgPath")
        .replace("${fileName}", parse(uri.fsPath).name.replace(/\s/g, ''))
        .replace("${now}", new Date().getTime() + "")
    return {
        relPath: imgPath.replace(/\$\{workspaceDir\}\/?/, ''),
        fullPath: imgPath.replace("${workspaceDir}", getWorkspacePath(uri))

    };
}

/**
 * 根据uri获取其工作空间路径
 * @param uri 
 * @returns 
 */
export function getWorkspacePath(uri: Uri): string {
    const folders = workspace.workspaceFolders;
    if (!folders || folders.length == 0) return '';
    const workspacePath = folders[0]?.uri?.fsPath;
    if (folders.length > 1) {
        for (const folder of folders) {
            if (uri.fsPath.includes(folder.uri.fsPath)) {
                return folder.uri.fsPath;
            }
        }
    }
    return workspacePath;
}

export class FileUtil {
    private static context: ExtensionContext;
    public static init(context: ExtensionContext) {
        this.context = context;
    }
    public static getLastPath(key: string | string[], path = '') {
        // 获取已经保存的路径
        let basePath: string;
        if (!Array.isArray(key)) { key = [key] }
        for (const itemKey of key) {
            basePath = this.context.globalState.get(itemKey + 'SelectorPath');
            if (basePath) break;
        }
        if (basePath && !existsSync(basePath)) {
            basePath = workspace.workspaceFolders?.[0]?.uri.fsPath ?? ''
        } else {
            basePath = '';
        }
        return Uri.file(basePath + path)
    }
}

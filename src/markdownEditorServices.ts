import { env, Uri, window, commands, workspace } from "vscode";
import { Holder } from "./common/holder";
import { copyFileSync, existsSync, lstatSync, mkdirSync, renameSync } from "fs";
import path, { dirname, extname, isAbsolute, join, parse } from "path";
import { spawn } from "child_process";
import { fileTypeFromFile } from "file-type";
const extId = "markpen";

export class MarkdownEditorService {
  // Track the current heading level for toggle functionality (0-6, where 0 = paragraph)
  private static currentHeadingLevel = 0;

  static toggle(uri?: Uri) {
    const target =
      uri || window.activeTextEditor?.document.uri || Holder.doc?.uri;
    if (target) {
      // If custom editor is currently active, toggle to default
      // Otherwise, toggle to custom editor
      const editor = Holder.isCustomEditorActive ? "default" : extId;
      commands.executeCommand("vscode.openWith", target, editor);
    }
  }

  static cycleHeading() {
    // Cycle through heading levels: 0 (paragraph) → 1 → 2 → 3 → 4 → 5 → 6 → 0
    this.currentHeadingLevel = (this.currentHeadingLevel + 1) % 7;
    const headingLevel = this.currentHeadingLevel;
    const command = headingLevel === 0 ? "h0" : `h${headingLevel}`;
    
    // Find the corresponding feature to get the keyEvent
    const feature = require("./common/features").Features.find(
      (f: any) => f.command === command
    );
    
    if (feature) {
      this.vditorCommand(feature.keyEvent);
    }
  }

  static vditorCommand = (c: any) =>
    Holder.webview?.postMessage({ type: "vditorCommand", content: c });
  static noop = () => {};
  static pasteimage = (dir: string) => new Clip().load(dir);
  static cut = () => Holder.webview?.postMessage({ type: "vditorCut" });
  static paste = () => Holder.webview?.postMessage({ type: "vditorPaste" });
}

class Clip {
  adjustImgPath(uri: Uri, withworkspace = false) {
    const imgPath = this.getConfig<string>("pasterImgPath")
      .replace("${fileName}", parse(uri.fsPath).name.replace(/\s/g, ""))
      .replace("${now}", Date.now() + "");
    return {
      relPath: imgPath.replace(/\$\{workspaceDir\}\/?/, ""),
      fullPath: imgPath.replace("${workspaceDir}", this.getWorkspacePath(uri)),
    };
  }

  getWorkspacePath(uri: Uri): string {
    const folders = workspace.workspaceFolders;
    if (!folders?.length) return "";
    const workspacePath = folders[0].uri.fsPath;
    if (folders.length > 1)
      for (const folder of folders)
        if (uri.fsPath.includes(folder.uri.fsPath)) return folder.uri.fsPath;
    return workspacePath;
  }

  getConfig<T>(key: string, defaultValue?: T): T {
    return workspace.getConfiguration(extId).get<T>(key, defaultValue);
  }

  async load(extPath) {
    const document = window.activeTextEditor?.document || Holder.doc;
    // If there's text in clipboard AND we're in webview, delegate to webview paste
    if (await env.clipboard.readText()) {
      if (Holder.isCustomEditorActive && !window.activeTextEditor) {
        Holder.webview?.postMessage({ type: "vditorPaste" }); // ← webview path
      } else {
        commands.executeCommand("editor.action.clipboardPasteAction");
      }
      return;
    }
    if (!document || document.isUntitled || document.isClosed) return;

    const uri = document.uri;
    const { fullPath, relPath: rp } = this.adjustImgPath(uri);
    let relPath = rp;
    const imagePath = (
      isAbsolute(fullPath) ? fullPath : `${dirname(uri.fsPath)}/${relPath}`
    )
      .split("/")
      .join(path.sep);

    this.createImgDir(imagePath);
    this.saveClipboardImageToFileAndGetPath(
      imagePath,
      async (savedImagePath) => {
        if (!savedImagePath) return;
        if (savedImagePath === "no image") {
          window.showErrorMessage("There is not an image in the clipboard.");
          return;
        }
        await this.copyFromPath(savedImagePath, imagePath);
        if (!existsSync(imagePath)) {
          window.showErrorMessage(
            `Failed to save image. Expected location: ${imagePath}`,
          );
          return;
        }
        const editor = window.activeTextEditor;
        let imgName = parse(relPath).name;
        relPath = await Clip.imgExtGuide(imagePath, relPath);

        // Extract the filename with extension for the markdown link
        const imgNameWithExt = parse(relPath).base;
        const markdownLink = `![${imgName}](${relPath})`;

        if (editor) {
          editor.edit((edit) => {
            const sel = editor.selection;
            sel.isEmpty
              ? edit.insert(sel.start, markdownLink)
              : edit.replace(sel, markdownLink);
          });
        } else {
          // If no editor is active, send markdown to webview
          Holder.webview?.postMessage({
            type: "pasteImageMarkdown",
            content: markdownLink,
          });
        }
      },
      extPath,
    );
  }

  private static async imgExtGuide(absPath: string, relPath: string) {
    try {
      const oldExt = extname(absPath);
      const { ext = "png" } = (await fileTypeFromFile(absPath)) ?? {};
      if (oldExt !== `.${ext}`) {
        relPath = relPath.replace(oldExt, `.${ext}`);
        renameSync(absPath, absPath.replace(oldExt, `.${ext}`));
      }
    } catch (err) {
      window.showWarningMessage(
        `Could not determine image type: ${err.message}`,
      );
    }
    return relPath;
  }

  private async copyFromPath(savedImagePath: string, targetPath: string) {
    if (!savedImagePath.startsWith("copied:")) return;
    const copiedFile = savedImagePath.replace("copied:", "");
    lstatSync(copiedFile).isDirectory()
      ? window.showErrorMessage("Not support paste directory.")
      : copyFileSync(copiedFile, targetPath);
  }

  private createImgDir(imagePath: string) {
    const dir = path.dirname(imagePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  private saveClipboardImageToFileAndGetPath(
    imagePath: string,
    cb: (v: string) => void,
    ep,
  ) {
    if (!imagePath) return;
    const platform = process.platform;
    const scripts: Record<string, [string, string[]]> = {
      win32: [
        "powershell",
        [
          "-noprofile",
          "-noninteractive",
          "-nologo",
          "-sta",
          "-executionpolicy",
          "unrestricted",
          "-windowstyle",
          "hidden",
          "-file",
          path.join(ep, "/assets/platformscripts/imagepaste.ps1"),
          imagePath,
        ],
      ],
      darwin: [
        "osascript",
        [
          path.join(ep, "/assets/platformscripts/imagepaste.applescript"),
          imagePath,
        ],
      ],
    };
    const [cmd, args] = scripts[platform] ?? [
      "sh",
      [path.join(ep, "/assets/platformscripts/imagepaste.sh"), imagePath],
    ];
    const proc = spawn(cmd, args);
    proc.stdout.on("data", (data) => {
      const result = data.toString().trim();
      if (result === "no xclip") {
        window.showInformationMessage(
          "You need to install xclip command first.",
        );
        return;
      }
      cb(result);
    });
  }
}

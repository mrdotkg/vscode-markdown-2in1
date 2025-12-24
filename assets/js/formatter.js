// Markdown formatter for webview using window.vditor

class VditorFormatter {
  static waitForVditor(callback, maxAttempts = 50) {
    if (window.vditor) {
      callback();
    } else if (maxAttempts > 0) {
      setTimeout(() => this.waitForVditor(callback, maxAttempts - 1), 100);
    } else {
      console.warn("Vditor not ready after waiting");
    }
  }

  static insertHeading(level = 1) {
    this.waitForVditor(() => {
      window.vditor.focus();
      const headingPrefix = "#".repeat(level) + " ";
      window.vditor.insertValue(headingPrefix, true);
      window.vditor.focus();
    });
  }

  static insertEmphasis(type = "bold") {
    this.waitForVditor(() => {
      const marker = type === "bold" ? "**" : "*";
      // Insert empty formatting markers
      window.vditor.insertValue(marker + marker, true);
      window.vditor.focus();
    });
  }

  static insertList(ordered = false) {
    this.waitForVditor(() => {
      const listMarker = ordered ? "1. " : "- ";
      window.vditor.insertValue(listMarker, true);
      window.vditor.focus();
    });
  }

  static insertLink() {
    this.waitForVditor(() => {
      window.vditor.insertValue("[]()", true);
      window.vditor.focus();
    });
  }

  static insertImage() {
    this.waitForVditor(() => {
      window.vditor.insertValue("![]()", true);
      window.vditor.focus();
    });
  }

  static insertCodeBlock() {
    this.waitForVditor(() => {
      window.vditor.insertMD("```\n\n```", true);
      window.vditor.focus();
    });
  }

  static insertInlineCode() {
    this.waitForVditor(() => {
      window.vditor.insertValue("``", true);
      window.vditor.focus();
    });
  }

  static insertBlockquote() {
    this.waitForVditor(() => {
      window.vditor.insertValue("> ", true);
      window.vditor.focus();
    });
  }

  static insertHorizontalRule() {
    this.waitForVditor(() => {
      window.vditor.insertMD("\n---\n", true);
      window.vditor.focus();
    });
  }

  static insertTable() {
    this.waitForVditor(() => {
      const tableMarkdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
      window.vditor.insertMD(tableMarkdown, true);
      window.vditor.focus();
    });
  }

  static insertStrikethrough() {
    this.waitForVditor(() => {
      window.vditor.insertValue("~~~~", true);
      window.vditor.focus();
    });
  }

  static insertEmptyBlock() {
    this.waitForVditor(() => {
      // Insert empty block at the end (after current content)
      window.vditor.insertEmptyBlock("afterend");
      window.vditor.focus();
    });
  }

  static showHotkeys() {
    this.waitForVditor(() => {
      const hotkeysText = `SummaryName	Keymap	Remarks`;
      if (window.vditor.tip) {
        window.vditor.tip(hotkeysText, 0);
      }
    });
  }

  static insertH4() {
    this.waitForVditor(() => {
      window.vditor.focus();
      const headingPrefix = "#### ";
      window.vditor.insertValue(headingPrefix, true);
      window.vditor.focus();
    });
  }

  static insertH5() {
    this.waitForVditor(() => {
      window.vditor.focus();
      const headingPrefix = "##### ";
      window.vditor.insertValue(headingPrefix, true);
      window.vditor.focus();
    });
  }
}

// Listen for formatting commands from the extension
if (window.vscodeEvent) {
  window.vscodeEvent.on("vditorCommand", (message) => {
    if (!message || !message.command) {
      console.log("Invalid message or missing command");
      return;
    }
    switch (message.command) {
      case "insertHeading":
        console.log("Received insertHeading command with level:", message.data?.level); 
        VditorFormatter.insertHeading(message.data?.level || 1);
        break;
      case "insertEmphasis":
        console.log("Received insertEmphasis command with type:", message.data?.type);
        VditorFormatter.insertEmphasis(message.data?.type || "bold");
        break;
      case "insertList":
        console.log("Received insertList command with ordered:", message.data?.ordered);
        VditorFormatter.insertList(message.data?.ordered || false);
        break;
      case "insertLink":
        VditorFormatter.insertLink();
        break;
      case "insertImage":
        VditorFormatter.insertImage();
        break;
      case "insertCodeBlock":
        VditorFormatter.insertCodeBlock();
        break;
      case "insertInlineCode":
        VditorFormatter.insertInlineCode();
        break;
      case "insertBlockquote":
        VditorFormatter.insertBlockquote();
        break;
      case "insertHorizontalRule":
        VditorFormatter.insertHorizontalRule();
        break;
      case "insertTable":
        VditorFormatter.insertTable();
        break;
      case "insertStrikethrough":
        VditorFormatter.insertStrikethrough();
        break;
      case "insertEmptyBlock":
        VditorFormatter.insertEmptyBlock();
        break;
      case "insertH4":
        VditorFormatter.insertH4();
        break;
      case "insertH5":
        VditorFormatter.insertH5();
        break;
      default:
        console.log("Unknown command:", message.command);
    }
  });
} else {
  console.log("vscodeEvent is not available");
}
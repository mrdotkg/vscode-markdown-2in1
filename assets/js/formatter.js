// Markdown formatter for webview using window.vditor

class VditorHotkeyDispatcher {
  constructor(keys) {
    this.keys = keys;
    this.waitForVditor(() => {
      window.vditor.focus();
      // Dispatch to the active element (Vditor's editor)
      const activeElement = document.activeElement || window.vditor.ir.element;
      console.log("Dispatching keyboard events to:", activeElement, "with keys:", this.keys);
      // Send keydown, keypress, and keyup for maximum compatibility
      ["keydown", "keypress", "keyup"].forEach((eventType) => {
        const event = new KeyboardEvent(eventType, this.keys);
        document.getElementById("editor").dispatchEvent(event);
      });
      window.vditor.focus();
    });
  }

  waitForVditor(callback, maxAttempts = 50) {
    if (window.vditor) {
      callback();
    } else if (maxAttempts > 0) {
      setTimeout(() => this.waitForVditor(callback, maxAttempts - 1), 100);
    } else {
      console.warn("Vditor not ready after waiting");
    }
  }
}

// Listen for formatting commands from the extension
if (window.vscodeEvent) {
  window.vscodeEvent.on("vditorCommand", (message) => {
    // Handle keyboard hotkey commands by creating dispatcher
    console.log("Received vditorCommand message:", message);
    // if (message.data && typeof message.data === 'object' && message.data.key) {
      console.log("Dispatching hotkey with data:", message);
      new VditorHotkeyDispatcher(message);
      return;
    // }
  });
} else {
  console.log("vscodeEvent is not available");
}
import * as vscode from "vscode";
import { Features, getStatusBarFeatures } from "./common/features";
import { Output, getConfig, calculateDocumentStats } from "./common/utility";

export class StatusBarControls {
  private countStatus: vscode.StatusBarItem;
  private buttons: Map<string, vscode.StatusBarItem> = new Map();
  private context: vscode.ExtensionContext | undefined;

  constructor(context?: vscode.ExtensionContext) {
    this.context = context;

    // Create word/character count status bar item
    this.countStatus = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.countStatus.text = "0 Words";
    this.countStatus.tooltip = "Word and character count";

    // Create dynamic buttons based on features
    this.createDynamicButtons();

    // Setup configuration watcher
    this.setupConfigurationWatcher();
    // Track configuration changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("vsc-markdown")) {
          this.updateVisibility();
        }
      })
    );
    // Track active text editor changes
    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        editor?.document.languageId === "markdown" ? this.show() : this.hide();
      })
    );
    Output.log("✅ Toolbar initialized");
  }

  /**
   * Create buttons for all features that have showInStatusBar === true and are enabled
   */
  private createDynamicButtons() {
    // Get enabled status bar items from settings
    const statusBarItems = getConfig<string[]>("statusBar.items") || [];

    // Filter features that are in the settings array, have showInStatusBar === true, and are enabled
    const featuresToShow = Features.filter(
      (feature) =>
        feature.showInStatusBar === true &&
        statusBarItems.includes(feature.id) &&
        (feature.text || feature.icon) &&
        vscode.workspace
          .getConfiguration("vsc-markdown")
          .get(`features.${feature.id}.enabled`, feature.enabledByDefault)
    );

    Output.log(`📊 Creating ${featuresToShow.length} status bar buttons`);

    let priority = 1000;
    featuresToShow.forEach((feature) => {
      const button = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        priority--
      );

      // Set button properties
      button.text = feature.text || feature.icon || feature.title;
      button.tooltip = feature.title;
      button.command = feature.command;

      // Store in map
      this.buttons.set(feature.id, button);
    });
  }

  /**
   * Update word and character count display
   */
  updateCount(content: string) {
    const stats = calculateDocumentStats(content);
    this.countStatus.text = `$(edit) ${stats.words} Words • $(quote) ${stats.characters} Chars • $(file-text) ${stats.lines} Lines`;
    this.countStatus.tooltip = `Words: ${stats.words} | Characters: ${stats.characters} | Lines: ${stats.lines}`;
  }

  /**
   * Show all status bar items
   */
  show() {
    this.countStatus.show();
    this.buttons.forEach((button) => button.show());
  }

  /**
   * Hide all status bar items
   */
  hide() {
    this.countStatus.hide();
    this.buttons.forEach((button) => button.hide());
  }

  /**
   * Dispose all status bar items
   */
  dispose() {
    this.countStatus.dispose();
    this.buttons.forEach((button) => button.dispose());
    this.buttons.clear();
  }

  /**
   * Setup listener for configuration changes
   */
  private setupConfigurationWatcher() {
    if (!this.context) return;

    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (
          event.affectsConfiguration("vsc-markdown.statusBar.items") ||
          event.affectsConfiguration("vsc-markdown.features")
        ) {
          Output.log(
            "🔄 Status bar items configuration changed, rebuilding buttons..."
          );

          // Dispose old buttons
          this.buttons.forEach((button) => button.dispose());
          this.buttons.clear();

          // Recreate with new configuration
          this.createDynamicButtons();

          // Show if editor is active
          const editor = vscode.window.activeTextEditor;
          if (editor?.document.languageId === "markdown") {
            this.show();
          }
        }
      })
    );
  }

  /**
   * Get all active buttons
   */
  getActiveButtons(): Array<{ id: string; button: vscode.StatusBarItem }> {
    return Array.from(this.buttons.entries()).map(([id, button]) => ({
      id,
      button,
    }));
  }

  /**
   * Update button visibility based on current settings
   */
  updateVisibility() {
    const statusBarItems = getConfig<string[]>("statusBar.items") || [];

    // Show/hide buttons based on current settings and feature enabled status
    this.buttons.forEach((button, featureId) => {
      const feature = Features.find((f) => f.id === featureId);
      const isEnabled = vscode.workspace
        .getConfiguration("vsc-markdown")
        .get(
          `features.${featureId}.enabled`,
          feature?.enabledByDefault || false
        );

      if (
        statusBarItems.includes(featureId) &&
        feature?.showInStatusBar === true &&
        isEnabled
      ) {
        button.show();
      } else {
        button.hide();
      }
    });

    Output.log(`📊 Updated status bar visibility`);
  }
}

export function getStatusBarDefaults(): string[] {
  return getStatusBarFeatures()
    .filter((f) => f.enabledByDefault)
    .map((f) => f.id);
}

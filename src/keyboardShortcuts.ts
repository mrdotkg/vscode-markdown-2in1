/**
 * Keyboard Shortcuts Client
 * Manages and validates keyboard shortcuts for markdown features
 * Keybindings are defined in package.json via modifyPackageJson.ts
 * This module validates and reports on keybinding status
 */

import * as vscode from "vscode";
import { Features } from "./common/features";
import { Output } from "./common/utility";

export class KeyboardShortcuts {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  /**
   * Validate and log keyboard shortcuts
   */
  public registerShortcuts(): void {
    Output.log("⌨️  Validating keyboard shortcuts...");

    const enabledShortcuts: string[] = [];
    const disabledShortcuts: string[] = [];

    Features.forEach((feature) => {
      if (!feature.keybinding) {
        return; // Skip features without keybindings
      }

      const isEnabled = vscode.workspace.getConfiguration("markdown-2in1").get(
        `features.${feature.id}.keybinding`,
        feature.enabledByDefault
      );

      if (isEnabled) {
        enabledShortcuts.push(`${feature.keybinding} → ${feature.title}`);
      } else {
        disabledShortcuts.push(`${feature.keybinding} (disabled)`);
      }
    });

    Output.log(`✅ Active keyboard shortcuts: ${enabledShortcuts.length}`);
    enabledShortcuts.forEach((shortcut) => Output.log(`   ${shortcut}`));

    if (disabledShortcuts.length > 0) {
      Output.log(`⏸️  Disabled shortcuts: ${disabledShortcuts.length}`);
    }

    // Setup listener for configuration changes
    this.setupConfigurationListener();
  }

  /**
   * Setup listener for configuration changes
   */
  private setupConfigurationListener(): void {
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("markdown-2in1")) {
          Output.log("🔄 Configuration changed, keyboard shortcuts updated");
        }
      })
    );
  }

  /**
   * Get all enabled shortcuts
   */
  public getEnabledShortcuts(): any[] {
    return Features.filter((feature) => {
      if (!feature.keybinding) return false;
      const isEnabled = vscode.workspace.getConfiguration("markdown-2in1").get(
        `features.${feature.id}.keybinding`,
        feature.enabledByDefault
      );
      return isEnabled;
    }).map((feature) => ({
      command: feature.command,
      keybinding: feature.keybinding,
      title: feature.title,
    }));
  }

  /**
   * Check if specific feature shortcut is enabled
   */
  public isShortcutEnabled(featureId: string): boolean {
    const feature = Features.find((f) => f.id === featureId);
    if (!feature || !feature.keybinding) {
      return false;
    }

    return vscode.workspace.getConfiguration("markdown-2in1").get(
      `features.${featureId}.keybinding`,
      feature.enabledByDefault
    );
  }
}

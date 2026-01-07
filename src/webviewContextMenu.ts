import * as vscode from "vscode";
import { Features, Feature, getWebviewContextFeatures } from "./common/features";

export interface ContextMenuItem {
  command: string;
  title: string;
  icon?: string;
  keybinding?: string;
  category?: string;
}

export interface GroupedContextMenu {
  [category: string]: ContextMenuItem[];
}

export class ContextMenu {
  private static instance: ContextMenu;

  private constructor() {}

  static getInstance(): ContextMenu {
    if (!ContextMenu.instance) {
      ContextMenu.instance = new ContextMenu();
    }
    return ContextMenu.instance;
  }

  /**
   * Gets enabled features for webview context menu from VS Code configuration
   */
  getMenuItems(): ContextMenuItem[] {
    const config = vscode.workspace.getConfiguration("vsc-markdown");
    const enabledItems: string[] = config.get("webviewContextMenu.items", []);
    
    // Filter features based on configuration and enabled status
    return Features
      .filter((feature) => {
        // Check if feature is enabled at the master level
        const isFeatureEnabled = config.get(`features.${feature.id}.enabled`, feature.enabledByDefault);
        // Check if feature is in the webviewContextMenu.items array
        const isInContextMenu = enabledItems.includes(feature.id);
        // Check if feature should show in webview context menu
        const showInWebviewContextMenu = feature.showInWebviewContextMenu;
        
        return isFeatureEnabled && isInContextMenu && showInWebviewContextMenu;
      })
      // Sort by the order specified in the configuration
      .sort((a, b) => {
        const aIndex = enabledItems.indexOf(a.id);
        const bIndex = enabledItems.indexOf(b.id);
        return aIndex - bIndex;
      })
      .map((feature) => ({
        command: feature.command,
        title: feature.title,
        icon: feature.icon,
        keybinding: feature.keybinding || "",
        category: this.categorizeFeature(feature),
      }));
  }

  /**
   * Gets menu items grouped by category for multi-level menu
   */
  getGroupedMenuItems(): GroupedContextMenu {
    const items = this.getMenuItems();
    const grouped: GroupedContextMenu = {};

    items.forEach((item) => {
      const category = item.category || "other";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }

  /**
   * Gets category display name
   */
  getCategoryName(category: string): string {
    const names: Record<string, string> = {
      headings: "Headings",
      formatting: "Text Formatting",
      lists: "Lists",
      tables: "Tables", 
      links: "Links",
      media: "Media",
      code: "Code",
      other: "Other",
    };
    return names[category] || category;
  }

  /**
   * Gets all features that can appear in webview context menu (for configuration)
   */
  getAvailableFeatures(): Feature[] {
    return Features.filter((feature) => feature.showInWebviewContextMenu);
  }

  /**
   * Categorizes feature for organizing context menu
   */
  private categorizeFeature(feature: Feature): string {
    return feature.category;
  }
}

/**
 * Get default webview context menu feature IDs for configuration
 * Returns IDs for default config
 * Runtime: builds menu from user settings array
 */
export function getWebviewContextDefaults(): string[] {
  return getWebviewContextFeatures()
    .filter(f => f.enabledByDefault)
    .map(f => f.id);
}

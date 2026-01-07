/**
 * Manifest Package.json generation module
 * Generates VS Code extension contribution and configuration from Features array
 * Run during build process (--mode=production) to keep package.json in sync
 */

import * as fs from "fs";
import * as path from "path";
import { Features, Feature } from "./features";

// Import pure feature helper functions (no vscode dependency)
import {
  getEditorTitleFeatures,
  getEditorContextFeatures,
  getStatusBarFeatures,
  getWebviewContextFeatures,
} from "./features";

export interface Command {
  command: string;
  title: string;
  icon?: string;
  category?: string;
}

export interface Keybinding {
  command: string;
  key: string;
  when?: string;
}

export interface ConfigurationProperty {
  type: string;
  description: string;
  default: any;
  enum?: string[];
  items?: any;
  markdownDescription?: string;
}

export interface MenuItem {
  command: string;
  when?: string;
  group?: string;
}

/**
 * Generate commands array for package.json
 */
export function generateCommands(): Command[] {
  return Features.map((feature) => ({
    command: feature.command,
    title: `Palm Markdown | ${feature.title}`,
    icon: feature.icon,
    category: feature.category,
  }));
}

/**
 * Generate keybindings array for package.json
 */
export function generateKeybindings(): Keybinding[] {
  return Features.filter((f) => f.keybinding)
    .map((feature) => ({
      command: feature.command,
      key: feature.keybinding!,
      when: `editorTextFocus && editorLangId == markdown && config.vsc-markdown.features.${feature.id}.enabled`,
    }));
}

/**
 * Generate editor title menus for package.json
 */
export function generateEditorTitleMenus(features: Feature[] = Features): MenuItem[] {
  return features
    .filter((f) => f.showInEditorTitle)
    .map((feature) => ({
      command: feature.command,
      when: `resourceLangId == markdown && config.vsc-markdown.features.${feature.id}.enabled`,
      group: "navigation",
    }));
}

/**
 * Generate editor context menus for package.json
 */
export function generateEditorContextMenus(features: Feature[] = Features): MenuItem[] {
  const categoryGroupMap: Record<string, string> = {
    headings: "1_headings",
    formatting: "2_formatting",
    lists: "3_lists",
    tables: "4_tables",
    links: "5_links",
    media: "6_media",
    code: "7_code",
    other: "9_other",
  };

  return features
    .filter((f) => f.showInEditorContextMenu)
    .map((feature) => ({
      command: feature.command,
      when: `resourceLangId == markdown && config.vsc-markdown.features.${feature.id}.enabled`,
      group: categoryGroupMap[feature.category] || "9_other",
    }));
}

/**
 * Generate configuration schema for package.json
 */
export function generateConfigurationSchema(features: Feature[] = Features): Record<string, ConfigurationProperty> {
  const schema: Record<string, ConfigurationProperty> = {};

  // Status bar items configuration
  schema["vsc-markdown.statusBar.items"] = {
    type: "array",
    description: "Order and visibility of status bar buttons (drag to reorder)",
    markdownDescription:
      "Configure which formatting buttons appear in the status bar and their order. Drag items to reorder.",
    default: features.filter((f) => f.enabledByDefault && f.text).map((f) => f.id),
    items: {
      type: "string",
      enum: features.filter((f) => f.text).map((f) => f.id),
      enumDescriptions: features.filter((f) => f.text).map((f) => f.title),
    },
  };

  // Webview context menu items configuration (renamed from contextMenu.items)
  schema["vsc-markdown.webviewContextMenu.items"] = {
    type: "array",
    description: "Order and visibility of webview context menu items (drag to reorder)",
    markdownDescription: "Configure which formatting options appear in the webview right-click menu and their order. Drag to reorder.",
    default: features.filter((f) => f.enabledByDefault && f.showInWebviewContextMenu).map((f) => f.id),
    items: {
      type: "string",
      enum: features.filter((f) => f.showInWebviewContextMenu).map((f) => f.id),
      enumDescriptions: features.filter((f) => f.showInWebviewContextMenu).map((f) => f.title),
    },
  };

  // Per-feature master toggles
  features.forEach((feature) => {
    schema[`vsc-markdown.features.${feature.id}.enabled`] = {
      type: "boolean",
      description: `Enable feature: ${feature.title}`,
      markdownDescription: `Master switch to enable/disable **${feature.title}** completely`,
      default: feature.enabledByDefault,
    };
  });

  // Per-feature keybinding toggles
  features.filter((f) => f.keybinding).forEach((feature) => {
    schema[`vsc-markdown.features.${feature.id}.keybinding`] = {
      type: "boolean",
      description: `Enable keyboard shortcut for: ${feature.title}`,
      markdownDescription: `Enable the keyboard shortcut **${feature.keybinding}** for ${feature.title}`,
      default: feature.enabledByDefault,
    };
  });

  // Per-feature command palette toggles
  features.forEach((feature) => {
    schema[`vsc-markdown.features.${feature.id}.commandPalette`] = {
      type: "boolean",
      description: `Show in command palette: ${feature.title}`,
      markdownDescription: `Control whether **${feature.title}** appears in the command palette (Ctrl+Shift+P)`,
      default: feature.enabledByDefault,
    };
  });

  return schema;
}

/**
 * Generate configuration defaults using client-provided data
 */
export function generateConfigurationDefaults(features: Feature[] = Features): Record<string, any> {
  const defaults: Record<string, any> = {};

  // Status bar default items - use feature data defaults
  defaults["vsc-markdown.statusBar.items"] = getStatusBarFeatures()
    .filter((f) => f.enabledByDefault)
    .map((f) => f.id);

  // Webview context menu default items - use feature data defaults
  defaults["vsc-markdown.webviewContextMenu.items"] = getWebviewContextFeatures()
    .filter((f) => f.enabledByDefault)
    .map((f) => f.id);

  // Feature-specific defaults
  features.forEach((feature) => {
    defaults[`vsc-markdown.features.${feature.id}.enabled`] = feature.enabledByDefault;
    if (feature.keybinding) {
      defaults[`vsc-markdown.features.${feature.id}.keybinding`] = feature.enabledByDefault;
    }
    defaults[`vsc-markdown.features.${feature.id}.commandPalette`] = feature.enabledByDefault;
  });

  return defaults;
}

/**
 * Read and parse package.json
 */
function readPackageJson(): any {
  const packageJsonPath = path.join(__dirname, "..", "..", "..", "package.json");
  const content = fs.readFileSync(packageJsonPath, "utf-8");
  return JSON.parse(content);
}

/**
 * Write package.json with formatted output
 */
function writePackageJson(packageJson: any): void {
  const packageJsonPath = path.join(__dirname, "..", "..", "..", "package.json");
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
}

/**
 * Merge generated content into package.json
 */
export function updatePackageJsonFile(): void {
  console.log("🔄 Generating package.json from features...");

  try {
    const packageJson = readPackageJson();

    // Initialize contributes if not present
    if (!packageJson.contributes) {
      packageJson.contributes = {};
    }

    // Generate and merge commands
    const commands = generateCommands();
    packageJson.contributes.commands = commands;
    console.log(`✅ Generated ${commands.length} commands`);

    // Generate and merge keybindings
    const keybindings = generateKeybindings();
    packageJson.contributes.keybindings = keybindings;
    console.log(`✅ Generated ${keybindings.length} keybindings`);

    // Generate and merge menus using feature data (no vscode imports)
    if (!packageJson.contributes.menus) {
      packageJson.contributes.menus = {};
    }

    const editorTitleMenus = generateEditorTitleMenus(getEditorTitleFeatures());
    packageJson.contributes.menus["editor/title"] = editorTitleMenus;
    console.log(`✅ Generated ${editorTitleMenus.length} editor title menus`);

    const editorContextMenus = generateEditorContextMenus(getEditorContextFeatures());
    packageJson.contributes.menus["editor/context"] = editorContextMenus;
    console.log(`✅ Generated ${editorContextMenus.length} editor context menus`);

    // Generate and merge configuration
    const configurationSchema = generateConfigurationSchema();
    if (!packageJson.contributes.configuration) {
      packageJson.contributes.configuration = {
        title: "Palm Markdown",
        properties: {},
      };
    }
    packageJson.contributes.configuration.properties = configurationSchema;
    console.log(`✅ Generated ${Object.keys(configurationSchema).length} configuration properties`);

    // Preserve existing configurationDefaults if present, merge with new defaults
    const newDefaults = generateConfigurationDefaults();
    packageJson.configurationDefaults = {
      ...packageJson.configurationDefaults,
      ...newDefaults,
    };
    console.log(`✅ Generated ${Object.keys(newDefaults).length} configuration defaults`);

    // Write back to package.json
    writePackageJson(packageJson);

    console.log("✨ Successfully updated package.json!");
    console.log(
      `\n📊 Summary:\n  - Commands: ${commands.length}\n  - Keybindings: ${keybindings.length}\n  - Editor title menus: ${editorTitleMenus.length}\n  - Editor context menus: ${editorContextMenus.length}\n  - Configuration properties: ${Object.keys(configurationSchema).length}`
    );
  } catch (error) {
    console.error("❌ Error updating package.json:", error);
    throw error;
  }
}

/**
 * Export function for use in build process
 */
export default {
  generateCommands,
  generateKeybindings,
  generateEditorTitleMenus,
  generateEditorContextMenus,
  generateConfigurationSchema,
  generateConfigurationDefaults,
  updatePackageJsonFile,
};

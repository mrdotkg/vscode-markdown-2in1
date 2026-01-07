/**
 * Editor Context Menu module
 * Manages native editor context menu items (minimal/optional)
 * Native menu is static via package.json
 * File may not be needed if no runtime logic
 */

import { getEditorContextFeatures } from './common/features';
import { generateEditorContextMenus } from './common/manifest';

export interface EditorContextMenuItem {
  command: string;
  title: string;
  when?: string;
  group?: string;
}

/**
 * Get editor context menu items for native VS Code context menu
 * These appear when right-clicking in the editor
 * Runtime: minimal (menu is static in package.json)
 */
export function getEditorContextMenuItems() {
  return generateEditorContextMenus(getEditorContextFeatures());
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use getEditorContextMenuItems() instead
 */
function getDefaultEditorContextMenuItems(): EditorContextMenuItem[] {
  return [
    {
      command: "vsc-markdown.toggleBold",
      title: "Bold",
      when: "resourceExtname == .md && editorTextFocus",
      group: "1_modification@1"
    },
    {
      command: "vsc-markdown.toggleItalic", 
      title: "Italic",
      when: "resourceExtname == .md && editorTextFocus",
      group: "1_modification@2"
    },
    {
      command: "vsc-markdown.toggleStrikethrough",
      title: "Strikethrough", 
      when: "resourceExtname == .md && editorTextFocus",
      group: "1_modification@3"
    },
    {
      command: "vsc-markdown.insertLink",
      title: "Insert Link",
      when: "resourceExtname == .md && editorTextFocus",
      group: "2_insert@1"
    },
    {
      command: "vsc-markdown.insertImage",
      title: "Insert Image",
      when: "resourceExtname == .md && editorTextFocus", 
      group: "2_insert@2"
    },
    {
      command: "vsc-markdown.insertCodeBlock",
      title: "Insert Code Block",
      when: "resourceExtname == .md && editorTextFocus",
      group: "2_insert@3"
    }
  ];
}

/**
 * Get default feature IDs for editor context menu
 * @deprecated - Feature IDs are now managed by the features system
 */
export function getEditorContextFeatureIds(): string[] {
  return getEditorContextFeatures().map(f => f.id);
}

/**
 * Check if a feature should appear in the editor context menu
 * @deprecated - Use features system instead
 */
export function isEditorContextFeature(featureId: string): boolean {
  return getEditorContextFeatures().some(f => f.id === featureId);
}
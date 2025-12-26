import { Hotkeys } from "./hotkeys";

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
   * Gets all hotkeys formatted for webview context menu display
   */
  getMenuItems(): ContextMenuItem[] {
    return Hotkeys.map((hotkey) => ({
      command: hotkey.command,
      title: hotkey.title,
      icon: hotkey.icon,
      keybinding: hotkey.keybinding || "",
      category: this.categorizeHotkey(hotkey.title),
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
      formatting: "Text Formatting",
      headings: "Headings",
      lists: "Lists",
      tables: "Tables",
      blocks: "Blocks",
      other: "Other",
    };
    return names[category] || category;
  }

  /**
   * Categorizes hotkey by title for organizing context menu
   */
  private categorizeHotkey(title: string): string {
    const titleLower = title.toLowerCase();

    if (
      titleLower.includes("bold") ||
      titleLower.includes("italic") ||
      titleLower.includes("strikethrough")
    ) {
      return "formatting";
    }

    if (
      titleLower.includes("h1") ||
      titleLower.includes("h2") ||
      titleLower.includes("h3") ||
      titleLower.includes("h4") ||
      titleLower.includes("h5") ||
      titleLower.includes("h6") ||
      titleLower.includes("heading")
    ) {
      return "headings";
    }

    if (titleLower.includes("list") || titleLower.includes("task")) {
      return "lists";
    }

    if (
      titleLower.includes("table") ||
      titleLower.includes("row") ||
      titleLower.includes("col") ||
      titleLower.includes("align")
    ) {
      return "tables";
    }

    if (
      titleLower.includes("link") ||
      titleLower.includes("image") ||
      titleLower.includes("blockquote") ||
      titleLower.includes("code") ||
      titleLower.includes("block")
    ) {
      return "blocks";
    }

    return "other";
  }
}

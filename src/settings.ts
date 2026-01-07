/**
 * Settings Configuration Client
 * Exports configuration schema and default values for VS Code Settings UI
 * Configuration is generated from Features array and stored in package.json
 */

import { Features, CategoryMetadata } from "./common/features";
import { generateConfigurationSchema, generateConfigurationDefaults } from "./common/manifest";

export interface SettingsConfiguration {
  title: string;
  properties: Record<string, any>;
}

export interface SettingsDefaults {
  [key: string]: any;
}

/**
 * Get the complete settings configuration
 * This includes all property definitions for the VS Code Settings UI
 */
export function getSettingsConfiguration(): SettingsConfiguration {
  return {
    title: "Markdown 2-in-1",
    properties: generateConfigurationSchema(),
  };
}

/**
 * Get all configuration defaults
 * These are the default values for all settings
 */
export function getSettingsDefaults(): SettingsDefaults {
  return generateConfigurationDefaults();
}

/**
 * Get feature-specific settings
 */
export function getFeatureSettings(featureId: string): any {
  const feature = Features.find((f) => f.id === featureId);
  if (!feature) {
    return null;
  }

  return {
    id: feature.id,
    title: feature.title,
    category: feature.category,
    keybinding: feature.keybinding,
    icon: feature.icon,
    text: feature.text,
    enabledByDefault: feature.enabledByDefault,
    weight: feature.weight,
  };
}

/**
 * Get all settings grouped by category
 */
export function getSettingsByCategory(): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};

  Features.forEach((feature) => {
    if (!grouped[feature.category]) {
      grouped[feature.category] = [];
    }
    grouped[feature.category].push({
      id: feature.id,
      title: feature.title,
      icon: feature.icon,
      text: feature.text,
      enabledByDefault: feature.enabledByDefault,
    });
  });

  return grouped;
}

/**
 * Get category information including display names
 */
export function getCategoryMetadata(): Record<string, any> {
  return CategoryMetadata;
}

/**
 * Validate settings configuration
 */
export function validateSettings(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check that features have required properties
  Features.forEach((feature) => {
    if (!feature.id) errors.push(`Feature missing id`);
    if (!feature.command) errors.push(`Feature ${feature.id} missing command`);
    if (!feature.title) errors.push(`Feature ${feature.id} missing title`);
    if (!feature.category) errors.push(`Feature ${feature.id} missing category`);
  });

  // Check for duplicate IDs
  const ids = new Set<string>();
  Features.forEach((feature) => {
    if (ids.has(feature.id)) {
      errors.push(`Duplicate feature id: ${feature.id}`);
    }
    ids.add(feature.id);
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export all settings for use in build pipeline
 */
export default {
  getSettingsConfiguration,
  getSettingsDefaults,
  getFeatureSettings,
  getSettingsByCategory,
  getCategoryMetadata,
  validateSettings,
};

import { getEditorTitleFeatures } from './common/features';
import { generateEditorTitleMenus } from './common/manifest';

export interface EditorTitleMenuItem {
  command: string;
  title: string;
  icon?: string;
  when?: string;
  group?: string;
}

export function getEditorTitleMenuItems() {
  return generateEditorTitleMenus(getEditorTitleFeatures());
}

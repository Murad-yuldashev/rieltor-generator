/**
 * One translation bundle for a single i18next namespace, in all three languages.
 * Every FSD slice that has user-facing text exports one of these; resources.ts
 * merges them into the i18next resource tree. Keys are flat strings (keySeparator
 * is off), looked up as `t('key')` within the slice's namespace, or
 * `t('ns:key')` across namespaces.
 */
export interface I18nBundle {
  ns: string;
  uz: Record<string, string>;
  ru: Record<string, string>;
  en: Record<string, string>;
}

/**
 * The settings sections now live in the sidebar (see app-shell/shell.tsx),
 * so pages keep calling this but nothing renders at the top of the page.
 */
export function SettingsNav(_props: { active: string }) {
  void _props;
  return null;
}

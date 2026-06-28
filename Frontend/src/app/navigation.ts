/** Screens removed from navigation (deprecated components kept on disk). */
export const DEPRECATED_SCREENS = new Set([
  'ai-suggestions',
  'all-projects',
  'ai-analytics',
  'admin-departments',
  'admin-ai-reports',
  'admin-approvals',
  'admin-analytics',
  'admin-settings',
]);

export function resolveScreenForRole(
  screen: string | null,
  role: 'student' | 'professor' | 'admin' | null
): string {
  if (!screen || DEPRECATED_SCREENS.has(screen)) {
    if (role === 'admin') return 'admin-dashboard';
    if (role) return 'dashboard';
    return 'login';
  }
  return screen;
}

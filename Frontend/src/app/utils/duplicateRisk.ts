export function duplicateRiskFromSimilarity(similarity: number | null | undefined): string {
  if (similarity == null) return 'LOW';
  if (similarity >= 75) return 'HIGH';
  if (similarity >= 60) return 'MEDIUM';
  return 'LOW';
}

export function duplicateRiskBadgeClass(risk: string): string {
  const r = risk.toUpperCase();
  if (r === 'HIGH') return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
  if (r === 'MEDIUM') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
  return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
}

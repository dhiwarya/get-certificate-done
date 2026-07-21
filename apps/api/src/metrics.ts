type Rankable = { recentCompletions: number; lastCompletionAt: Date | null; name: string };

export function sortRanking<T extends Rankable>(rows: T[]) {
  return [...rows].sort((a, b) => b.recentCompletions - a.recentCompletions
    || (b.lastCompletionAt?.getTime() ?? 0) - (a.lastCompletionAt?.getTime() ?? 0)
    || a.name.localeCompare(b.name));
}

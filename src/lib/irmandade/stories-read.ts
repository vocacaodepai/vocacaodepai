// Anônimo lê 1 história por navegador (doc 09 §3.2); a 2ª pede /entrar?next=.
const KEY = "vocacao-de-pai-stories-read";

export function getReadStoryIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function markStoryRead(id: string): string[] {
  const ids = getReadStoryIds();
  if (!ids.includes(id)) {
    ids.push(id);
    try {
      localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {
      /* storage indisponível */
    }
  }
  return ids;
}

export function canReadAnonymousStory(id: string): boolean {
  const read = getReadStoryIds();
  return read.length === 0 || read.includes(id);
}

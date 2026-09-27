import { z } from 'zod';

import { snapshotSchema, type SavedRepoSnapshot } from './snapshot.schema';

/** The persisted part of the store: snapshots and their order. */
export interface SavedRepos {
  byId: Record<string, SavedRepoSnapshot>;
  /** Repo ids, most recently saved first. */
  order: number[];
  /** Lowercased `owner/name` → id, so Details can find a snapshot from its route. */
  idByFullName: Record<string, number>;
}

const persistedShape = z.object({
  byId: z.record(z.string(), z.unknown()),
  order: z.array(z.number()),
});

export const fullNameKey = (fullName: string) => fullName.toLowerCase();

/**
 * Rebuilds saved repos from storage, one entry at a time: an entry that no
 * longer validates is dropped (and counted), never crashing the app or
 * taking the other entries with it (ADR-0020).
 */
export function restoreSaved(persisted: unknown): {
  saved: SavedRepos;
  dropped: number;
} {
  const empty = { byId: {}, order: [], idByFullName: {} };
  const shape = persistedShape.safeParse(persisted);
  if (!shape.success) {
    return { saved: empty, dropped: persisted === undefined ? 0 : 1 };
  }

  const saved: SavedRepos = empty;
  let dropped = 0;
  for (const id of new Set(shape.data.order)) {
    const entry = snapshotSchema.safeParse(shape.data.byId[String(id)]);
    if (!entry.success || entry.data.repo.id !== id) {
      dropped += 1;
      continue;
    }
    saved.byId[String(id)] = entry.data;
    saved.order.push(id);
    saved.idByFullName[fullNameKey(entry.data.repo.fullName)] = id;
  }
  return { saved, dropped };
}

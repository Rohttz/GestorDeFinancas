import AsyncStorage from '@react-native-async-storage/async-storage';

const METADATA_PREFIX = 'metadata:';

async function readAll<T>(entity: string): Promise<Record<string, T>> {
  try {
    const raw = await AsyncStorage.getItem(`${METADATA_PREFIX}${entity}`);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, T>;
  } catch (error) {
    console.warn(`metadata:readAll failed for ${entity}`, error);
    return {};
  }
}

async function writeAll<T>(entity: string, data: Record<string, T>): Promise<void> {
  await AsyncStorage.setItem(`${METADATA_PREFIX}${entity}`, JSON.stringify(data));
}

export async function getAllMetadata<T>(entity: string): Promise<Record<string, T>> {
  return readAll<T>(entity);
}

export async function getMetadata<T>(entity: string, id: string): Promise<T | undefined> {
  const all = await readAll<T>(entity);
  return all[id];
}

export async function upsertMetadata<T extends object>(entity: string, id: string, value: T): Promise<void> {
  const all = await readAll<T>(entity);
  all[id] = { ...(all[id] as object | undefined), ...value } as T;
  await writeAll(entity, all);
}

export async function replaceMetadata<T extends object>(entity: string, id: string, value: T): Promise<void> {
  const all = await readAll<T>(entity);
  all[id] = value;
  await writeAll(entity, all);
}

export async function deleteMetadata(entity: string, id: string): Promise<void> {
  const all = await readAll(entity);
  if (all[id] === undefined) {
    return;
  }
  delete all[id];
  await writeAll(entity, all);
}

export type ExportedStoragePayloadV1 = {
  version: 1;
  exportedAt: string;
  keys: Record<string, string | null>;
};

const KEY_PREFIX = 'riskms_';

export const getRiskMsStorageKeys = (): string[] => {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith(KEY_PREFIX)) keys.push(key);
  }
  keys.sort();
  return keys;
};

export const exportRiskMsStorage = (): ExportedStoragePayloadV1 => {
  const keys = getRiskMsStorageKeys();
  const payload: ExportedStoragePayloadV1 = {
    version: 1,
    exportedAt: new Date().toISOString(),
    keys: {},
  };

  for (const key of keys) {
    payload.keys[key] = localStorage.getItem(key);
  }

  return payload;
};

export const importRiskMsStorage = (payload: unknown) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid import file');
  }

  const anyPayload = payload as Partial<ExportedStoragePayloadV1>;
  if (anyPayload.version !== 1) {
    throw new Error('Unsupported import version');
  }
  if (!anyPayload.keys || typeof anyPayload.keys !== 'object') {
    throw new Error('Invalid import payload');
  }

  const keys = anyPayload.keys as Record<string, unknown>;
  for (const [key, value] of Object.entries(keys)) {
    if (!key.startsWith(KEY_PREFIX)) continue;

    if (value === null) {
      localStorage.removeItem(key);
      continue;
    }

    if (typeof value !== 'string') {
      throw new Error(`Invalid value for key: ${key}`);
    }

    localStorage.setItem(key, value);
  }
};

export const clearRiskMsStorage = () => {
  const keys = getRiskMsStorageKeys();
  for (const key of keys) {
    localStorage.removeItem(key);
  }
};

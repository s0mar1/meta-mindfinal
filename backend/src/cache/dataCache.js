import NodeCache from 'node-cache';
export const tftCache = new NodeCache({ stdTTL: 3600 });

export function getCachedTFT(version) {
  const key = version || 'latest';
  return tftCache.get(key);
}

export function setCachedTFT(version, payload) {
  const key = version || 'latest';
  tftCache.set(key, payload);
}

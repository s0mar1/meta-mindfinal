import NodeCache from 'node-cache';
export const tftCache = new NodeCache({ stdTTL: 3600 });

export function getCachedTFT(version) {
  return tftCache.get(version);
}

export function setCachedTFT(version, payload) {
  tftCache.set(version, payload);
}

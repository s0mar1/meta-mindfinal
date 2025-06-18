import NodeCache from 'node-cache';
export const matchCache = new NodeCache({ stdTTL: 600 });

import axios from 'axios';
import { fetchPatchVersion } from './patchService.js';
import { getCachedTFT, setCachedTFT } from '../cache/dataCache.js';

export async function loadTFTData(version) {
  if (!version) {
    version = await fetchPatchVersion();
  }

  const cached = getCachedTFT(version);
  if (cached) return cached;

  const [champRes, itemRes] = await Promise.all([
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champions.json`),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-items.json`)
  ]);

  const champions = Object.values(champRes.data.data).map(c => ({
    apiName: c.apiName,
    name: c.name,
    icon: c.icon.replace(/\.tex$/i, '.png'),
    cost: c.cost,
    tileIcon: c.icon.replace(/\.tex$/i, '.png'),
  }));

  const items = Object.values(itemRes.data.data).map(i => ({
    apiName: i.apiName,
    name: i.name,
    icon: i.icon.replace(/\.tex$/i, '.png')
  }));

  const payload = { champions, items };
  setCachedTFT(version, payload);
  return payload;
}

import axios from 'axios';
import { getCachedTFT, setCachedTFT } from '../cache/dataCache.js';

const COMMUNITY_DRAGON_BASE = 'https://raw.communitydragon.org';
const TFT_PATH = 'cdragon/tft';

// Following the repository guidelines from AGENTS.md

/** 항상 최신 버전 데이터를 가져옵니다 */
export async function getTFTData() {
  const version = 'latest';

  const cached = getCachedTFT(version);
  if (cached) return cached;

  const [champRes, itemRes] = await Promise.all([
    axios.get(`${COMMUNITY_DRAGON_BASE}/${version}/${TFT_PATH}/champions.json`),
    axios.get(`${COMMUNITY_DRAGON_BASE}/${version}/${TFT_PATH}/items.json`)
  ]);

  const toPng = p => (p ? p.replace(/\.tex$/i, '.png') : p);

  const champions = champRes.data.map(c => ({
    apiName: c.apiName || c.characterName || c.character_id,
    name: c.name,
    icon: toPng(c.icon || c.squareIconPath),
    cost: c.cost ?? c.rarity,
    tileIcon: toPng(c.squareIcon || c.icon || c.squareIconPath)
  }));

  const items = itemRes.data.map(i => ({
    apiName: i.apiName || i.id,
    name: i.name,
    icon: toPng(i.icon)
  }));

  const payload = { champions, items };
  setCachedTFT(version, payload);
  return payload;
}

// 이전 코드와의 호환성을 위해 남겨둡니다
export const loadTFTData = getTFTData;

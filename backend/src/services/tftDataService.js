/**
 *  TFTDataService – Riot DD + Community Dragon 머지 (champ/trait/item)
 *  - memory-cache 직접 사용
 */

import axios from 'axios';
import deepmerge from 'deepmerge';
import cache from 'memory-cache';

const DD_VERSION_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const DD_BASE = (v) => `https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US`;
const DD_CHAMP_JSON = (v) => `${DD_BASE(v)}/tft-champion.json`;
const DD_TRAIT_JSON = (v) => `${DD_BASE(v)}/tft-trait.json`;
const DD_ITEM_JSON  = (v) => `${DD_BASE(v)}/tft-item.json`;

const CDRAGON_CHAMP_JSON = 'https://raw.communitydragon.org/latest/json/tft/champions.json';
const CDRAGON_TRAIT_JSON = 'https://raw.communitydragon.org/latest/json/tft/traits.json';
const CDRAGON_ITEM_JSON  = 'https://raw.communitydragon.org/latest/json/tft/items.json';

const champIcon = (key) =>
  `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${key}.png`;
const traitIcon = (name) =>
  `https://raw.communitydragon.org/latest/game/assets/ux/tft/traits/${name}.png`;
const itemIcon = (apiName) =>
  `https://raw.communitydragon.org/latest/game/assets/maps/tft/icons/hexcore/${apiName.toLowerCase()}.png`;

const mergeDeep = (a, b) =>
  deepmerge(a, b, { arrayMerge: (_, src) => src });

async function fetchJson(url) {
  try {
    const { data } = await axios.get(url, { timeout: 10_000 });
    return data;
  } catch {
    console.warn('[TFT] fetch fail', url);
    return null;
  }
}

export async function getTFTData(forceRefresh = false) {
  const cacheKey = 'TFT_FULL_DATA';
  if (!forceRefresh && cache.get(cacheKey)) return cache.get(cacheKey);

  /* 1) 최신 DD 버전 */
  const vers = await fetchJson(DD_VERSION_URL);
  const latest = vers ? vers[0] : '15.12.1';

  const [ddChampRaw, ddTraitRaw, ddItemRaw] = await Promise.all([
    fetchJson(DD_CHAMP_JSON(latest)),
    fetchJson(DD_TRAIT_JSON(latest)),
    fetchJson(DD_ITEM_JSON(latest)),
  ]);

  let champions = ddChampRaw?.data ? Object.values(ddChampRaw.data) : [];
  let traits    = ddTraitRaw?.data ? Object.values(ddTraitRaw.data) : [];
  let items     = ddItemRaw?.data  ? Object.values(ddItemRaw.data)  : [];

  /* 2) CDragon 보강 */
  const [cdChamp, cdTrait, cdItem] = await Promise.all([
    fetchJson(CDRAGON_CHAMP_JSON),
    fetchJson(CDRAGON_TRAIT_JSON),
    fetchJson(CDRAGON_ITEM_JSON),
  ]);

  if (cdChamp) {
    champions = champions.map((c) => {
      const extra = cdChamp.find((x) => x.apiName === c.apiName);
      let merged  = extra ? mergeDeep(c, extra) : c;
      if (!merged.icon) merged.icon = champIcon(merged.apiName.toLowerCase());
      if (!('cost' in merged)) merged.cost = extra?.cost ?? merged.tier ?? 0;
      return merged;
    });
  }

  if (cdTrait) {
    traits = traits.map((t) => {
      const extra = cdTrait.find((x) => x.apiName === t.apiName);
      let merged  = extra ? mergeDeep(t, extra) : t;
      if (!merged.icon) merged.icon = traitIcon(merged.apiName.toLowerCase());
      if (!merged.sets?.length && extra?.sets?.length) merged.sets = extra.sets;
      return merged;
    });
  }

  if (cdItem) {
    items = items.length ? items : cdItem;         // DD 없으면 CDragon 전부 사용
    items = items.map((it) => ({
      ...it,
      icon: it.icon || itemIcon(it.apiName),
    }));
  }

  if (!champions.length || !traits.length || !items.length)
    throw new Error('TFT 데이터 로드 실패: champs/traits/items 비어 있음');

  const payload = { version: latest, champions, traits, items };
  cache.put(cacheKey, payload, 1000 * 60 * 60 * 12); // 12시간
  return payload;
}

/* ──────────────────────────────────────────────── */
/*  summoner.js / match.js 호환용 export            */
export const loadTFTData = getTFTData;

/**
 * getCorrectTraitStyle(apiName, unitCnt, tftData)
 * - unitCnt(필드 num_units) 에 맞는 스타일 계산
 */
export function getCorrectTraitStyle(apiName, unitCnt, tftData) {
  const styleMap = { bronze: 1, silver: 2, gold: 3, chromatic: 4, prismatic: 4 };
  const trait = tftData.traits.find((t) => t.apiName === apiName);
  if (!trait) return { styleName: 'none', styleOrder: 0 };

  let styleName = 'none';
  let styleOrder = 0;
  (trait.sets || trait.levels || trait.tiers || []).forEach((lv) => {
    if (unitCnt >= lv.min) {
      styleName = lv.style.toLowerCase();
      styleOrder = styleMap[styleName] || 0;
    }
  });
  return { styleName, styleOrder };
}

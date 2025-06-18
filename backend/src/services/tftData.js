import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// TFT 데이터 캐시
const dataCache = new Map();

// Riot Data Dragon & CommunityDragon
const DD_REALM_URL = 'https://ddragon.leagueoflegends.com/realms/kr.json';
const DD_BASE_URL = 'https://ddragon.leagueoflegends.com/cdn';
const CDRAGON_BASE_URL = 'https://raw.communitydragon.org';

const PATCH_OVERRIDE = process.env.TFT_PATCH_VERSION;
const ASSET_SOURCE = process.env.TFT_ASSET_SOURCE || 'ddragon';

// 리전별 TFT 패치 버전 조회
async function fetchPatchVersion() {
  const { data: realm } = await axios.get(DD_REALM_URL);
  return realm.n['tft-item'] || realm.n.item;
}

// CommunityDragon에서 augment 페일백
async function fetchCdragonAugments(patchVersion) {
  const url = `${CDRAGON_BASE_URL}/${patchVersion}/cdragon/tft/en_us.json`;
  let cdragon;
  try {
    const res = await axios.get(url);
    cdragon = res.data;
  } catch (e) {
    console.warn(`[TFT Service] CommunityDragon fetch failed for patch ${patchVersion}: ${e.message}`);
    return {};
  }

  // 세트별 augments 찾기
  let augArray = [];
  if (cdragon.sets) {
    const validSets = Object.keys(cdragon.sets).filter(
      k => Array.isArray(cdragon.sets[k].augments)
    );
    if (validSets.length) {
      const latestSet = validSets.sort((a, b) => parseInt(b) - parseInt(a))[0];
      augArray = cdragon.sets[latestSet].augments;
    }
  }
  // root-level augments
  if (!augArray.length && Array.isArray(cdragon.augments)) {
    augArray = cdragon.augments;
  }
  if (!augArray.length) {
    console.warn('[TFT Service] No augments found in CommunityDragon fallback');
    return {};
  }

  return augArray.reduce((map, aug) => {
    const fileName = aug.icon.split('/').pop();
    map[aug.apiName] = {
      id: aug.apiName,
      name: aug.displayName,
      description: aug.description,
      image: { full: fileName }
    };
    return map;
  }, {});
}

// TFT 메타데이터 로드 및 가공
async function getTFTData() {
  const patchVersion = PATCH_OVERRIDE || await fetchPatchVersion();
  if (dataCache.has(patchVersion)) return dataCache.get(patchVersion);

  console.log(`[TFT Service] Loading data for patch ${patchVersion} (assets: ${ASSET_SOURCE})`);

  const endpoints = [
    { type: 'item',     locale: 'en_US', path: 'tft-item.json'   },
    { type: 'item',     locale: 'ko_KR', path: 'tft-item.json'   },
    { type: 'champion', locale: 'en_US', path: 'tft-champion.json' },
    { type: 'champion', locale: 'ko_KR', path: 'tft-champion.json' },
    { type: 'trait',    locale: 'en_US', path: 'tft-trait.json'    },
    { type: 'trait',    locale: 'ko_KR', path: 'tft-trait.json'    },
    { type: 'augment',  locale: 'en_US', path: 'tft-augment.json', optional: true },
    { type: 'augment',  locale: 'ko_KR', path: 'tft-augment.json', optional: true }
  ];

  const responses = {};

  await Promise.all(endpoints.map(async ({ type, locale, path, optional }) => {
    const url = `${DD_BASE_URL}/${patchVersion}/data/${locale}/${path}`;
    try {
      const res = await axios.get(url);
      responses[`${type}_${locale}`] = res.data.data;
    } catch (error) {
      if (optional) {
        console.warn(`[TFT Service] Optional missing ${type} ${locale}: ${error.message}`);
        responses[`${type}_${locale}`] = {};
      } else {
        throw new Error(`Failed to load ${type} ${locale}: ${error.message}`);
      }
    }
  }));

  // augment en_US 페일백
  if (!Object.keys(responses['augment_en_US'] || {}).length) {
    console.log('[TFT Service] Fallback to CommunityDragon augments');
    const cdrAug = await fetchCdragonAugments(patchVersion);
    responses['augment_en_US'] = cdrAug;
    responses['augment_ko_KR'] = {};
  }

  const getImageUrl = (type, fileName) => {
    if (ASSET_SOURCE === 'cdragon') {
      return `${CDRAGON_BASE_URL}/${patchVersion}/cdragon/tft/${fileName}`;
    }
    return type === 'augment'
      ? `${CDRAGON_BASE_URL}/${patchVersion}/cdragon/tft/${fileName}`
      : `${DD_BASE_URL}/${patchVersion}/img/tft-${type}/${fileName}`;
  };

  // 데이터 가공 헬퍼
  function process(type) {
    const enData = responses[`${type}_en_US`] || {};
    const krData = responses[`${type}_ko_KR`] || {};
    return Object.values(enData).map(item => ({
      apiName:     item.id,
      name:        krData[item.id]?.name ?? item.name,
      description: krData[item.id]?.description ?? item.description,
      icon:        getImageUrl(type, item.image.full),
      ...item
    }));
  }

  const items     = process('item');
  const champions = process('champion');
  const traits    = process('trait');
  const augments  = process('augment');

  const processed = { patchVersion, items, champions, traits, augments };
  dataCache.set(patchVersion, processed);

  console.log(`[TFT Service] Data ready for patch ${patchVersion}`);
  return processed;
}

export default getTFTData;

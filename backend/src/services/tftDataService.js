// backend/src/services/tftDataService.js
import axios from 'axios';
import { tftCache, getCachedTFT, setCachedTFT } from '../cache/dataCache.js';
import dotenv from 'dotenv';
dotenv.config();

// Community Dragon 기본 URL
const CDRAGON_BASE_URL = 'https://raw.communitydragon.org';
const CDRAGON_GAME_DATA_PATH = `${CDRAGON_BASE_URL}/latest/plugins/rcp-be-lol-game-data/global/default/v1`;
const CDRAGON_ASSET_PATH = `${CDRAGON_BASE_URL}/latest/game`;

// Data Dragon 기본 URL
const DDRAGON_VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';
const DDRAGON_CDN_URL = 'https://ddragon.leagueoflegends.com/cdn';

// TFT 에셋 소스 설정 (기본값: ddragon)
const TFT_ASSET_SOURCE = process.env.TFT_ASSET_SOURCE || 'ddragon';
console.log(`[TFTDataService] TFT_ASSET_SOURCE: ${TFT_ASSET_SOURCE}`);

let cachedTFTData = null;

// Riot 데이터의 style 숫자(1, 2, 3...)를 CSS 클래스에서 사용할 이름('bronze', 'silver'...)으로 변환합니다.
function getTraitStyleNameFromTier(style) {
    switch (style) {
        case 1: return 'bronze';
        case 2: return 'silver';
        case 3: return 'gold';
        case 4: return 'chromatic';
        case 5: return 'unique';
        default: return 'inactive';
    }
}

/**
 * 활성화된 유닛 수에 따라 정확한 특성 등급을 계산합니다.
 */
export const getCorrectTraitStyle = (apiName, num_units, tftData) => {
  const thresholds = tftData.traitThresholds[apiName];
  if (!thresholds || thresholds.length === 0) {
    return { styleName: 'inactive' };
  }
  let activeStyle = { styleName: 'inactive' };
  for (const threshold of thresholds) {
    if (num_units >= threshold.minUnits) {
      activeStyle = threshold;
    } else {
      if (threshold.minUnits > num_units) {
        activeStyle.nextThreshold = threshold.minUnits;
        activeStyle.nextStyle = threshold.styleName;
      }
      break; 
    }
  }
  return activeStyle;
};

// --- Community Dragon 데이터 로딩 ---
async function loadFromCommunityDragon() {
    console.log("[TFTDataService] Community Dragon에서 데이터를 불러옵니다...");
    
    const toCommunityDragonAbsoluteUrl = (path) => {
        if (!path) return null;
        return `${CDRAGON_ASSET_PATH}/${path.toLowerCase().replace('.tex', '.png')}`;
    };

    try {
        const [championRes, itemRes, traitRes, augmentRes] = await Promise.all([
            axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/champions.json`),
            axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/items.json`),
            axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/traits.json`),
            // 증강체 로딩은 선택 사항이므로, 실패해도 전체를 중단하지 않도록 catch합니다.
            axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/augments.json`).catch(err => {
                console.warn("[TFTDataService] Community Dragon에서 증강체 데이터 로드 실패. 증강체 정보가 누락될 수 있습니다:", err.message);
                return { data: [] }; // 실패 시 빈 배열 반환
            }),
        ]);

        const champions = championRes.data.map(c => ({
            ...c,
            apiName: c.apiName,
            name: c.name,
            icon: toCommunityDragonAbsoluteUrl(c.icon),
            tileIcon: toCommunityDragonAbsoluteUrl(c.tileIcon || c.icon),
        }));

        const items = itemRes.data.map(i => ({
            ...i,
            apiName: i.apiName,
            name: i.name,
            icon: toCommunityDragonAbsoluteUrl(i.icon),
        }));

        const traits = traitRes.data.map(t => ({
            ...t,
            apiName: t.apiName,
            name: t.name,
            icon: toCommunityDragonAbsoluteUrl(t.icon),
        }));

        const augments = augmentRes.data.map(a => ({
            ...a,
            apiName: a.apiName,
            name: a.name,
            icon: toCommunityDragonAbsoluteUrl(a.icon),
        }));

        const traitThresholds = {};
        traits.forEach(t => {
            if (t.effects && t.effects.length > 0) {
                traitThresholds[t.apiName] = t.effects.map(e => ({
                    minUnits: e.minUnits,
                    styleName: getTraitStyleNameFromTier(e.style),
                })).sort((a, b) => a.minUnits - b.minUnits);
            }
        });

        // 현재 세트 정보 (CDRagon은 'latest'이므로 직접 유추해야 함)
        // 챔피언 apiName에서 가장 많이 등장하는 세트 번호로 유추
        let currentSet = 'Unknown';
        if (champions.length > 0) {
            const setCounts = {};
            champions.forEach(c => {
                const match = c.apiName.match(/^TFT(\d+)_/);
                if (match) {
                    const setNum = match[1];
                    setCounts[setNum] = (setCounts[setNum] || 0) + 1;
                }
            });
            currentSet = Object.keys(setCounts).sort((a, b) => setCounts[b] - setCounts[a])[0] || 'Unknown';
        }

        const traitMap = new Map(traits.map(t => [t.apiName.toLowerCase(), t]));
        const krNameMap = new Map();
        champions.forEach(c => krNameMap.set(c.apiName.toLowerCase(), c.name));
        traits.forEach(t => krNameMap.set(t.apiName.toLowerCase(), t.name));
        items.forEach(i => krNameMap.set(i.apiName.toLowerCase(), i.name));
        augments.forEach(a => krNameMap.set(a.apiName.toLowerCase(), a.name));

        return {
            champions, items, traits, augments,
            traitThresholds,
            traitMap: Array.from(traitMap.entries()),
            krNameMap: Array.from(krNameMap.entries()),
            version: 'latest', // Community Dragon은 'latest' 고정
            currentSet,
        };

    } catch (error) {
        console.error("[TFTDataService] Community Dragon 데이터 로드 실패. 서버 시작을 중단합니다:", error.message);
        throw new Error("Community Dragon에서 TFT 데이터를 가져오는 데 실패했습니다.");
    }
}

// --- Data Dragon 데이터 로딩 및 버전 소급 로직 ---
async function loadFromDataDragonRecursive() {
    console.log("[TFTDataService] Data Dragon에서 데이터를 불러옵니다 (버전 소급 포함)...");

    let versions;
    let latestTFTVersion; // 실제 TFT 데이터에 사용할 버전
    try {
        const versionsRes = await axios.get(DDRAGON_VERSIONS_URL);
        versions = versionsRes.data;

        // TFT 버전은 LoL 버전과 다르게 특정 패턴을 따르거나, versions[0]이 아닐 수 있음.
        // 현재 롤토체스 세트 14에 맞춰, 14로 시작하는 가장 최신 버전을 찾거나,
        // Riot이 TFT 전용 버전을 따로 명시하는 경우를 대비하여 유연하게 처리합니다.
        // 예를 들어, TFT Data Dragon의 versions.json은 `tft-set{N}.{patch}` 형태일 수 있습니다.
        // 일반 League of Legends versions.json의 첫 번째 요소는 LoL 버전.
        // tft-set-version.json 같은 것이 있다면 더 좋겠지만, 현재는 versions.json 사용.
        // 롤체 세트 14 기준으로, 14.x.y 형태의 버전을 우선 사용.
        latestTFTVersion = versions.find(v => v.startsWith('14.')) || versions[0];
        console.log(`[TFTDataService] 확인된 TFT Data Dragon 최신 버전: ${latestTFTVersion}`);
    } catch (error) {
        console.error("[TFTDataService] Data Dragon 버전 목록 로드 실패:", error.message);
        throw new Error("Data Dragon 버전 목록을 가져오는 데 실패했습니다.");
    }

    const toDataDragonAbsoluteUrl = (version, type, imageName) => {
        if (!imageName) return null;
        // Data Dragon TFT 에셋 이미지 URL 패턴:
        // champion: .../img/champion/{image.full}
        // item: .../img/item/{image.full}
        // trait: .../img/trait/{image.full}
        return `${DDRAGON_CDN_URL}/${version}/img/${type}/${imageName}`;
    };

    // 특정 에셋을 최신 버전부터 거슬러 올라가며 찾는 재귀 함수
    async function fetchAssetRecursive(type, assetId, versionsArray, currentIndex = 0) {
        if (currentIndex >= versionsArray.length) {
            // console.warn(`[TFTDataService] 에셋 '${assetId}' (${type})를 어떤 버전에서도 찾을 수 없습니다.`);
            return null;
        }

        const currentVersion = versionsArray[currentIndex];
        // TFT Data Dragon 데이터 파일 경로: tft-champion.json, tft-item.json, tft-trait.json
        const dataUrl = `${DDRAGON_CDN_URL}/${currentVersion}/data/ko_KR/tft-${type}.json`;

        try {
            const response = await axios.get(dataUrl);
            const data = response.data.data; // 실제 데이터는 .data 필드 아래에 있음
            const asset = Object.values(data).find(item => item.id === assetId);

            if (asset) {
                const icon = toDataDragonAbsoluteUrl(currentVersion, type, asset.image.full);
                const tileIcon = (type === 'champion') ? icon : null; // Data Dragon 챔피언은 tileIcon 필드 없음
                return { ...asset, apiName: asset.id, icon, tileIcon, _foundVersion: currentVersion };
            } else {
                return await fetchAssetRecursive(type, assetId, versionsArray, currentIndex + 1);
            }
        } catch (error) {
            if (error.response && error.response.status === 404) {
                // console.log(`[TFTDataService] 버전 ${currentVersion}에서 ${type} 데이터 파일을 찾을 수 없습니다. 다음 버전으로 시도...`);
                return await fetchAssetRecursive(type, assetId, versionsArray, currentIndex + 1);
            }
            console.error(`[TFTDataService] 버전 ${currentVersion}에서 ${type} 데이터 로드 중 오류:`, error.message);
            throw error;
        }
    }

    // 최신 Data Dragon의 전체 챔피언, 아이템, 특성 ID 목록을 가져옵니다.
    // 만약 이 단계에서 실패하면, Community Dragon에서 ID 목록을 가져와 대체합니다.
    let championsRawIds = [];
    let itemsRawIds = [];
    let traitsRawIds = [];
    try {
        const [championsRes, itemsRes, traitsRes] = await Promise.all([
            axios.get(`${DDRAGON_CDN_URL}/${latestTFTVersion}/data/ko_KR/tft-champion.json`),
            axios.get(`${DDRAGON_CDN_URL}/${latestTFTVersion}/data/ko_KR/tft-item.json`),
            axios.get(`${DDRAGON_CDN_URL}/${latestTFTVersion}/data/ko_KR/tft-trait.json`),
        ]);
        championsRawIds = Object.values(championsRes.data.data).map(c => c.id);
        itemsRawIds = Object.values(itemsRes.data.data).map(i => i.id);
        traitsRawIds = Object.values(traitsRes.data.data).map(t => t.id);
    } catch (e) {
        console.warn(`[TFTDataService] 최신 Data Dragon (${latestTFTVersion}) ID 목록 로드 실패. Community Dragon에서 대체 로드합니다:`, e.message);
        try {
            const cdragonChampRes = await axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/champions.json`);
            const cdragonItemRes = await axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/items.json`);
            const cdragonTraitRes = await axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/traits.json`);
            championsRawIds = cdragonChampRes.data.map(c => c.apiName);
            itemsRawIds = cdragonItemRes.data.map(i => i.apiName);
            traitsRawIds = cdragonTraitRes.data.map(t => t.apiName);
            console.log("[TFTDataService] Community Dragon에서 에셋 ID 목록 대체 로드 성공.");
        } catch (cdragonErr) {
            console.error("[TFTDataService] Community Dragon ID 로드도 실패했습니다. 데이터 로드가 불가능합니다.", cdragonErr.message);
            throw new Error("TFT 에셋 ID를 가져올 수 없습니다. 인터넷 연결 또는 Data/Community Dragon API 상태를 확인하세요.");
        }
    }

    // 각 ID에 대해 재귀적으로 데이터 드래곤 버전을 거슬러 올라가며 데이터 로드
    const championsPromises = championsRawIds.map(id => fetchAssetRecursive('champion', id, versions));
    const itemsPromises = itemsRawIds.map(id => fetchAssetRecursive('item', id, versions));
    const traitsPromises = traitsRawIds.map(id => fetchAssetRecursive('trait', id, versions));

    const [champions, items, traits] = await Promise.all([
        Promise.all(championsPromises),
        Promise.all(itemsPromises),
        Promise.all(traitsPromises),
    ]);

    const filteredChampions = champions.filter(Boolean);
    const filteredItems = items.filter(Boolean);
    const filteredTraits = traits.filter(Boolean);

    // Data Dragon은 TFT Augments를 제공하지 않으므로, Community Dragon에서 가져옵니다.
    let augments = [];
    try {
        const augmentRes = await axios.get(`${CDRAGON_GAME_DATA_PATH}/tft/augments.json`);
        const toCommunityDragonAbsoluteUrl = (path) => {
            if (!path) return null;
            return `${CDRAGON_ASSET_PATH}/${path.toLowerCase().replace('.tex', '.png')}`;
        };
        augments = augmentRes.data.map(a => ({
            ...a,
            apiName: a.apiName,
            name: a.name,
            icon: toCommunityDragonAbsoluteUrl(a.icon),
        }));
    } catch (error) {
        console.warn("[TFTDataService] Data Dragon 모드에서 증강체(Augments) 데이터를 Community Dragon에서 가져오는 데 실패했습니다. 증강체 정보가 누락될 수 있습니다:", error.message);
    }

    const traitThresholds = {};
    filteredTraits.forEach(t => {
        if (t.effects && t.effects.length > 0) {
            traitThresholds[t.apiName] = t.effects.map(e => ({
                minUnits: e.min_units || e.minUnits,
                styleName: getTraitStyleNameFromTier(e.style),
            })).sort((a, b) => a.minUnits - b.minUnits);
        }
    });

    let currentSet = 'Unknown';
    if (filteredChampions.length > 0) {
        const setCounts = {};
        filteredChampions.forEach(c => {
            const match = c.apiName.match(/^TFT(\d+)_/);
            if (match) {
                const setNum = match[1];
                setCounts[setNum] = (setCounts[setNum] || 0) + 1;
            }
        });
        currentSet = Object.keys(setCounts).sort((a, b) => setCounts[b] - setCounts[a])[0] || 'Unknown';
    }


    const traitMap = new Map(filteredTraits.map(t => [t.apiName.toLowerCase(), t]));
    const krNameMap = new Map();
    filteredChampions.forEach(c => krNameMap.set(c.apiName.toLowerCase(), c.name));
    filteredTraits.forEach(t => krNameMap.set(t.apiName.toLowerCase(), t.name));
    filteredItems.forEach(i => krNameMap.set(i.apiName.toLowerCase(), i.name));
    augments.forEach(a => krNameMap.set(a.apiName.toLowerCase(), a.name));


    return {
        champions: filteredChampions,
        items: filteredItems,
        traits: filteredTraits,
        augments,
        traitThresholds,
        traitMap: Array.from(traitMap.entries()),
        krNameMap: Array.from(krNameMap.entries()),
        version: latestTFTVersion, // Data Dragon의 최신 TFT 버전
        currentSet,
    };
}


/**
 * TFT 정적 데이터를 로드하고 캐싱하는 메인 함수
 */
export async function loadTFTData() {
    const cacheKey = TFT_ASSET_SOURCE;
    cachedTFTData = getCachedTFT(cacheKey);
    
    if (cachedTFTData) {
        console.log(`[TFTDataService] TFT 데이터를 캐시에서 불러옵니다 (${TFT_ASSET_SOURCE}).`);
        // 캐시된 데이터의 Map을 다시 Map 객체로 변환
        cachedTFTData.traitMap = new Map(cachedTFTData.traitMap);
        cachedTFTData.krNameMap = new Map(cachedTFTData.krNameMap);
        return cachedTFTData;
    }
    
    console.log(`[TFTDataService] TFT 데이터 로딩 시작: ${TFT_ASSET_SOURCE} 사용...`);
    let payload;
    try {
        if (TFT_ASSET_SOURCE === 'cdragon') {
            payload = await loadFromCommunityDragon();
        } else {
            payload = await loadFromDataDragonRecursive();
        }

        // 핵심 데이터 (champions, items, traits)가 비어있으면 오류로 간주
        if (!payload.champions || payload.champions.length === 0 ||
            !payload.items || payload.items.length === 0 ||
            !payload.traits || payload.traits.length === 0) {
            throw new Error("핵심 TFT 정적 데이터(챔피언, 아이템, 특성)를 로드하는 데 실패했습니다. 배열이 비어있습니다.");
        }
        
        setCachedTFT(cacheKey, { // 캐시에 저장할 때는 Map을 배열로 변환
            ...payload,
            traitMap: Array.from(payload.traitMap),
            krNameMap: Array.from(payload.krNameMap),
        });
        console.log(`[TFTDataService] TFT 데이터 로딩 및 캐싱 완료 (${TFT_ASSET_SOURCE}).`);
        // 반환할 때는 Map 객체로 다시 변환
        payload.traitMap = new Map(payload.traitMap);
        payload.krNameMap = new Map(payload.krNameMap);
        return payload;

    } catch (error) {
        console.error("[TFTDataService] TFT 데이터 로딩 중 치명적인 오류 발생. 서버 시작을 중단합니다:", error);
        // 오류 발생 시 캐시를 비워 불완전한 데이터가 재사용되지 않도록 함
        tftCache.del(cacheKey); 
        throw new Error(`TFT 데이터 로딩 실패. TFT_ASSET_SOURCE: ${TFT_ASSET_SOURCE}. 오류: ${error.message}`);
    }
}
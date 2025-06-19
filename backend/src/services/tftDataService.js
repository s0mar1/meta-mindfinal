// backend/src/services/tftDataService.js
import path from 'path';
import { fileURLToPath } from 'url';

// fs 모듈은 더 이상 필요 없으므로 삭제합니다.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      break; 
    }
  }
  return activeStyle;
};

/**
 * [핵심 변경] 로컬 파일 대신 데이터 드래곤에서 직접 최신 데이터를 로드하는 비동기 함수
 */
export async function loadTFTData() {
  if (cachedTFTData) return cachedTFTData;
  
  try {
    console.log('[데이터 서비스] 라이엇 API에서 최신 패치 버전을 가져옵니다...');
    const versionsResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionsResponse.json();
    const latestVersion = versions[0];
    console.log(`[데이터 서비스] 확인된 최신 버전: ${latestVersion}`);

    const DATA_URL_BASE = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/ko_kr`;
    const IMAGE_URL_BASE = `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img`;

    console.log('[데이터 서비스] 최신 챔피언, 아이템, 특성 데이터를 다운로드합니다...');
    const [championsResponse, itemsResponse, traitsResponse] = await Promise.all([
        fetch(`${DATA_URL_BASE}/tft-champion.json`),
        fetch(`${DATA_URL_BASE}/tft-item.json`),
        fetch(`${DATA_URL_BASE}/tft-trait.json`)
    ]);

    const championsRaw = await championsResponse.json();
    const itemsRaw = await itemsResponse.json();
    const traitsRaw = await traitsResponse.json();
    console.log('[데이터 서비스] 데이터 다운로드 완료.');

    const championsData = Object.values(championsRaw.data);
    const itemsData = Object.values(itemsRaw.data);
    const traitsData = Object.values(traitsRaw.data);
    
    const traitThresholds = {};
    traitsData.forEach(t => {
      if (t.effects && t.effects.length > 0) {
        traitThresholds[t.id] = t.effects.map(e => ({
          minUnits: e.minUnits,
          styleName: getTraitStyleNameFromTier(e.style),
        })).sort((a, b) => a.minUnits - b.minUnits);
      }
    });
    
    const toAbsoluteUrl = (imageObject, type) => {
        if (!imageObject?.full) return null;
        return `${IMAGE_URL_BASE}/${type}/${imageObject.full}`;
    };

    const champions = championsData.map(c => ({ ...c, apiName: c.id, icon: toAbsoluteUrl(c.image, 'champion') }));
    const items = itemsData.map(i => ({ ...i, apiName: i.id, icon: toAbsoluteUrl(i.image, 'item') }));
    const traits = traitsData.map(t => ({ ...t, apiName: t.id, icon: toAbsoluteUrl(t.image, 'trait') }));
      
    const traitMap = new Map(traits.map(t => [t.apiName.toLowerCase(), t]));
    const krNameMap = new Map();
    champions.forEach(c => krNameMap.set(c.apiName.toLowerCase(), c.name));
    traits.forEach(t => krNameMap.set(t.apiName.toLowerCase(), t.name));

    cachedTFTData = {
        champions, items, traits, traitMap, krNameMap,
        traitThresholds,
        version: latestVersion,
    };
    
    console.log(`[데이터 서비스] 최신 데이터(${latestVersion}) 가공 및 캐싱 완료.`);
    return cachedTFTData;

  } catch (error) {
      console.error("치명적 오류: 데이터 드래곤에서 데이터를 가져오거나 가공하는 데 실패했습니다.", error);
      // 서버가 시작되지 못하도록 에러를 다시 던집니다.
      throw new Error("TFT 데이터 로딩 실패. 인터넷 연결 또는 라이엇 API 상태를 확인하세요.");
  }
}
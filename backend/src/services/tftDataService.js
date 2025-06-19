// backend/src/services/tftDataService.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LATEST_PATCH_VERSION = '15.12.1';
const BASE_DATA_PATH = path.join(__dirname, `../../tft-datadragon/${LATEST_PATCH_VERSION}/data/ko_kr`);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
// ⭐️ 이미지 URL 경로를 /img 까지만 지정합니다.
const BASE_IMAGE_URL = `${BACKEND_URL}/datadragon/${LATEST_PATCH_VERSION}/img`;

let cachedTFTData = null;

// 특성 등급별 배경 이미지 URL을 생성하는 함수
export const getTraitBackgroundUrl = (style) => {
    const styleNum = style > 4 ? 4 : style;
    // ⭐️ 실제 경로에 맞게 teamplanner_trait_hexes 폴더를 추가합니다.
    return `${BASE_IMAGE_URL}/teamplanner_trait_hexes/trait_hex_${styleNum}.png`;
};

export function loadTFTData() {
  if (cachedTFTData) return cachedTFTData;
  console.log(`[데이터 서비스] 로컬 데이터 드래곤 (${LATEST_PATCH_VERSION}) 파일을 로드합니다...`);

  try {
    const championsRaw = JSON.parse(fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-champion.json'), 'utf-8'));
    const itemsRaw = JSON.parse(fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-item.json'), 'utf-8'));
    const traitsRaw = JSON.parse(fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-trait.json'), 'utf-8'));

    // ======================= [핵심 수정] =======================
    // 모든 추측성 로직을 제거하고, JSON 데이터의 파일 이름을 그대로 사용합니다.
    const toAbsoluteUrl = (imageObject) => {
        if (!imageObject?.full) return null;
        // 하위 폴더를 추측하지 않고, 파일 이름만 사용합니다.
        const fileName = imageObject.full.toLowerCase();
        return `${BASE_IMAGE_URL}/${fileName}`;
    };

    const getTileIconUrl = (imageObject) => {
        if (!imageObject?.full) return null;
        let fileName = imageObject.full.toLowerCase();
        
        // '_square'만 추가하고, 다른 부분은 건드리지 않습니다.
        const extension = path.extname(fileName);
        const baseName = path.basename(fileName, extension);
        
        if (!baseName.endsWith('_square')) {
            fileName = `${baseName}_square${extension}`;
        }
        
        return `${BASE_IMAGE_URL}/${fileName}`;
    }
    // ==========================================================
    
    const championsData = Object.values(championsRaw.data).filter(c => c.id && c.id.startsWith('TFT14_'));
    const traitsData = Object.values(traitsRaw.data).filter(t => t.id && t.id.startsWith('Set14_'));
    const itemsData = Object.values(itemsRaw.data);
    
    const champions = championsData.map(c => ({
        ...c, apiName: c.id,
        icon: toAbsoluteUrl(c.image),
        tileIcon: getTileIconUrl(c.image) 
    }));
    const items = itemsData.map(i => ({ ...i, apiName: i.id, icon: toAbsoluteUrl(i.image) }));
    const traits = traitsData.map(t => ({ ...t, apiName: t.id, icon: toAbsoluteUrl(t.image) }));
      
    const traitMap = new Map(traits.map(t => [t.apiName.toLowerCase(), t]));
    const krNameMap = new Map();
    champions.forEach(c => krNameMap.set(c.apiName.toLowerCase(), c.name));
    traits.forEach(t => krNameMap.set(t.apiName.toLowerCase(), t.name));

    cachedTFTData = {
        champions, items, traits, traitMap, krNameMap,
        currentSet: '14',
    };
    
    console.log(`[데이터 서비스] 시즌 14 데이터 가공 완료. 챔피언 ${champions.length}개, 특성 ${traits.length}개 로드.`);
    return cachedTFTData;

  } catch (error) {
      console.error("치명적 오류: 로컬 데이터 파일을 읽거나 파싱하는 데 실패했습니다.", error);
      throw new Error("TFT 데이터 로딩 실패. 파일 이름과 경로를 확인하세요.");
  }
}
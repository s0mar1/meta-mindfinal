// backend/src/services/tftDataService.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LATEST_PATCH_VERSION = '15.12.1';
const BASE_DATA_PATH = path.join(__dirname, `../../tft-datadragon/${LATEST_PATCH_VERSION}/data/ko_kr`);
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const BASE_IMAGE_URL = `${BACKEND_URL}/datadragon/${LATEST_PATCH_VERSION}/img`;

let cachedTFTData = null;

// 특성 등급 배경 이미지 URL 생성 (이전과 동일)
export const getTraitBackgroundUrl = (style) => {
    const styleNum = style > 5 ? 5 : style;
    return `${BASE_IMAGE_URL}/teamplanner_trait_hexes/${styleNum}.png`;
};

export function loadTFTData() {
  if (cachedTFTData) return cachedTFTData;
  console.log(`[데이터 서비스] 로컬 데이터 드래곤 (${LATEST_PATCH_VERSION}) 파일을 로드합니다...`);

  try {
    const championsRaw = JSON.parse(fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-champion.json'), 'utf-8'));
    const itemsRaw = JSON.parse(fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-item.json'), 'utf-8'));
    const traitsRaw = JSON.parse(fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-trait.json'), 'utf-8'));

    // ======================= [핵심 수정: URL 생성 로직 단순화] =======================
    // 이제 이 함수는 추측하지 않고, JSON 데이터에 있는 group과 full 속성을 그대로 사용합니다.
    const toAbsoluteUrl = (imageObject) => {
        if (!imageObject?.full || !imageObject?.group) return null;
        const subfolder = imageObject.group.toLowerCase();
        const fileName = imageObject.full.toLowerCase();
        return `${BASE_IMAGE_URL}/${subfolder}/${fileName}`;
    };

    const getTileIconUrl = (imageObject) => {
        if (!imageObject?.full) return null;
        const subfolder = imageObject.group.toLowerCase();
        let fileName = imageObject.full.toLowerCase();
        // 사각형 아이콘 파일명 규칙만 정확히 적용
        if (fileName.includes('.tft_set')) {
            fileName = fileName.replace('.tft_set', '_square.tft_set');
        } else {
            const extension = path.extname(fileName);
            const baseName = path.basename(fileName, extension);
            if (!baseName.endsWith('_square')) {
                fileName = `${baseName}_square${extension}`;
            }
        }
        return `${BASE_IMAGE_URL}/${subfolder}/${fileName}`;
    };
    // ======================================================================

    // ======================= [핵심 수정: 모든 필터링 제거] =======================
    const championsData = Object.values(championsRaw.data);
    const traitsData = Object.values(traitsRaw.data);
    const itemsData = Object.values(itemsRaw.data);
    // ======================================================================
    
    const champions = championsData.map(c => ({...c, apiName: c.id, icon: toAbsoluteUrl(c.image), tileIcon: getTileIconUrl(c.image)}));
    const items = itemsData.map(i => ({...i, apiName: i.id, icon: toAbsoluteUrl(i.image)}));
    const traits = traitsData.map(t => ({...t, apiName: t.id, icon: toAbsoluteUrl(t.image)}));
      
    const traitMap = new Map(traits.map(t => [t.apiName.toLowerCase(), t]));
    const krNameMap = new Map();
    champions.forEach(c => krNameMap.set(c.apiName.toLowerCase(), c.name));
    traits.forEach(t => krNameMap.set(t.apiName.toLowerCase(), t.name));

    cachedTFTData = { champions, items, traits, traitMap, krNameMap, currentSet: '14' };
    
    console.log(`[데이터 서비스] 전체 데이터 가공 완료. 챔피언 ${champions.length}개, 특성 ${traits.length}개 로드.`);
    return cachedTFTData;

  } catch (error) {
      console.error("치명적 오류: 로컬 데이터 파일을 읽거나 파싱하는 데 실패했습니다.", error);
      throw new Error("TFT 데이터 로딩 실패. 파일 이름과 경로를 확인하세요.");
  }
}
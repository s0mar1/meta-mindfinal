// backend/src/services/tftDataService.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 패치 버전과 데이터 경로 설정
const LATEST_PATCH_VERSION = '15.12.1';
const BASE_DATA_PATH = path.join(
  __dirname,
  `../../tft-datadragon/${LATEST_PATCH_VERSION}/data/ko_kr`
);

// 서버 주소 및 이미지 제공 베이스 URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';
const BASE_IMAGE_URL = `${BACKEND_URL}/datadragon/img`;

// 로컬에 캐시된 데이터
let cachedTFTData = null;

/**
 * 파일명과 그룹(tft-champion, tft-item, tft-trait)을 받아
 * 서버의 정적 라우트로 연결되는 절대 URL을 반환
 */
function toAbsoluteUrl(fileName, group) {
  if (!fileName || !group) return null;
  // 파일명 소문자 PNG 확장자로 통일
  const name = path.basename(fileName).toLowerCase().replace(/\.(dds|tex)$/, '.png');
  // 그룹별 폴더명 매핑
  let subfolder;
  switch (group) {
    case 'tft-champion':
      subfolder = 'tft-champion';
      break;
    case 'tft-item':
      subfolder = 'tft-item';
      break;
    case 'tft-trait':
      subfolder = 'tft-trait';
      break;
    default:
      subfolder = '';
  }
  return `${BASE_IMAGE_URL}/${subfolder}/${name}`;
}

/**
 * 로컬 JSON 파일을 읽어와
 * champions, items, traits 각각에 icon URL을 달아서 리턴
 */
export function loadTFTData() {
  if (cachedTFTData) {
    return cachedTFTData;
  }

  console.log(`[데이터 서비스] 로컬 데이터 드래곤 (${LATEST_PATCH_VERSION}) 파일을 로드합니다.`);

  try {
    const championsRaw = JSON.parse(
      fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-champion.json'), 'utf-8')
    );
    const itemsRaw = JSON.parse(
      fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-item.json'), 'utf-8')
    );
    const traitsRaw = JSON.parse(
      fs.readFileSync(path.join(BASE_DATA_PATH, 'tft-trait.json'), 'utf-8')
    );

    // 챔피언, 아이템, 특성 데이터를 순회하며 icon URL 생성
    const champions = Object.values(championsRaw.data).map((c) => ({
      apiName: c.id,
      name: c.name,
      // square 아이콘
      icon: toAbsoluteUrl(c.image.full, c.image.group),
      // tileIcon(필요 시 동일하게 처리)
      tileIcon: toAbsoluteUrl(c.image.full, c.image.group),
    }));

    const items = Object.values(itemsRaw.data).map((i) => ({
      apiName: i.id,
      name: i.name,
      icon: toAbsoluteUrl(i.image.full, i.image.group),
    }));

    const traits = Object.values(traitsRaw.data).map((t) => ({
      apiName: t.id,
      name: t.name,
      icon: toAbsoluteUrl(t.image.full, t.image.group),
    }));

    // 필요하다면 이름맵, 트레이트맵 등 추가 가공
    const traitMap = new Map(traits.map((t) => [t.apiName.toLowerCase(), t]));
    const krNameMap = new Map();
    champions.forEach((c) => krNameMap.set(c.apiName.toLowerCase(), c.name));
    traits.forEach((t) => krNameMap.set(t.apiName.toLowerCase(), t.name));

    cachedTFTData = {
      champions,
      items,
      traits,
      traitMap,
      krNameMap,
      currentSet: '14',
    };

    console.log('[데이터 서비스] 로컬 데이터 드래곤 가공 및 캐싱 완료.');
    return cachedTFTData;
  } catch (error) {
    console.error('치명적 오류: 로컬 데이터 파일을 읽거나 파싱하는 데 실패했습니다.', error);
    console.error(`다음 경로에 JSON 파일들이 있는지 확인해주세요: ${BASE_DATA_PATH}`);
    throw new Error('TFT 데이터 로딩 실패. 파일 이름과 경로를 확인하세요.');
  }
}

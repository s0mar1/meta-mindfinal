// ===== File: backend/src/services/tftData.js =====
import axios from 'axios';

const COMMUNITY_DRAGON_BASE = 'https://raw.communitydragon.org';
const TFT_PATH = 'cdragon/tft';

// Following the repository guidelines from AGENTS.md

// TFT 데이터 로드
export async function getTFTData() {
  // Community Dragon은 'latest' 버전을 지원합니다.
  const version = 'latest';
  const [champRes, itemRes] = await Promise.all([
    axios.get(`${COMMUNITY_DRAGON_BASE}/${version}/${TFT_PATH}/champions.json`),
    axios.get(`${COMMUNITY_DRAGON_BASE}/${version}/${TFT_PATH}/items.json`)
  ]);

  const toPng = p => (p ? p.replace(/\.tex$/i, '.png') : p);

  const champions = champRes.data.map(c => ({
    ...c,
    tileIcon: toPng(c.squareIcon || c.icon || c.squareIconPath),
    icon: toPng(c.icon || c.squareIconPath),
    name_ko: c.name
  }));

  const items = itemRes.data.map(i => ({
    ...i,
    icon: toPng(i.icon)
  }));

  return { champions, items };
}

// 스케줄러 예시
export async function runScheduledJobs() {
  try {
    const data = await getTFTData();
    console.log('TFT 데이터 로드 완료:', data);
    return data;
  } catch (e) {
    console.error('TFT 데이터 로드 중 오류:', e.message);
    return { champions: [], items: [] };
  }
}

// default export 추가: named export 외에도 default 로 import 가능

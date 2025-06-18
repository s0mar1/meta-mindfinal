// ===== File: backend/src/services/tftData.js =====
import axios from 'axios';

// 리전 상수 (환경변수 또는 고정값)
const REGION = 'kr';

// 패치 버전 조회 (에러 발생 시 'latest'로 폴백)
async function fetchPatchVersion() {
  try {
    const res = await axios.get(`https://ddragon.leagueoflegends.com/realms/${REGION}.json`);
    return res.data.n.champion;
  } catch (err) {
    console.error('⚠️ 패치 버전 조회 실패, latest로 폴백합니다:', err.message);
    return 'latest';
  }
}

// TFT 데이터 로드
export async function getTFTData() {
  const version = await fetchPatchVersion();
  const [champRes, itemRes] = await Promise.all([
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-champions.json`),
    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/tft-items.json`)
  ]);

  const champions = champRes.data.data.map(c => ({
    ...c,
    tileIcon: c.icon.replace(/\.tex$/i, '.png'),
    name_ko: c.name
  }));

  const items = itemRes.data.data.map(i => ({
    ...i,
    icon: i.icon.replace(/\.tex$/i, '.png')
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
export default { getTFTData, runScheduledJobs };

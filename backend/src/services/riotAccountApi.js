import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const RIOT_API_KEY = process.env.RIOT_API_KEY;
const ASIA_API_URL = 'https://asia.api.riotgames.com';

/**
 * PUUID 하나로 계정 정보를 가져오는 내부 헬퍼 함수
 * @param {string} puuid 
 * @returns {Promise<object|null>} 계정 정보 또는 실패 시 null
 */
const getAccountByPuuid = async (puuid) => {
  try {
    const url = `${ASIA_API_URL}/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${RIOT_API_KEY}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    // 404 (찾을 수 없음) 등 에러 발생 시 해당 요청은 실패 처리하고 null 반환
    console.error(`[API Error] PUUID '${puuid}'로 계정 정보를 가져오는 데 실패했습니다: ${error.message}`);
    return null;
  }
};

/**
 * 여러 개의 PUUID 배열을 받아, 각 계정 정보를 Map 형태로 반환하는 함수
 * @param {string[]} puuids 
 * @returns {Promise<Map<string, object>>} PUUID를 키로, 계정 정보를 값으로 갖는 Map
 */
export const getAccountsByPuuids = async (puuids) => {
  // Promise.all을 사용해 여러 개의 API 요청을 병렬로 처리
  const accountPromises = puuids.map(puuid => getAccountByPuuid(puuid));
  const results = await Promise.all(accountPromises);

  const accountsMap = new Map();
  results.forEach((account, index) => {
    // 성공적으로 가져온 계정 정보만 Map에 추가
    if (account) {
      accountsMap.set(puuids[index], account);
    }
  });

  return accountsMap;
};
// backend/src/services/riotApi.js

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

if (!RIOT_API_KEY) {
  // .env 파일에 키가 없는 경우, 서버 시작 시 에러를 발생시켜 문제를 즉시 알 수 있도록 합니다.
  throw new Error('Riot API key not found in .env file. Please check your environment variables.');
}

// [핵심 수정] 모든 요청에 동일한 헤더를 적용하기 위한 설정 객체
const getApiConfig = () => ({
  headers: {
    'X-Riot-Token': RIOT_API_KEY,
  },
});

export const getAccountByRiotId = async (gameName, tagLine) => {
  const apiRegion = 'asia';
  const url = `https://${apiRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`;
  const response = await axios.get(url, getApiConfig());
  return response.data;
};

export const getMatchIdsByPUUID = async (puuid, count = 10) => {
  const apiRegion = 'asia';
  const queueId = 1100;
  const url = `https://${apiRegion}.api.riotgames.com/tft/match/v1/matches/by-puuid/${puuid}/ids?start=0&count=${count}&queue=${queueId}`;
  
  try {
    const response = await axios.get(url, getApiConfig());
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`> 정보: ${puuid.substring(0,8)}... 님은 최근 랭크 게임 기록이 없습니다. 건너뜁니다.`);
      return [];
    }
    throw error;
  }
};

export const getMatchDetail = async (matchId) => {
  const apiRegion = 'asia';
  const url = `https://${apiRegion}.api.riotgames.com/tft/match/v1/matches/${matchId}`;
  const response = await axios.get(url, getApiConfig());
  return response.data;
};

export const getChallengerLeague = async () => {
  const apiRegion = 'kr';
  const url = `https://${apiRegion}.api.riotgames.com/tft/league/v1/challenger`;
  const response = await axios.get(url, getApiConfig());
  return response.data;
};

export const getSummonerBySummonerId = async (summonerId) => {
  const apiRegion = 'kr';
  const url = `https://${apiRegion}.api.riotgames.com/tft/summoner/v1/summoners/${summonerId}`;
  const response = await axios.get(url, getApiConfig());
  return response.data;
};

export const getAccountByPuuid = async (puuid) => {
  const apiRegion = 'asia';
  const url = `https://${apiRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`;
  const response = await axios.get(url, getApiConfig());
  return response.data;
};

export const getSummonerByPuuid = async (puuid) => {
  const apiRegion = 'kr';
  const url = `https://${apiRegion}.api.riotgames.com/tft/summoner/v1/summoners/by-puuid/${puuid}`;
  const response = await axios.get(url, getApiConfig());
  return response.data;
};

export const getLeagueEntriesBySummonerId = async (summonerId) => {
  const apiRegion = 'kr';
  const url = `https://${apiRegion}.api.riotgames.com/tft/league/v1/entries/by-summoner/${summonerId}`;
  try {
    const response = await axios.get(url, getApiConfig());
    return response.data.find(entry => entry.queueType === 'RANKED_TFT');
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
};
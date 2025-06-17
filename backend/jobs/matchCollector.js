// backend/jobs/matchCollector.js
import { getChallengerLeague, getSummonerBySummonerId, getAccountByPuuid, getMatchIdsByPUUID, getMatchDetail } from '../src/services/riotApi.js';
import Match from '../src/models/Match.js';
import Ranker from '../src/models/Ranker.js';
import getTFTData from '../src/services/tftData.js';

const delay = ms => new Promise(res => setTimeout(res, ms));

export const collectTopRankerMatches = async () => {
  try {
    const tftData = await getTFTData();
    if (!tftData) {
      console.error('TFT 데이터를 불러오지 못해 랭커 데이터 수집을 중단합니다.');
      return;
    }
    const currentSet = tftData.currentSet;
    console.log(`--- [최종] 랭커 및 매치 데이터 수집 작업 시작 (시즌 ${currentSet} 대상) ---`);

    const challengerLeague = await getChallengerLeague();
    const topRankers = challengerLeague.entries.slice(0, 10);
    
    console.log(`[수집 1/2] 챌린저 ${topRankers.length}명의 프로필 업데이트 시작...`);
    for (const entry of topRankers) {
      try {
        const summonerData = await getSummonerBySummonerId(entry.summonerId);
        const accountData = await getAccountByPuuid(summonerData.puuid);
        
        await Ranker.findOneAndUpdate(
            { puuid: summonerData.puuid },
            {
                summonerId: entry.summonerId,
                summonerName: summonerData.name,
                gameName: accountData.gameName,
                tagLine: accountData.tagLine,
                profileIconId: summonerData.profileIconId,
                leaguePoints: entry.leaguePoints,
                rank: entry.rank,
                wins: entry.wins,
                losses: entry.losses,
            },
            { upsert: true }
        );
        await delay(1200);
      } catch (e) {
        console.error(`> 경고: ${entry.summonerId.substring(0,10)}... 프로필 처리 중 에러: ${e.message}`);
        await delay(1200);
      }
    }
    console.log('--- 랭커 프로필 수집 완료 ---');

    console.log('--- 매치 데이터 수집 시작 ---');
    const rankersFromDB = await Ranker.find({}).limit(10).sort({ leaguePoints: -1 });
    let allMatchIds = [];
    for (const ranker of rankersFromDB) {
      if (!ranker.puuid) continue;
      const matchIds = await getMatchIdsByPUUID(ranker.puuid, 10);
      allMatchIds.push(...matchIds);
      await delay(200);
    }
    
    const uniqueMatchIds = [...new Set(allMatchIds)];
    const limitedMatchIds = uniqueMatchIds.slice(0, 50);
    console.log(`[수집 2/2] ${limitedMatchIds.length}개의 매치 상세 정보 조회를 시작합니다.`);

    for (const matchId of limitedMatchIds) {
      const existingMatch = await Match.findOne({ 'metadata.match_id': matchId });
      if (existingMatch) {
        console.log(`🟡 매치 ${matchId.substring(0, 8)}... 이미 DB에 존재하여 건너뜀.`);
        continue;
      }

      try {
        const matchDetail = await getMatchDetail(matchId);
        // 디버깅을 위한 로그 추가: 가져온 매치의 data_version 확인
        const matchDataVersion = matchDetail?.metadata?.data_version;
        console.log(`[디버깅] 매치 ${matchId.substring(0, 8)}... data_version: ${matchDataVersion}`);

        if (!matchDataVersion || !matchDetail?.info?.game_length || matchDetail.info.game_length < 1) {
          console.log(`🟠 매치 ${matchId.substring(0, 8)}... 유효하지 않은 데이터 (버전, 길이 등)로 건너뜀.`);
          continue;
        }
        
        // 🚨🚨🚨 이 필터링 조건을 일시적으로 주석 처리합니다. 🚨🚨🚨
        // 이 부분이 '다른 시즌(6) 데이터로 건너뜀' 로그의 원인이었으므로,
        // 현재 Riot API가 반환하는 실제 data_version 값을 확인하기 위해 잠시 비활성화합니다.
        // const matchDataVersionPrefix = matchDataVersion.split('.')[0];
        // if (matchDataVersionPrefix !== currentSet) {
        //     console.log(`🔵 매치 ${matchId.substring(0, 8)}... 다른 시즌(${matchDataVersionPrefix}) 데이터로 건너뜀. 현재 시즌: ${currentSet}`);
        //     continue;
        // }

        await Match.create(matchDetail);
        console.log(`✅ 매치 ${matchId.substring(0, 8)}... DB에 성공적으로 저장됨.`);
        await delay(1200);
      } catch (detailError) {
        if (detailError.isAxiosError && detailError.response) {
            if (detailError.response.status === 404) {
                console.warn(`⚠️ 매치 ${matchId.substring(0, 8)}... Riot API에서 찾을 수 없음 (404).`);
            } else if (detailError.response.status === 429) {
                console.error(`🔴 매치 ${matchId.substring(0, 8)}... Riot API Rate Limit 초과 (429). 잠시 후 재시도 필요.`);
            } else {
                console.error(`🚨 매치 ${matchId.substring(0, 8)}... Riot API 에러 (${detailError.response.status}):`, detailError.message, detailError.response.data);
            }
        } else {
            console.error(`❌ 매치 ${matchId.substring(0, 8)}... 처리 중 예상치 못한 에러:`, detailError.message, detailError.stack);
        }
        await delay(1200);
      }
    }
    console.log('--- 매치 데이터 수집 완료 ---');

  } catch (error) {
    console.error('🚨 데이터 수집 작업 중 치명적인 에러 발생:', error);
  }
};
import Match from '../src/models/Match.js';
import Ranker from '../src/models/Ranker.js';

/**
 * DB의 모든 랭커에 대해 1등 횟수를 계산하고 업데이트하는 함수
 */
export const analyzePlayerStats = async () => {
  console.log('--- 랭커별 1등 횟수 분석 작업 시작 ---');
  try {
    const allRankers = await Ranker.find({}, 'puuid'); // 모든 랭커의 puuid만 가져옴

    for (const ranker of allRankers) {
      // 해당 랭커가 포함된 모든 매치를 DB에서 찾음
      const matches = await Match.find({ 'info.participants.puuid': ranker.puuid });
      
      let firstPlaceWins = 0;
      matches.forEach(match => {
        const participant = match.info.participants.find(p => p.puuid === ranker.puuid);
        if (participant && participant.placement === 1) {
          firstPlaceWins++;
        }
      });
      
      // 찾은 1등 횟수를 DB에 업데이트
      await Ranker.updateOne({ puuid: ranker.puuid }, { $set: { firstPlaceWins: firstPlaceWins } });
    }
    console.log(`총 ${allRankers.length}명의 랭커에 대한 1등 횟수 분석 및 업데이트 완료.`);

  } catch (error) {
    console.error('랭커 통계 분석 중 에러 발생:', error.message);
  } finally {
    console.log('--- 랭커별 1등 횟수 분석 작업 완료 ---');
  }
};
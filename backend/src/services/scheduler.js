import cron from 'node-cron';
import { collectTopRankerMatches } from '../../jobs/matchCollector.js';
import { analyzeAndCacheDeckTiers } from '../../jobs/deckAnalyzer.js';
import { analyzePlayerStats } from '../../jobs/playerStatsAnalyzer.js';
import getTFTData from './tftData.js';

const runScheduledJobs = async () => {
    console.log('스케줄러 시작. 먼저 TFT 데이터를 로드합니다...');
    const tftData = await getTFTData();
    if (!tftData) {
        console.error('TFT 데이터 로딩에 실패하여 스케줄링된 작업을 실행할 수 없습니다.');
        return;
    }
    console.log('TFT 데이터 준비 완료. 예약된 작업을 설정합니다.');

    // 1. 랭커 및 매치 데이터 수집 작업
    cron.schedule('5 * * * *', () => { // 매시간 5분에 실행
        console.log('정기 랭커 및 매치 데이터 수집을 시작합니다.');
        collectTopRankerMatches(); // ⬅️ 이름이 통일되었습니다.
    }, { scheduled: true, timezone: "Asia/Seoul" });

    // 2. 덱 티어 분석 작업
    cron.schedule('10 */1 * * *', () => { // 매시간 10분에 실행
        console.log('정기 덱 티어 분석을 시작합니다.');
        analyzeAndCacheDeckTiers(tftData);
    }, { scheduled: true, timezone: "Asia/Seoul" });

    // 3. 랭커 통계 분석 작업
    cron.schedule('15 */2 * * *', () => { // 2시간마다 15분에 실행
        console.log('정기 랭커 통계 분석을 시작합니다.');
        analyzePlayerStats();
    }, { scheduled: true, timezone: "Asia/Seoul" });

    // 서버가 시작될 때 모든 작업을 순차적으로 1회 실행
    console.log('서버 시작. 1회성 초기 데이터 작업을 순차적으로 실행합니다.');
    try {
        await collectTopRankerMatches();
        await analyzeAndCacheDeckTiers(tftData);
        await analyzePlayerStats();
        console.log('초기 데이터 작업이 모두 성공적으로 완료되었습니다.');
    } catch (error) {
        console.error('초기 작업 실행 중 에러 발생:', error);
    }
};

runScheduledJobs();
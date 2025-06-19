// backend/src/services/scheduler.js
import cron from 'node-cron';
import { collectTopRankerMatches } from '../../jobs/matchCollector.js';
import { analyzeAndCacheDeckTiers } from '../../jobs/deckAnalyzer.js';
import { analyzePlayerStats } from '../../jobs/playerStatsAnalyzer.js';
// [핵심 수정] getTFTData -> loadTFTData 로 import하는 함수의 이름을 변경합니다.
import { loadTFTData } from './tftDataService.js';

function runScheduledJobs() {
    console.log('스케줄러 시작. 먼저 TFT 데이터를 로드합니다...');
    let tftData;
    try {
        // [핵심 수정] 호출하는 함수 이름도 getTFTData() -> loadTFTData() 로 변경합니다.
        tftData = loadTFTData();
    } catch (err) {
        console.error('TFT 데이터 로드 실패:', err);
        // 데이터 로딩 실패 시 스케줄러를 시작하지 않고 종료합니다.
        return;
    }
    console.log('TFT 데이터 준비 완료. 예약된 작업을 설정합니다.');

    // 1. 랭커 및 매치 데이터 수집 작업
    cron.schedule('5 * * * *', () => {
        console.log('정기 랭커 및 매치 데이터 수집을 시작합니다.');
        collectTopRankerMatches();
    }, { scheduled: true, timezone: "Asia/Seoul" });

    // 2. 덱 티어 분석 작업
    cron.schedule('10 * * * *', () => { // 매시간 10분으로 변경
        console.log('정기 덱 티어 분석을 시작합니다.');
        // deckAnalyzer는 tftData를 직접 로드하므로 인자를 넘길 필요가 없습니다.
        analyzeAndCacheDeckTiers();
    }, { scheduled: true, timezone: "Asia/Seoul" });

    // 3. 랭커 통계 분석 작업
    cron.schedule('15 */2 * * *', () => {
        console.log('정기 랭커 통계 분석을 시작합니다.');
        analyzePlayerStats();
    }, { scheduled: true, timezone: "Asia/Seoul" });

    // 서버가 시작될 때 모든 작업을 순차적으로 1회 실행
    console.log('서버 시작. 1회성 초기 데이터 작업을 순차적으로 실행합니다.');
    (async () => {
        try {
            await collectTopRankerMatches();
            await analyzeAndCacheDeckTiers();
            await analyzePlayerStats();
            console.log('초기 데이터 작업이 모두 성공적으로 완료되었습니다.');
        } catch (error) {
            console.error('초기 작업 실행 중 에러 발생:', error);
        }
    })();
};

// 스케줄러 실행
runScheduledJobs();
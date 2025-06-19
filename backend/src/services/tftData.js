// backend/src/services/tftData.js

import axios from 'axios';
import { tftCache, getCachedTFT, setCachedTFT } from '../cache/dataCache.js';

// [수정] Community Dragon의 올바른 최신 데이터 경로
const CDRAGON_URL = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1';

// 이미지 경로를 완성된 URL로 변환하는 헬퍼 함수
const toAbsoluteUrl = (path) => {
    if (!path) return null;
    return `https://raw.communitydragon.org/latest/game/${path.toLowerCase().replace('.tex', '.png')}`;
};

export async function getTFTData() {
    const cachedData = getCachedTFT('latest');
    if (cachedData) {
        console.log("TFT 데이터를 캐시에서 불러옵니다.");
        return cachedData;
    }
    
    console.log("Community Dragon에서 최신 TFT 데이터를 불러옵니다...");
    try {
        const [championRes, itemRes, traitRes] = await Promise.all([
            axios.get(`${CDRAGON_URL}/tft/champions.json`),
            axios.get(`${CDRAGON_URL}/tft/items.json`),
            axios.get(`${CDRAGON_URL}/tft/traits.json`)
        ]);

        const champions = championRes.data.map(c => ({
            ...c,
            icon: toAbsoluteUrl(c.icon),
            tileIcon: toAbsoluteUrl(c.tileIcon || c.icon) // tileIcon이 없으면 일반 아이콘 사용
        }));

        const items = itemRes.data.map(i => ({
            ...i,
            icon: toAbsoluteUrl(i.icon),
        }));

        const traits = traitRes.data.map(t => ({
            ...t,
            icon: toAbsoluteUrl(t.icon),
        }));

        // 분석에 필요한 traitMap, krNameMap 생성
        const traitMap = new Map(traits.map(t => [t.apiName.toLowerCase(), t]));
        const krNameMap = new Map(champions.map(c => [c.apiName.toLowerCase(), c.name]));
        traits.forEach(t => krNameMap.set(t.apiName.toLowerCase(), t.name));

        const payload = {
            champions,
            items,
            traits,
            traitMap,
            krNameMap,
            currentSet: '11', // 이 값은 필요시 업데이트
        };

        setCachedTFT('latest', payload); // 가져온 데이터를 캐시에 저장
        console.log("TFT 데이터를 성공적으로 불러와 캐시에 저장했습니다.");
        return payload;

    } catch (error) {
        console.error("Community Dragon에서 데이터를 가져오는 데 실패했습니다.", error.message);
        // 에러 발생 시, 최소한의 동작을 위해 로컬 데이터를 대신 로드 시도
        try {
            console.log("대체 방안: 로컬 JSON 데이터 파일을 로드합니다.");
            const localData = await import('./tftDataService.js');
            return localData.loadTFTData();
        } catch (localError) {
            console.error("로컬 데이터 로드에도 실패했습니다.", localError.message);
            throw new Error("TFT 데이터 소스를 찾을 수 없습니다.");
        }
    }
}
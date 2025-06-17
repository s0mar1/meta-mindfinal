import Match      from '../src/models/Match.js';
import DeckTier   from '../src/models/DeckTier.js';
import getTFTData from '../src/services/tftData.js';

// (변경 없음) 이름에서 시즌 접두사 제거
const cleanTFTName = name => name ? name.replace(/^TFT\d*_/i, '') : 'Unknown';

// (변경 없음) 평균 순위·TOP4율 → S ~ D 티어
const calculateTierRank = (averagePlacement, top4Rate) => {
  if (averagePlacement <= 4.15 && top4Rate >= 0.58) return { rank: 'S', order: 1 };
  if (averagePlacement <= 4.35 && top4Rate >= 0.53) return { rank: 'A', order: 2 };
  if (averagePlacement <= 4.55 && top4Rate >= 0.50) return { rank: 'B', order: 3 };
  if (averagePlacement <= 4.75 && top4Rate >= 0.45) return { rank: 'C', order: 4 };
  return { rank: 'D', order: 5 };
};

/* ──────────────────────────────────────────────────────────────── */
export const analyzeAndCacheDeckTiers = async () => {
  console.log('--- [최종] 덱 티어리스트 분석 작업 시작 ---');
  try {
    const tftData = await getTFTData();                  // {items, champions, traits, currentSet}
    if (!tftData) {
      console.error('TFT 데이터를 불러오지 못해 덱 분석을 중단합니다.');
      return;
    }

    const allMatches = await Match.find({});
    const deckDataAggregator = {};
    console.log(`총 ${allMatches.length}개의 매치를 분석합니다.`);

    /* ───────────────── ① 매치 순회하며 데이터 누적 ───────────────── */
    allMatches.forEach(match => {
      if (!match?.info?.participants) return;

      match.info.participants.forEach(p => {
        if (!p?.units || !p?.traits) return;

        /* 챔피언 코스트 보강 */
        const findChampInfo = id =>
          tftData.champions.find(c => c.apiName.toLowerCase() === id.toLowerCase());

        const enrichedUnits = p.units.map(u => ({
          ...u,
          cost: findChampInfo(u.character_id)?.cost || 0,
        }));

        /* 캐리 판단 */
        let carryUnit =
          enrichedUnits.find(u => u.tier === 3 && u.itemNames?.length >= 2) ||
          enrichedUnits.find(u => ((u.cost === 4 || u.cost === 5) &&
                                   u.tier >= 2 && u.itemNames?.length >= 2)) ||
          [...enrichedUnits]
            .sort((a, b) => (b.itemNames?.length || 0) - (a.itemNames?.length || 0))[0];

        if (!carryUnit) return;
        const carryInfo = findChampInfo(carryUnit.character_id);
        if (!carryInfo) return;

        /* ──── ❶ 특성 매칭 + ❷ 스타일 계산 (Season 14 규칙) ──── */
        const num2key   = ['none','bronze','silver','gold','prismatic'];
        const styleRank = { bronze:1, silver:2, gold:3, prismatic:4 };

        const traits = p.traits
          .map(t => {
            /* 접두사 'TFT14_' 제거 후 매칭 */
            const traitInfo = tftData.traits.find(dt =>
              dt.apiName.split('_').pop().toLowerCase() === t.name.toLowerCase()
            );
            if (!traitInfo) return null;

            const unitsCnt =
              t.tier_current ?? t.tierCurrent ??
              t.num_units    ?? t.numUnits    ??
              t.unitCount    ?? 0;
            if (unitsCnt === 0) return null;

            /* ❷ styleName 우선 participant.t.style 사용 */
            let styleName  = (typeof t.style === 'number')
              ? (num2key[t.style] || 'bronze')
              : 'bronze';
            let styleOrder = styleRank[styleName] || 1;

            /* sets 로 더 높은 등급이 있으면 갱신 */
            if (traitInfo.sets?.length) {
              for (const s of traitInfo.sets) {
                if (unitsCnt >= s.min) {
                  const key = typeof s.style === 'string'
                    ? s.style.toLowerCase()
                    : (num2key[s.style] || 'bronze');
                  if ((styleRank[key] || 1) > styleOrder) {
                    styleName  = key;
                    styleOrder = styleRank[key] || 1;
                  }
                }
              }
            }

            return {
              name        : traitInfo.name,
              tier_current: unitsCnt,
              style       : styleName,
              styleOrder,
            };
          })
          .filter(Boolean);

        if (!traits.length) return;

        /* 덱 키 = 대표 특성 + 캐리 챔프 */
        const mainTrait = [...traits].sort((a,b)=>b.styleOrder-a.styleOrder)[0];
        const deckKey   = `${mainTrait.name} ${carryInfo.name}`;

        /* 누적 */
        if (!deckDataAggregator[deckKey]) {
          deckDataAggregator[deckKey] = {
            mainTraitName      : mainTrait.name,
            carryChampionName  : carryInfo.name,
            placements         : [],
            unitOccurrences    : {},
          };
        }
        const agg = deckDataAggregator[deckKey];
        agg.placements.push(p.placement);

        enrichedUnits.forEach(u => {
          if (!agg.unitOccurrences[u.character_id])
            agg.unitOccurrences[u.character_id] = { count:0, items:[], cost:u.cost };
          const entry = agg.unitOccurrences[u.character_id];
          entry.count++;
          if (u.itemNames) entry.items.push(...u.itemNames);
        });
      });
    });

    console.log(`[최종] 분석 완료. ${Object.keys(deckDataAggregator).length}개 덱 발견.`);

    /* ───────────────── ② DB 저장 ───────────────── */
    const cdnBaseUrl = 'https://raw.communitydragon.org/latest/game/';
    for (const key in deckDataAggregator) {
      const d = deckDataAggregator[key];
      const totalGames = d.placements.length;
      if (totalGames < 3) continue;

      /* 코어 유닛 상위 8 */
      const coreUnits = Object.entries(d.unitOccurrences)
        .sort((a,b)=>b[1].count-a[1].count).slice(0,8).map(([apiName,u])=>{
          const champInfo = tftData.champions.find(
            c=>c.apiName.toLowerCase()===apiName.toLowerCase());
          const itemCounts = u.items.reduce((acc,n)=>{acc[n]=(acc[n]||0)+1;return acc;},{});
          const recommendedItems = Object.entries(itemCounts)
            .sort((a,b)=>b[1]-a[1]).slice(0,3).map(([itemApi])=>{
              const it = tftData.items.find(i=>i.apiName.toLowerCase()===itemApi.toLowerCase());
              return {
                name     : it?.name || '',
                image_url: it?.icon ? `${cdnBaseUrl}${it.icon.toLowerCase().replace('.tex','.png')}` : null,
              };
            });
          return {
            name     : champInfo?.name || 'Unknown',
            apiName  : champInfo?.apiName,
            image_url: champInfo?.tileIcon
              ? `${cdnBaseUrl}${champInfo.tileIcon.toLowerCase().replace('.tex','.png')}`
              : null,
            cost : u.cost,
            recommendedItems,
          };
        });

      const avg   = d.placements.reduce((s,p)=>s+p,0) / totalGames;
      const top4  = d.placements.filter(p=>p<=4).length / totalGames;
      const tier  = calculateTierRank(avg, top4);

      await DeckTier.findOneAndUpdate(
        { deckKey:key },
        {
          mainTraitName     : d.mainTraitName,
          carryChampionName : d.carryChampionName,
          coreUnits,
          totalGames,
          top4Count         : d.placements.filter(p=>p<=4).length,
          winCount          : d.placements.filter(p=>p===1).length,
          averagePlacement  : avg,
          tierRank          : tier.rank,
          tierOrder         : tier.order,
        },
        { upsert:true },
      );
    }
    console.log('--- [최종] 덱 티어리스트 통계 계산 및 DB 저장 완료 ---');
  } catch (err) {
    console.error('[최종] 덱 티어리스트 분석 중 에러:', err.message, err.stack);
  }
};
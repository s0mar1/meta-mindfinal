// backend/src/routes/summoner.js

import express from 'express';
// [수정] riotApi 서비스에서 필요한 모든 함수를 가져옵니다.
import { 
    getAccountByRiotId, 
    getSummonerByPuuid, 
    getLeagueEntriesBySummonerId, 
    getMatchIdsByPUUID, 
    getMatchDetail 
} from '../services/riotApi.js';
// [핵심 수정] 불완전한 tftDataService 대신, Community Dragon에서 모든 데이터를 가져오는 tftData.js를 사용합니다.
import { getTFTData } from '../services/tftData.js'; 
import { matchCache } from '../cache/matchCache.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { region, gameName, tagLine, forceRefresh } = req.query;
    if (!region || !gameName || !tagLine) return res.status(400).json({ error:'region, gameName, tagLine이 필요합니다.' });

    const cacheKey = `${region}:${gameName}#${tagLine}`;
    if (forceRefresh !== 'true') {
        const hit = matchCache.get(cacheKey);
        if (hit) return res.json(hit);
    }
    
    // [핵심 수정] 모든 정적 데이터를 API 통신을 통해 한 번만 가져옵니다.
    const tftData = await getTFTData();
    if (!tftData || !tftData.champions || !tftData.items || !tftData.traits) {
      return res.status(503).json({ error: 'TFT 정적 데이터를 불러오는 데 실패했습니다.'});
    }

    const account = await getAccountByRiotId(gameName, tagLine);
    const summonerInfo = await getSummonerByPuuid(account.puuid);
    const leagueEntry = await getLeagueEntriesBySummonerId(summonerInfo.id);
    const ids = await getMatchIdsByPUUID(account.puuid, 10);
    const matches = [];

    if (Array.isArray(ids) && ids.length) {
      for (const matchId of ids) {
        const matchDetail = await getMatchDetail(matchId).catch(() => null);
        if (!matchDetail) continue;

        const me = matchDetail.info.participants.find(p => p.puuid === account.puuid);
        if (!me) continue;

        // 이제 루프 안에서 tftData를 계속 부를 필요가 없습니다.
        const units = me.units.map(u => {
          const champData = tftData.champions.find(c => c.apiName === u.character_id);
          const itemData = (u.itemNames || []).map(itemName => tftData.items.find(i => i.apiName === itemName)).filter(Boolean);
          
          return {
            character_id: u.character_id,
            name: champData?.name || u.character_id,
            icon: champData?.icon,
            tier: u.tier, cost: champData?.cost || 0,
            items: itemData.map(it => ({ name: it.name, icon: it.icon }))
          };
        });

        const traits = (me.traits || []).map(t => {
            // 이제 tftData.traits가 존재하므로 에러가 발생하지 않습니다.
            const traitData = tftData.traits.find(td => td.apiName === t.name);
            return {
                name: traitData?.name || t.name,
                icon: traitData?.icon,
                tier_current: t.num_units,
                style: t.style,
            };
        }).filter(t => t.icon).sort((a,b) => b.style - a.style);

        matches.push({
          matchId, game_datetime: matchDetail.info.game_datetime,
          placement: me.placement, level: me.level, units, traits,
        });
      }
    }

    const payload = { account: { ...account, ...summonerInfo }, league: leagueEntry, matches };
    matchCache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
// backend/src/routes/summoner.js
import express from 'express';
import { getAccountByRiotId, getSummonerByPuuid, getLeagueEntriesBySummonerId, getMatchIdsByPUUID, getMatchDetail } from '../services/riotApi.js';
// [수정] getTraitStyleInfo 대신 새로운 getCorrectTraitStyle 함수를 가져옵니다.
import { loadTFTData, getCorrectTraitStyle } from '../services/tftDataService.js';
import { matchCache } from '../cache/matchCache.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { region, gameName, tagLine, forceRefresh } = req.query;
    if (!region || !gameName || !tagLine) {
      return res.status(400).json({ error: 'region, gameName, tagLine이 필요합니다.' });
    }

    const cacheKey = `${region}:${gameName}#${tagLine}`;
    if (forceRefresh !== 'true') {
        const hit = matchCache.get(cacheKey);
        if (hit) return res.json(hit);
    }
    
    const tftData = loadTFTData(); // 여기서 로드된 tftData는 이미 가공된 icon/tileIcon URL을 포함합니다.
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
        
        const units = me.units.map(u => {
          const champData = tftData.champions.find(c => c.apiName === u.character_id);
          const itemData = (u.itemNames || []).map(itemName => tftData.items.find(i => i.apiName === itemName)).filter(Boolean);
          
          return {
            character_id: u.character_id,
            name: champData?.name || u.character_id.replace(/^TFT\d+_/, ''),
            icon: champData?.tileIcon || champData?.icon, // tftDataService에서 가공된 tileIcon 또는 icon URL을 사용합니다.
            tier: u.tier,
            cost: champData?.cost || 0,
            items: itemData.map(it => ({ name: it.name, icon: it.icon })) // item.icon은 tftDataService에서 이미 가공된 URL입니다.
          };
        });

        const traits = (me.traits || [])
          .filter(t => t.style > 0)
          .map(t => {
            const traitData = tftData.traits.find(td => td.apiName === t.name);
            if (!traitData) return null;

            // [핵심 수정] 유닛 수(t.num_units)를 기반으로 정확한 등급을 다시 계산합니다.
            const styleInfo = getCorrectTraitStyle(t.name, t.num_units, tftData);

            return {
                name: traitData.name,
                apiName: t.name,
                icon: traitData.icon, // traitData.icon은 tftDataService에서 이미 가공된 URL입니다.
                tier_current: t.num_units,
                styleName: styleInfo.styleName, // 정확하게 계산된 스타일 이름
            };
        }).filter(Boolean).sort((a,b) => b.tier_current - a.tier_current);

        matches.push({
          matchId,
          puuid: account.puuid,
          game_datetime: matchDetail.info.game_datetime,
          placement: me.placement,
          level: me.level,
          units,
          traits,
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
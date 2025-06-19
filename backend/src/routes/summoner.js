// backend/src/routes/summoner.js

import express from 'express';
import { getAccountByRiotId, getSummonerByPuuid, getLeagueEntriesBySummonerId, getMatchIdsByPUUID, getMatchDetail } from '../services/riotApi.js';
import { loadTFTData, getTraitBackgroundUrl } from '../services/tftDataService.js';
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
    
    const tftData = loadTFTData();
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
            icon: champData?.tileIcon,
            tier: u.tier,
            cost: champData?.cost || 0,
            items: itemData.map(it => ({ name: it.name, icon: it.icon }))
          };
        });

        const traits = (me.traits || [])
          .filter(t => t.style > 0)
          .map(t => {
            const traitData = tftData.traits.find(td => td.apiName === t.name);
            return {
                name: traitData?.name || t.name,
                apiName: t.name,
                icon: traitData?.icon,
                tier_current: t.num_units,
                style: t.style,
                backgroundUrl: getTraitBackgroundUrl(t.style),
            };
        }).sort((a,b) => b.style - a.style);

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
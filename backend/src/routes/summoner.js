// backend/src/routes/summoner.js

import express from 'express';
import { getAccountByRiotId, getSummonerByPuuid, getLeagueEntriesBySummonerId, getMatchIdsByPUUID, getMatchDetail } from '../services/riotApi.js';
import getTFTData from '../services/tftData.js';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 600 });

// Riot gameVersion (e.g., "Version 14.23.123.4567") -> ddragon patch (e.g., "14.23.1")
const getPatchVersionFromGameVersion = (gameVersion) => {
    if (!gameVersion) return 'latest';
    const parts = gameVersion.split(' ');
    const versionParts = parts.length > 1 ? parts[1].split('.') : [];
    return versionParts.length >= 3 ? `${versionParts[0]}.${versionParts[1]}.${versionParts[2]}` : 'latest';
};

router.get('/', async (req, res, next) => {
  try {
    const { region, gameName, tagLine, forceRefresh } = req.query;
    if (!region || !gameName || !tagLine) return res.status(400).json({ error:'region, gameName, tagLine 필요' });

    const cacheKey = `${region}:${gameName}#${tagLine}`;
    if (forceRefresh !== 'true') {
        const hit = cache.get(cacheKey);
        if (hit) return res.json(hit);
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
        
        const patchVersion = getPatchVersionFromGameVersion(matchDetail.info.game_version);
        const tft = await getTFTData(patchVersion);
        if (!tft) {
            console.warn(`Skipping match ${matchId} due to missing data for patch ${patchVersion}`);
            continue;
        }

        const units = me.units.map(u => {
          const champData = tft.champions.find(c => c.apiName === u.character_id);
          // Riot API의 itemNames (예: TFT_Item_RedBuff)와 Data Dragon의 apiName을 매칭
          const itemData = (u.itemNames || []).map(itemName => tft.items.find(i => i.apiName === itemName)).filter(Boolean);
          
          return {
            character_id: u.character_id,
            name: champData?.name || u.character_id,
            icon: champData?.icon,
            tier: u.tier, cost: champData?.cost || 0,
            items: itemData.map(it => ({ name: it.name, icon: it.icon }))
          };
        });

        const traits = (me.traits || []).map(t => {
            const traitData = tft.traits.find(td => td.apiName === t.name);
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
    cache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

export default router;
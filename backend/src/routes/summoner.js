/* -------------------------------------------------------------------------- */
/*  backend/src/routes/summoner.js – Community-Dragon 아이콘 경로 보강         */
/* -------------------------------------------------------------------------- */
import express from 'express';
import cache   from 'memory-cache';

import {
  getAccountByRiotId,
  getSummonerByPuuid,
  getLeagueEntriesBySummonerId,
  getMatchIdsByPUUID,
  getMatchDetail,
} from '../services/riotApi.js';

import { getTFTData } from '../services/tftDataService.js';;

const router = express.Router();

/* ---------- Community-Dragon 아이콘 URL 패턴 ---------- */
const cdChampionIcon = (apiName) =>
  `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${apiName.toLowerCase()}.png`;

const cdTraitIcon = (apiName) =>
  `https://raw.communitydragon.org/latest/game/assets/ux/tft/traits/${apiName.toLowerCase()}.png`;

const cdItemIcon = (apiName) =>
  `https://raw.communitydragon.org/latest/game/assets/ux/tft/items/${apiName.toLowerCase()}.png`;

/* ========================================================================== */
/*  GET /api/summoner?region=kr&gameName=HideOnBush&tagLine=KR1               */
/* ========================================================================== */
router.get('/', async (req, res) => {
  const { region, gameName, tagLine, forceRefresh } = req.query;
  if (!region || !gameName || !tagLine) {
    return res.status(400).json({ error: 'region, gameName, tagLine 파라미터가 필요합니다.' });
  }

  const cacheKey = `${region}:${gameName}#${tagLine}`;
  if (forceRefresh !== 'true') {
    const hit = cache.get(cacheKey);
    if (hit) return res.json(hit);
  }

  try {
    /* 1) TFT 메타 데이터(챔프·특성·아이템) 로드 */
    const tftData = await getTFTData();
    const { champions, traits, items } = tftData;

    /* 2) 소환사 프로필 / 리그 정보 */
    const account      = await getAccountByRiotId(gameName, tagLine);
    const summonerInfo = await getSummonerByPuuid(account.puuid);
    const leagueEntry  = await getLeagueEntriesBySummonerId(summonerInfo.id);

    /* 3) 최근 매치 10판 */
    const matchIds = await getMatchIdsByPUUID(account.puuid, 10);
    const matches  = [];

    for (const id of matchIds) {
      const match = await getMatchDetail(id).catch(() => null);
      if (!match) continue;

      const me = match.info.participants.find(p => p.puuid === account.puuid);
      if (!me) continue;

      /* ---------- 유닛 가공: 아이콘·아이템 보강 ---------- */
      const units = me.units.map(u => {
        const champ = champions.find(c => c.apiName === u.character_id);

        /* 챔피언 아이콘: tileIcon → icon → CDragon fallback */
        const champIcon =
          champ?.tileIcon || champ?.icon || cdChampionIcon(u.character_id);

        /* 아이템 배열 가공 + 아이콘 보강 */
        const itemObjs = (u.itemNames || []).map(name => {
          const itMeta = items.find(i => i.apiName === name);
          const url    = itMeta?.icon || cdItemIcon(name);
          return { name: itMeta?.name || name, icon: url, image_url: url };
        });

        return {
          character_id: u.character_id,
          name : champ?.name || u.character_id.replace(/^TFT\d+_/, ''),
          tier : u.tier,
          cost : champ?.cost ?? 0,
          icon : champIcon,
          image_url: champIcon,
          tileIcon : champ?.tileIcon ?? null,
          items: itemObjs,
        };
      });

      /* ---------- 특성 가공: 아이콘 보강 ---------- */
      const traitObjs = (me.traits || [])
        .filter(t => t.style > 0)
        .map(t => {
          const meta = traits.find(tr => tr.apiName === t.name);
          const icon = meta?.icon || cdTraitIcon(t.name);
          return {
            name : meta?.name || t.name,
            apiName: t.name,
            tier_current: t.num_units,
            styleOrder  : t.style,     // 1(bronze)~4(prismatic)
            icon,
            image_url: icon,
          };
        })
        .sort((a, b) => b.styleOrder - a.styleOrder);

      matches.push({
        matchId      : id,
        game_datetime: match.info.game_datetime,
        placement    : me.placement,
        level        : me.level,
        traits       : traitObjs,
        units,
      });
    }

    const payload = {
      account : { ...account, ...summonerInfo },
      league  : leagueEntry,
      matches,
    };

    cache.put(cacheKey, payload, 1000 * 60 * 5); // 5분 캐시
    res.json(payload);
  } catch (err) {
    console.error('[summoner] error:', err);
    res.status(500).json({ error: 'Failed to fetch summoner data' });
  }
});

export default router;

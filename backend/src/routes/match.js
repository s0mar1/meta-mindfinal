// backend/src/routes/match.js
import express from 'express';
import { getMatchDetail } from '../services/riotApi.js';
import { loadTFTData, getCorrectTraitStyle } from '../services/tftDataService.js';
import { getAccountsByPuuids } from '../services/riotAccountApi.js';

const router = express.Router();

router.get('/:matchId', async (req, res, next) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID가 필요합니다.' });
    }

    /* ✅ 비동기 함수는 await */
    const tftData   = await loadTFTData();            // icon / tileIcon 포함
    const matchDetail = await getMatchDetail(matchId);

    if (!tftData || !matchDetail) {
      return res.status(503).json({ error: '데이터 로딩에 실패했습니다.' });
    }

    const puuids   = matchDetail.info.participants.map((p) => p.puuid);
    const accounts = await getAccountsByPuuids(puuids);

    const processedParticipants = matchDetail.info.participants.map((p) => {
      const units = p.units.map((u) => {
        const champData =
          tftData.champions.find((c) => c.apiName === u.character_id) || {};
        const itemData = (u.itemNames || []).map(
          (name) => (tftData.items ?? []).find((i) => i.apiName === name),
        ).filter(Boolean);

        return {
          character_id: u.character_id,
          name: champData.name || u.character_id.replace(/^TFT\d+_/, ''),
          icon: champData.tileIcon || champData.icon,
          tier: u.tier,
          cost: champData.cost || 0,
          items: itemData.map((it) => ({ name: it.name, icon: it.icon })),
        };
      });

      const traits = (p.traits || [])
        .filter((t) => t.style > 0)
        .map((t) => {
          const traitData = tftData.traits.find((td) => td.apiName === t.name);
          if (!traitData) return null;

          const styleInfo = getCorrectTraitStyle(t.name, t.num_units, tftData);

          return {
            name: traitData.name,
            apiName: t.name,
            icon: traitData.icon,
            tier_current: t.num_units,
            styleName: styleInfo.styleName,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.tier_current - a.tier_current);

      return { ...p, units, traits };
    });

    const responsePayload = {
      ...matchDetail,
      info: {
        ...matchDetail.info,
        participants: processedParticipants,
        accounts: Object.fromEntries(accounts),
      },
    };

    res.json(responsePayload);
  } catch (err) {
    next(err);
  }
});

export default router;

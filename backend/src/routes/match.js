// backend/src/routes/match.js

import express from 'express';
import { getMatchDetail } from '../services/riotApi.js';
import { loadTFTData, getTraitBackgroundUrl } from '../services/tftDataService.js';
import { getAccountsByPuuids } from '../services/riotAccountApi.js';

const router = express.Router();

router.get('/:matchId', async (req, res, next) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID가 필요합니다.' });
    }

    const tftData = loadTFTData();
    const matchDetail = await getMatchDetail(matchId);

    if (!tftData || !matchDetail) {
      return res.status(503).json({ error: '데이터 로딩에 실패했습니다.' });
    }

    const puuids = matchDetail.info.participants.map(p => p.puuid);
    const accounts = await getAccountsByPuuids(puuids);

    const processedParticipants = matchDetail.info.participants.map(p => {
      const units = p.units.map(u => {
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

      const traits = (p.traits || [])
        .filter(t => t.style > 0)
        .map(t => {
          const coreTraitNameFromAPI = t.name.toLowerCase().replace(/^(tft\d+_trait_|set\d+_)/, '');
          const traitData = tftData.traits.find(td => {
            if (!td.apiName) return false;
            const coreTraitNameFromData = td.apiName.toLowerCase().replace(/^(trait_icon_\d+_|set\d+_)/, '').replace(/_set\d+$/, '');
            return coreTraitNameFromData === coreTraitNameFromAPI;
          });
          
          if (!traitData) return null;

          return {
              name: traitData.name,
              apiName: t.name,
              icon: traitData.icon,
              tier_current: t.num_units,
              style: t.style,
              backgroundUrl: getTraitBackgroundUrl(t.style),
          };
      }).filter(Boolean).sort((a,b) => b.style - a.style);

      return { ...p, units, traits };
    });

    const responsePayload = {
      ...matchDetail,
      info: {
        ...matchDetail.info,
        participants: processedParticipants,
        accounts: Object.fromEntries(accounts),
      }
    };

    res.json(responsePayload);

  } catch (err) {
    next(err);
  }
});

export default router;
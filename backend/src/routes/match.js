// backend/src/routes/match.js
import express from 'express';
import { getMatchDetail } from '../services/riotApi.js';
// [수정] getTraitStyleInfo 대신 새로운 getCorrectTraitStyle 함수를 가져옵니다.
import { loadTFTData, getCorrectTraitStyle } from '../services/tftDataService.js';
import { getAccountsByPuuids } from '../services/riotAccountApi.js';

const router = express.Router();

router.get('/:matchId', async (req, res, next) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID가 필요합니다.' });
    }

    const tftData = loadTFTData(); // 여기서 로드된 tftData는 이미 가공된 icon/tileIcon URL을 포함합니다.
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
          icon: champData?.tileIcon || champData?.icon, // tftDataService에서 가공된 tileIcon 또는 icon URL을 사용합니다.
          tier: u.tier,
          cost: champData?.cost || 0,
          items: itemData.map(it => ({ name: it.name, icon: it.icon })) // item.icon은 tftDataService에서 이미 가공된 URL입니다.
        };
      });

      const traits = (p.traits || [])
        .filter(t => t.style > 0) // style > 0은 '활성화된 특성'을 의미하므로 이 필터는 유지합니다.
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
        }).filter(Boolean).sort((a,b) => b.tier_current - a.tier_current); // 정렬 기준을 tier_current로 변경 (선택사항)

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
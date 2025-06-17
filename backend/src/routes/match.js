// routes/match.js (최종 수정 완료)

import express from 'express';
import { getMatchDetail } from '../services/riotApi.js';
import getTFTData from '../services/tftData.js';
import { getAccountsByPuuids } from '../services/riotAccountApi.js'; // 여러 계정 정보를 한번에 가져오는 서비스

const router = express.Router();
const cdn = 'https://raw.communitydragon.org/latest/game/';

// summoner.js와 동일한 상수 및 헬퍼 함수
const IDX2KEY = ['inactive', 'bronze', 'silver', 'gold', 'prismatic'];
const STYLE_ORDER = { bronze: 1, silver: 2, gold: 3, prismatic: 4, unique: 4 };
const PALETTE = {
  bronze: '#C67A32', silver: '#BFC4CF', gold: '#FFD667',
  prismatic: '#CFF1F1', unique: '#FFA773',
};
const toPNG = p => p ? `${cdn}${p.toLowerCase().replace(/\.(tex|dds)$/, '.png')}` : null;

router.get('/:matchId', async (req, res, next) => {
  try {
    const { matchId } = req.params;
    if (!matchId) {
      return res.status(400).json({ error: 'Match ID가 필요합니다.' });
    }

    // 1. TFT 마스터 데이터와 경기 상세 정보를 가져옵니다.
    const tft = await getTFTData();
    const matchDetail = await getMatchDetail(matchId);

    if (!tft || !matchDetail) {
      return res.status(503).json({ error: '데이터 로딩에 실패했습니다.' });
    }

    // 2. 해당 경기에 참여한 모든 소환사의 puuid 목록을 만듭니다.
    const puuids = matchDetail.info.participants.map(p => p.puuid);
    // 3. 모든 소환사의 계정 정보를 한번에 가져옵니다.
    const accounts = await getAccountsByPuuids(puuids);

    // 4. 각 참여자의 유닛과 특성 데이터를 summoner.js와 동일한 최종 로직으로 처리합니다.
    const processedParticipants = matchDetail.info.participants.map(p => {
      const units = p.units.map(u => {
        const ch = tft.champions.find(c => c.apiName?.toLowerCase() === u.character_id?.toLowerCase());
        return {
          character_id: u.character_id,
          name: ch?.name || u.character_id, image_url: toPNG(ch?.tileIcon),
          tier: u.tier, cost: ch?.cost || 0,
          items: u.itemNames.map(n => {
            const it = tft.items.find(i => i.apiName?.toLowerCase() === n?.toLowerCase());
            return { name: it?.name || '', image_url: toPNG(it?.icon) };
          }),
        };
      });

      const traitCounts = new Map();
      for (const unit of p.units) {
        const champData = tft.champions.find(c => c.apiName?.toLowerCase() === unit.character_id?.toLowerCase());
        if (champData?.traits) {
          for (const traitName of champData.traits) {
            traitCounts.set(traitName, (traitCounts.get(traitName) || 0) + 1);
          }
        }
      }

      const traits = [];
      for (const [traitName, count] of traitCounts.entries()) {
        const meta = tft.traitMap.get(traitName.toLowerCase());
        if (!meta) continue;

        const cnt = count;
        const rows = Array.isArray(meta.effects) ? meta.effects : [];
        const active = rows.filter(r => cnt >= r.minUnits).sort((a, b) => b.minUnits - a.minUnits)[0] ?? null;
        if (!active) continue;

        let styleKey = active ? (typeof active.style === 'string' ? active.style.toLowerCase() : IDX2KEY[active.style] || 'bronze') : 'bronze';
        const topMin = rows.reduce((m, r) => Math.max(m, r.minUnits), 0);
        if (rows.length >= 4 && styleKey === 'prismatic' && active.minUnits < topMin) styleKey = 'gold';
        if (rows.length === 1 && rows[0].minUnits === 1) styleKey = 'unique';

        const hex = (active?.styleHexColor?.trim()) ?? PALETTE[styleKey] ?? '#4B5563';
        const displayName = tft.krNameMap.get(meta.apiName.toLowerCase()) || meta.name;

        traits.push({
          name: displayName, image_url: toPNG(meta.icon),
          tier_current: cnt, style: styleKey,
          styleOrder: STYLE_ORDER[styleKey], color: hex,
        });
      }
      traits.sort((a, b) => (b.styleOrder - a.styleOrder) || (b.tier_current - a.tier_current));

      return { ...p, units, traits };
    });

    // 5. 최종적으로 가공된 데이터를 응답으로 보냅니다.
    const responsePayload = {
      ...matchDetail,
      info: {
        ...matchDetail.info,
        participants: processedParticipants,
        accounts: Object.fromEntries(accounts), // Map을 JSON으로 보내기 위해 객체로 변환
      }
    };

    res.json(responsePayload);

  } catch (err) {
    next(err);
  }
});

export default router;
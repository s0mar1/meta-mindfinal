// backend/src/routes/ai.js

import express from 'express';
import { getMatchDetail } from '../services/riotApi.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import DeckTier from '../models/DeckTier.js';
import getTFTData from '../services/tftData.js';

// **** 새로 변경된 프롬프트 모듈 임포트 경로 및 이름 ****
import systemRole from '../prompts/common/systemRole.js'; // 공통 시스템 역할
import autoAnalysisContext from '../prompts/autoAnalysis/context.js'; // 자동 분석 컨텍스트
import autoAnalysisFormat from '../prompts/autoAnalysis/format.js';   // 자동 분석 형식
import qnaContext from '../prompts/qna/context.js';                     // Q&A 컨텍스트

const router = express.Router();

// --- Google AI 설정 ---
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!GOOGLE_AI_API_KEY) {
  console.error('GOOGLE_AI_API_KEY가 .env 파일에 없습니다!');
}
const genAI = new GoogleGenerativeAI(GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-04-17" });

// 기존 자동 분석 탭 라우트 (프롬프트 조합 부분 변경)
router.post('/analyze', async (req, res, next) => {
  const { matchId, userPuuid } = req.body;
  if (!matchId || !userPuuid) {
    return res.status(400).json({ error: 'matchId와 userPuuid가 필요합니다.' });
  }

  try {
    const tftData = await getTFTData();
    if (!tftData || !tftData.traitMap || !tftData.champions || !tftData.items) {
      console.error('TFT static data is incomplete or invalid:', tftData);
      throw new Error("TFT 정적 데이터(특성 맵, 챔피언, 아이템)를 로드할 수 없거나 형식이 올바르지 않습니다.");
    }
    
    const matchDetail = await getMatchDetail(matchId);
    if (!matchDetail || !matchDetail.info || !matchDetail.info.participants) {
        console.error('Match detail is incomplete or invalid:', matchDetail);
        return res.status(404).json({ error: '매치 상세 정보를 찾을 수 없습니다.' });
    }

    const userParticipant = matchDetail.info.participants.find(p => p.puuid === userPuuid);
    if (!userParticipant) {
      return res.status(404).json({ error: '해당 게임에서 사용자를 찾을 수 없습니다.' });
    }

    const placement = userParticipant.placement;
    const goldLeft = userParticipant.gold_left !== undefined ? userParticipant.gold_left : '정보 없음';
    const totalDamageToPlayers = userParticipant.total_damage_to_players !== undefined ? userParticipant.total_damage_to_players : '정보 없음';
    const lastRound = userParticipant.last_round !== undefined ? userParticipant.last_round : '정보 없음';

    const userTraits = (userParticipant.traits || []).filter(t => t.style > 0).map(t => {
        const traitInfo = tftData.traitMap.get(t.name.toLowerCase());
        return `${traitInfo ? traitInfo.name : t.name} (${t.tier_current})`;
    }).join(', ');

    const userUnits = (userParticipant.units || []).map(u => {
        const champInfo = tftData.champions.find(c => c.apiName.toLowerCase() === u.character_id.toLowerCase());
        const itemNames = (u.itemNames || []).map(itemName => {
            const itemInfo = tftData.items.find(i => i.apiName.toLowerCase() === itemName.toLowerCase());
            return itemInfo ? itemInfo.name : '';
        }).filter(Boolean);
        return `${champInfo ? champInfo.name : u.character_id} (${u.tier}성) [${itemNames.join(', ')}]`;
    }).join('\n');
    
    let otherParticipantsData = '';
    const otherParticipants = (matchDetail.info.participants || []).filter(p => p.puuid !== userPuuid);
    if (otherParticipants.length > 0) {
        otherParticipantsData += "\n\n[다른 플레이어들의 최종 덱 정보]\n";
        otherParticipants.forEach((p) => {
            const pTraits = (p.traits || []).filter(t => t.style > 0).map(t => {
                const traitInfo = tftData.traitMap.get(t.name.toLowerCase());
                return `${traitInfo ? traitInfo.name : t.name} (${t.tier_current})`;
            }).join(', ');
            const pUnits = (p.units || []).map(u => {
                const champInfo = tftData.champions.find(c => c.apiName.toLowerCase() === u.character_id.toLowerCase());
                const itemNames = (u.itemNames || []).map(itemName => {
                    const itemInfo = tftData.items.find(i => i.apiName.toLowerCase() === itemName.toLowerCase());
                    return itemInfo ? itemInfo.name : '';
                }).filter(Boolean);
                return `${champInfo ? champInfo.name : u.character_id} (${u.tier}성) [${itemNames.join(', ')}]`;
            }).join(', ');

            otherParticipantsData += ` - 플레이어 ${p.placement}위: 활성화 특성: ${pTraits} / 유닛: ${pUnits}\n`;
        });
    }

    const allMetaDecks = await DeckTier.find({ totalGames: { $gte: 3 } })
                                      .sort({ averagePlacement: 1 })
                                      .limit(10);

    let metaDataForAI = '';
    if (allMetaDecks.length > 0) {
      metaDataForAI += "\n\n[현재 챌린저 메타 주요 덱 정보 (MetaMind 분석 데이터)]\n";
      allMetaDecks.forEach((deck, index) => {
        const coreUnitsText = (deck.coreUnits || []).map(cu => {
            const items = cu.recommendedItems?.map(item => item.name).filter(Boolean).join(', ') || '없음';
            return `${cu.name} (${cu.tier}성, ${cu.cost}코) [${items}]`;
        }).join('; ');

        metaDataForAI += `덱 ${index + 1}: ${deck.mainTraitName} ${deck.carryChampionName} (${deck.tierRank}티어, 평균 등수: ${deck.averagePlacement.toFixed(2)})\n`;
        metaDataForAI += `  - 주요 유닛 및 추천 아이템: ${coreUnitsText}\n`;
      });
      metaDataForAI += "\n※ 이 덱들은 현재 챌린저 유저들이 실제로 플레이하며 통계적으로 검증된 덱들입니다. 모든 덱은 잠재적으로 강력합니다.";
    }

    // **** 프롬프트 조합 변경: autoAnalysisContext와 autoAnalysisFormat 사용 ****
    const prompt = `
${systemRole}
${autoAnalysisContext({
  placement,
  lastRound,
  goldLeft,
  totalDamageToPlayers,
  userTraits,
  userUnits,
  otherParticipantsData,
  metaDataForAI,
})}
${autoAnalysisFormat}
`;
    // ************************************************************************
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiResponseText = response.text();
    
    res.json({ analysis: aiResponseText });

  } catch(error) {
    console.error('Error in /api/ai/analyze:', error);
    res.status(500).json({ error: error.message || '서버 내부 오류가 발생했습니다.' });
  }
});

// AI Q&A 라우트 (채팅 형식으로 변경)
router.post('/qna', async (req, res, next) => {
  const { question, chatHistory } = req.body;
  if (!question) {
    return res.status(400).json({ error: '질문 내용이 필요합니다.' });
  }

  if (!Array.isArray(chatHistory)) {
      return res.status(400).json({ error: 'chatHistory는 배열 형식이어야 합니다.' });
  }

  try {
    const tftData = await getTFTData();
    let metaDataForAI = '';
    if (tftData && tftData.traitMap && tftData.champions && tftData.items) {
        const allMetaDecks = await DeckTier.find({ totalGames: { $gte: 3 } })
                                          .sort({ averagePlacement: 1 })
                                          .limit(10);
        if (allMetaDecks.length > 0) {
          metaDataForAI += "\n\n[현재 챌린저 메타 주요 덱 정보 (MetaMind 분석 데이터)]\n";
          allMetaDecks.forEach((deck, index) => {
            const coreUnitsText = (deck.coreUnits || []).map(cu => {
                const items = cu.recommendedItems?.map(item => item.name).filter(Boolean).join(', ') || '없음';
                return `${cu.name} (${cu.tier}성, ${cu.cost}코) [${items}]`;
            }).join('; ');

            metaDataForAI += `덱 ${index + 1}: ${deck.mainTraitName} ${deck.carryChampionName} (${deck.tierRank}티어, 평균 등수: ${deck.averagePlacement.toFixed(2)})\n`;
            metaDataForAI += `  - 주요 유닛 및 추천 아이템: ${coreUnitsText}\n`;
          });
          metaDataForAI += "\n※ 이 덱들은 현재 챌린저 유저들이 실제로 플레이하며 통계적으로 검증된 덱들입니다. 모든 덱은 잠재적으로 강력합니다.";
        }
    } else {
        console.warn('TFT static data not fully loaded for Q&A, AI might have limited context on meta decks.');
    }

    // **** 프롬프트 조합 변경: qnaContext 사용 ****
    // systemRole은 첫 메시지의 parts 배열에 함께 포함
    const combinedQnaContext = qnaContext({
        question,
        chatHistory: chatHistory.map(msg => ({ role: msg.role, content: msg.content })), // Q&A 컨텍스트 함수에 전달
        metaDataForAI
    });

    // chatSession 시작 (history를 전달하여 대화 맥락 유지)
    // systemRole과 qnaSpecificContext를 하나의 메시지로 AI에게 전달
    const chat = model.startChat({
        history: [
            {
                role: 'user',
                // 첫 사용자 메시지에 systemRole과 Q&A 컨텍스트를 모두 포함
                parts: [{ text: `${systemRole}\n\n${combinedQnaContext}` }]
            },
            {
                // AI의 초기 응답 (선택 사항: 제거 가능)
                role: 'model',
                parts: [{ text: '네, 롤토체스 챌린저 전문가로서 최선을 다해 답변해 드리겠습니다. 어떤 질문이든 해주세요!' }]
            }
        ]
    });

    const result = await chat.sendMessage(question); // 사용자의 현재 질문을 보냄
    const response = await result.response;
    const aiResponseText = response.text();
    
    res.json({ answer: aiResponseText });

  } catch(error) {
    console.error('Error in /api/ai/qna:', error);
    if (error.response && error.response.data && error.response.data.error) {
        res.status(500).json({ error: error.response.data.error.message || 'AI 모델 응답 오류 발생' });
    } else {
        res.status(500).json({ error: error.message || '서버 내부 오류가 발생했습니다.' });
    }
  }
});

export default router;
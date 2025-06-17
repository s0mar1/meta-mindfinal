import React, { useState, useEffect } from 'react';
import Trait from './Trait';
import Unit from './Unit';
import MatchDetailContent from './MatchDetailContent';
import axios from 'axios';

const styles = {
  matchCardWrapper: { background: '#FFFFFF', borderLeft: '5px solid',
                      borderRadius: 8, padding: '1rem', marginBottom: '1rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  matchCard : { display: 'flex', gap: '1rem', alignItems: 'center' },
  matchInfo : { flexShrink: 0, width: '70px', textAlign: 'center',
                display: 'flex', flexDirection: 'column', gap: 2 },
  placement : { fontSize: '1.1rem', fontWeight: 'bold' },
  level     : { fontSize: '0.75rem',  color: '#6E6E6E' },
  date      : { fontSize: '0.7rem', color: '#A0AEC0' },
  matchDetails      : { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  matchDetailsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  traitsContainer : { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' },
  unitsContainer: { display: 'flex', flexWrap: 'wrap', gap: '4px' },
  detailButton      : { cursor: 'pointer', background: 'transparent', color: '#6E6E6E',
                        fontSize: '1.5rem', border: 'none', padding: '0.5rem',
                        transition: 'transform .2s' },
  detailViewContainer: { borderTop: '1px solid #E6E6E6', paddingTop: '1rem', marginTop: '1rem' },

  aiAnalysisContainer: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #E6E6E6',
    backgroundColor: '#F9FAFB',
    borderRadius: '4px',
    padding: '15px',
    fontSize: '0.9rem',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap',
    fontFamily: 'Nanum Gothic, sans-serif',
  },
  aiAnalysisTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: '10px',
  },
  aiAnalysisLoading: {
    textAlign: 'center',
    color: '#6E6E6E',
    padding: '15px 0',
  },
  aiAnalysisError: {
    textAlign: 'center',
    color: '#E74C3C',
    padding: '15px 0',
  }
};

const getPlacementColor = p => (p === 1 ? '#F59E0B' : p <= 4 ? '#3B82F6' : '#6B7280');

const MatchCard = ({ match, onToggle, isExpanded }) => {
  const traits = match.traits || [];
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    // isExpanded가 true이고, 아직 AI 분석 결과가 없으며, 로딩 중이거나 에러 상태가 아닐 때만 호출
    if (isExpanded && !aiAnalysis && !aiLoading && !aiError) {
      const fetchAiAnalysis = async () => {
        setAiLoading(true);
        setAiError(null); // 새로운 요청 시 에러 초기화
        try {
          // POST 요청 본문에 matchId와 userPuuid를 전달
          const response = await axios.post('/api/ai/analyze', {
            matchId: match.matchId,
            userPuuid: match.puuid, // SummonerPage.jsx에서 match 객체에 puuid를 추가했으므로 사용 가능
          });
          setAiAnalysis(response.data.analysis);
        } catch (err) {
          console.error("AI 분석 로딩 오류:", err);
          setAiError(err.response?.data?.error || err.message || 'AI 분석을 불러오는데 실패했습니다.');
        } finally {
          setAiLoading(false);
        }
      };
      fetchAiAnalysis();
    }
  }, [isExpanded, match.matchId, match.puuid, aiAnalysis, aiLoading, aiError]); // 의존성 배열에 puuid 추가

  return (
    <div style={{ ...styles.matchCardWrapper, borderLeftColor: getPlacementColor(match.placement) }}>
      <div style={styles.matchCard}>
        <div style={styles.matchInfo}>
          <div style={{ ...styles.placement, color: getPlacementColor(match.placement) }}>#{match.placement}</div>
          <p style={styles.level}>레벨 {match.level}</p>
          {/* **** 중요 수정: toLocaleDateDateString -> toLocaleDateString 오타 수정 **** */}
          <p style={styles.date}>{new Date(match.game_datetime).toLocaleDateString()}</p> 
        </div>
        <div style={styles.matchDetails}>
          <div style={styles.matchDetailsHeader}>
            <div style={styles.traitsContainer}>
              {traits.map((t, index) => (<Trait key={index} trait={t} />))}
            </div>
            <button onClick={() => onToggle(match.matchId)} style={{ ...styles.detailButton, transform: isExpanded ? 'rotate(180deg)' : 'none' }} title={isExpanded ? '간략히' : '상세보기'}>▼</button>
          </div>
          <div style={styles.unitsContainer}>
            {match.units.map((u, idx) => u.image_url && <Unit key={idx} unit={u} />)}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div style={styles.detailViewContainer}>
          <MatchDetailContent matchId={match.matchId} userPuuid={match.puuid} />

          <div style={styles.aiAnalysisContainer}>
            <h4 style={styles.aiAnalysisTitle}>MetaMind AI 분석 피드백</h4>
            {aiLoading && <div style={styles.aiAnalysisLoading}>AI 분석 중입니다...</div>}
            {aiError && <div style={styles.aiAnalysisError}>{aiError}</div>}
            {aiAnalysis && !aiLoading && !aiError && (
              <div>{aiAnalysis}</div>
            )}
            {!aiAnalysis && !aiLoading && !aiError && (
              // AI 분석 결과가 아직 없지만, 로딩/에러 상태가 아닐 때 (아직 요청 안 보냈거나 대기 중)
              // 이 메시지는 로딩 시작 전에 표시될 수 있습니다. 실제 로딩은 isExpanded 시에만 시작됩니다.
              <div style={styles.aiAnalysisLoading}>매치 분석을 위해 AI 피드백을 요청합니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
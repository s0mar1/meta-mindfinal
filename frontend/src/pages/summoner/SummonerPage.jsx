// frontend/src/pages/SummonerPage/SummonerPage.jsx

import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';

import ProfileHeader from './components/ProfileHeader';
import RankedStats from './components/RankedStats.jsx';
import LpGraph from './components/LpGraph.jsx';
import MatchCard from './components/MatchCard';

const styles = {
  container: { paddingTop: '2rem', paddingBottom: '4rem', maxWidth: '960px', margin: '0 auto' },
  statsAndGraphContainer: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1fr) 2fr', // 통계는 최소너비, 그래프는 넓게
    gap: '24px',
    marginBottom: '1.5rem',
    alignItems: 'stretch',
  },
  block: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.12)',
  },
  statsBlock: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.12)',
  },
  error    : { color: '#E74C3C', textAlign: 'center', padding: '2rem', background: '#FFFFFF', borderRadius: 8 },
  loading  : { padding: '2rem', textAlign: 'center', color: '#6E6E6E' },
};

export default function SummonerPage() {
  const { region } = useParams();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error,     setError]   = useState(null);
  const [data,      setData]    = useState(null);
  const [expanded, setExpanded]= useState(null);

  const fetchData = async (force = false) => {
    setLoading(true);
    if (!force) setError(null);

    const gameName = searchParams.get('gameName');
    const tagLine  = searchParams.get('tagLine');

    if (!region || !gameName || !tagLine) {
      setLoading(false);
      setError('URL 파라미터가 부족합니다.');
      return;
    }

    try {
      const qs = new URLSearchParams({ region, gameName, tagLine, forceRefresh: force }).toString();
      const r  = await axios.get(`/api/summoner?${qs}`);
      
      if (r.status !== 200) {
        throw new Error(r.data.error || 'API 오류');
      }
      
      // **** 중요 수정: 각 match 객체에 현재 소환사의 puuid를 추가하여 전달합니다. ****
      // Riot API 응답의 `account` 객체에 puuid가 있다고 가정합니다.
      const currentUserPuuid = r.data.account.puuid; 
      
      const processedMatches = r.data.matches.map(match => ({
          ...match,
          puuid: currentUserPuuid // AI 분석을 위해 puuid 추가
      }));

      setData({
          ...r.data,
          matches: processedMatches
      });
      // ************************************************************************

    } catch (e) {
      setError(e.response?.data?.error || e.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setExpanded(null);
    fetchData(false);
  }, [region, searchParams]);

  if (loading && !data) return <div style={styles.loading}>전적을 불러오는 중입니다...</div>;
  if (error    && !data) return <div style={styles.error}>{error}</div>;
  if (!data)             return null;

  return (
    <div style={styles.container}>
      <ProfileHeader
        account={data.account}
        region={region}
        onRefresh={() => fetchData(true)}
        isRefreshing={loading && !!data}
      />
      <div style={styles.statsAndGraphContainer}>
        <div style={styles.statsBlock}>
          <RankedStats
            league={data.league}
            matches={data.matches || []}
          />
        </div>
        <div style={styles.block}>
          <LpGraph lpHistory={null} />
        </div>
      </div>
      
      {data.matches?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.matches.map(m => (
            <MatchCard
              key={m.matchId}
              match={m} // 이제 m 객체 안에 puuid가 포함되어 전달됩니다.
              onToggle={id => setExpanded(prev => (prev === id ? null : id))}
              isExpanded={expanded === m.matchId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
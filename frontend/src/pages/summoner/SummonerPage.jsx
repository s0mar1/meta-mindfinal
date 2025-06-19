import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';

/* ───────────────────────── 스타일 ───────────────────────── */
const styles = {
  container: { paddingTop: '2rem', paddingBottom: '4rem' },
  error    : { color: '#E74C3C', textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: 8 },
  loading  : { padding: '2rem', textAlign: 'center', color: '#6E6E6E' },

  matchCardWrapper: { background: '#fff', borderLeft: '5px solid', borderRadius: 8, padding: '1rem 1.25rem', marginBottom: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,.05)' },
  matchCard: { display: 'flex', gap: '1.5rem', alignItems: 'center' },

  matchInfo: { flexShrink: 0, width: 90, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 },
  placement: { fontSize: '1.25rem', fontWeight: 'bold' },
  level    : { fontSize: '0.8rem', color: '#6E6E6E' },
  date     : { fontSize: '0.75rem', color: '#A0AEC0' },

  matchDetails: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8 },
  traitsContainer: { display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  traitIconWrapper: { display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 4, fontSize: 13 },
  traitImg : { width: 16, height: 16 },
  traitTier: { fontWeight: 'bold' },

  unitsContainer: { display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  unit     : { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 44, gap: 2 },
  unitImage: { width: 40, height: 40, borderRadius: 4 },

  starsContainer: { display: 'flex', fontSize: '0.8rem', textShadow: '0 0 2px white', height: 12 },
  itemsContainer: { display: 'flex', justifyContent: 'center', gap: 1, height: 14, marginTop: 1 },
  itemImage: { width: 14, height: 14, borderRadius: 2 },
};

/* ───────────────────────── 헬퍼 ───────────────────────── */
const getPlacementColor = (p) => (p === 1 ? '#F59E0B' : p <= 4 ? '#3B82F6' : '#6B7280');
const borderColors = {1:'#6B7280',2:'#16A34A',3:'#3B82F6',4:'#9333EA',5:'#FBBF24'};
const getBorder = (c) => ({ border: `2px solid ${borderColors[c] || borderColors[1]}` });
const costColors = {1:'#A0AEC0',2:'#4ADE80',3:'#60A5FA',4:'#C084FC',5:'#FBBF24'};
const getCostColor = (c) => costColors[c] || costColors[1];
const getTraitStyle = (name) => ({
  bronze   : { bg:'#4a2b16', text:'#CD7F32' },
  silver   : { bg:'#435a70', text:'#C0C0C0' },
  gold     : { bg:'#b37800', text:'#FFD700' },
  prismatic: { bg:'#8636a1', text:'#FF7DFF' },
  chromatic: { bg:'#E13434', text:'#FF6363' },
}[name] || { bg:'#374151', text:'#6E6E6E' });

/* ───────────────────────── 재사용 컴포넌트 ───────────────────────── */
const Trait = ({ trait }) => (
  <div style={{ ...styles.traitIconWrapper, ...getTraitStyle(trait.style) }} title={trait.name}>
    { (trait.image_url || trait.icon) && (
      <img
        src={trait.image_url || trait.icon}
        alt={trait.name}
        style={styles.traitImg}
        onError={(e)=>e.target.style.display='none'}
      />
    )}
    <span style={styles.traitTier}>{trait.tier_current}</span>
  </div>
);

const Item = ({ item }) =>
  (item.image_url || item.icon) && (
    <img
      src={item.image_url || item.icon}
      alt={item.name}
      style={styles.itemImage}
      onError={(e)=>e.target.style.display='none'}
    />
  );

const Unit = ({ unit }) => {
  const cost = unit.cost ?? ((unit.rarity ?? 0) + 1);
  const star = unit.star ?? unit.tier ?? 1;
  return (
    <div style={styles.unit}>
      <div style={{ ...styles.starsContainer, color: getCostColor(cost) }}>{'★'.repeat(star)}</div>
      {(unit.image_url || unit.icon || unit.tileIcon) && (
        <img
          src={unit.image_url || unit.icon || unit.tileIcon}
          alt={unit.character_id}
          style={{ ...styles.unitImage, ...getBorder(cost) }}
          onError={(e)=>e.target.style.display='none'}
        />
      )}
      {unit.items?.length > 0 && (
        <div style={styles.itemsContainer}>
          {unit.items.map((it,i) => <Item key={i} item={it} />)}
        </div>
      )}
    </div>
  );
};

/* ───────────────────────── MatchCard ───────────────────────── */
const MatchCard = ({ match }) => {
  const sortedTraits = [...(match.traits || [])].sort((a,b)=>b.styleOrder - a.styleOrder);
  return (
    <div style={{ ...styles.matchCardWrapper, borderLeftColor: getPlacementColor(match.placement) }}>
      <div style={styles.matchCard}>
        <div style={styles.matchInfo}>
          <div style={{ ...styles.placement, color: getPlacementColor(match.placement) }}>#{match.placement}</div>
          <div style={styles.level}>레벨 {match.level}</div>
          <div style={styles.date}>{match.dateString || new Date(match.game_datetime).toLocaleDateString()}</div>
        </div>
        <div style={styles.matchDetails}>
          <div style={styles.traitsContainer}>
            {sortedTraits.map((t,i) => <Trait key={`${t.apiName}-${i}`} trait={t} />)}
          </div>
          <div style={styles.unitsContainer}>
            {(match.units || []).map((u,i) => <Unit key={`${u.character_id}-${i}`} unit={u} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ───────────────────────── 메인 페이지 ───────────────────────── */
function SummonerPage() {
  const { region } = useParams();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error  , setError]   = useState(null);
  const [data   , setData]    = useState(null);

  useEffect(() => {
    const gameName = searchParams.get('gameName');
    const tagLine  = searchParams.get('tagLine');

    if (!region || !gameName || !tagLine) {
      setLoading(false);
      setError('URL에 gameName 과 tagLine 이 필요합니다.');
      return;
    }

    (async () => {
      setLoading(true); setError(null); setData(null);
      try {
        const qs = new URLSearchParams({ region, gameName, tagLine }).toString();
        const res = await axios.get(`/api/summoner?${qs}`);
        if (res.status !== 200) throw new Error(res.data.error || '알 수 없는 에러');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [region, searchParams]);

  if (loading) return <div style={styles.loading}>전적을 불러오는 중입니다…</div>;
  if (error)   return <div style={styles.error}>{error}</div>;
  if (!data)   return null;

  return (
    <div style={styles.container}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        {data.profile?.gameName ?? data.account?.gameName}#
        {data.profile?.tagLine  ?? data.account?.tagLine}
      </h2>

      {data.matches?.length ? (
        data.matches.map((m, i) => <MatchCard key={`${m.matchId}-${i}`} match={m} />)
      ) : (
        <div style={{ ...styles.loading, background: '#fff', borderRadius: 8 }}>
          최근 랭크 게임 전적이 없습니다.
        </div>
      )}
    </div>
  );
}

export default SummonerPage;

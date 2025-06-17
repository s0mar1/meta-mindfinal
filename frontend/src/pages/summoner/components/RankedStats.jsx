// frontend/src/pages/SummonerPage/components/RankedStats.jsx

import React from 'react';

const styles = {
  header: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    padding: '12px 16px',
    color: '#1f2937',
    borderBottom: '1px solid #e5e7eb',
  },
  content: {
    padding: '20px', // 전체 컨텐츠 패딩
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tierSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px', // 티어 정보와 구분선 사이 간격
  },
  tierIcon: {
    width: '64px',
    height: '64px',
  },
  tierDetails: {},
  tierName: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
  },
  tierLP: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1f2937',
  },
  tierRank: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '2px',
  },
  // [추가] 구분선 스타일
  divider: {
    borderBottom: '1px solid #e5e7eb',
    margin: '0 -20px 16px -20px', // 좌우 패딩을 상쇄하고 아래 여백 추가
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 20px',
    // [수정] 구분선 아래 통계 정보의 padding-top 제거 및 margin-top으로 간격 조절
    // 원래 content padding에 포함되므로, 별도 padding-top은 제거
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  statValue: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#374151',
  },
};

const tierColors = {
    CHALLENGER: '#F4C874', GRANDMASTER: '#CD4545', MASTER: '#9A50B7',
    DIAMOND: '#57A5E8', EMERALD: '#46B386', PLATINUM: '#4E9996',
    GOLD: '#E7C657', SILVER: '#A0B5C0', BRONZE: '#A46628',
    IRON: '#5D5A57', UNRANKED: '#4B5563',
};

const formatTierForURL = (tier) => {
    if (!tier || typeof tier !== 'string') return 'Iron';
    return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
};

const RankedStats = ({ league, matches }) => { // 컴포넌트 이름도 RankedStats로 변경
  if (!league || !matches || matches.length === 0) {
    return (
      <div>
        <h3 style={styles.header}>랭크게임 통계</h3>
        <div style={{padding: '20px', color: '#6b7280'}}>
          최근 랭크 게임 기록이 없습니다.
        </div>
      </div>
    );
  }

  const total = matches.length;
  const wins  = matches.filter(m => m.placement === 1).length;
  const top4  = matches.filter(m => m.placement <= 4).length;
  const avg   = (matches.reduce((s, m) => s + m.placement, 0) / total).toFixed(2);
  const winRate = ((wins / total) * 100).toFixed(1);
  const top4Rate = ((top4 / total) * 100).toFixed(1);

  const tier = league.tier.toUpperCase();
  const formattedTier = formatTierForURL(league.tier);
  const LATEST_DDRAGON_VERSION = '14.12.1';
  const tierIconSrc = `https://ddragon.leagueoflegends.com/cdn/${LATEST_DDRAGON_VERSION}/img/tft-regalia/TFT_Regalia_${formattedTier}.png`;
  const color = tierColors[tier] || tierColors.UNRANKED;

  const statsData = [
    { label: '승리', value: wins }, { label: '승률', value: `${winRate}%` },
    { label: 'Top4', value: top4 }, { label: 'Top4 비율', value: `${top4Rate}%` },
    { label: '게임 수', value: total }, { label: '평균 등수', value: `#${avg}` },
  ];

  return (
    <div>
      <h3 style={styles.header}>랭크게임 통계</h3>
      <div style={styles.content}>
        <div style={styles.tierSection}>
          <img src={tierIconSrc} alt={league.tier} style={styles.tierIcon} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div style={styles.tierDetails}>
            <div style={{ ...styles.tierName, color: color }}>{league.tier}</div>
            <div style={styles.tierLP}>{league.leaguePoints.toLocaleString()} LP</div>
            <div style={styles.tierRank}>상위 0.0001% | 1위 (API 추가 필요)</div>
          </div>
        </div>
        {/* [추가] 구분선 */}
        <div style={styles.divider}></div>
        <div style={styles.statsGrid}>
          {statsData.map(stat => (
            <div key={stat.label} style={styles.statItem}>
              <span style={styles.statLabel}>{stat.label}</span>
              <span style={styles.statValue}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RankedStats; // 컴포넌트 이름 변경 반영
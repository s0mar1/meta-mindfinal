// frontend/src/pages/SummonerPage/components/ProfileHeader.jsx

import React from 'react';
import { useTFTData } from '../../../context/TFTDataContext'; // useTFTData 임포트 추가

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    marginBottom: '1.5rem',
  },
  profileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  profileIcon: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
  },
  nameDetails: {},
  nameContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  profileName: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  regionTag: {
    background: '#F3F4F6',
    color: '#4B5563',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  lastUpdate: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginTop: '4px',
  },
  refreshButton: {
    background: '#3ED2B9',
    color: '#fff',
    fontWeight: 'bold',
    padding: '10px 18px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'opacity .2s',
    fontSize: '0.9rem',
  },
};

const ProfileHeader = ({ account, region, onRefresh, isRefreshing }) => {
  if (!account) return null;

  const { version } = useTFTData(); // version 정보 가져오기

  // Data Dragon에서 프로필 아이콘을 가져오는 URL (DD는 TFT 버전과 관계없이 LoL 버전과 일치)
  // 여기서는 가장 최신 LoL 버전 또는 고정된 안정적인 버전을 사용하는 것이 좋습니다.
  // Riot API는 LoL과 TFT 프로필 아이콘을 공유하며, 보통 LoL 버전으로 관리됩니다.
  // Community Dragon에서 가져오는 경우, `latest`로 고정하는 것이 일반적입니다.
  const accountIcon = `https://ddragon.leagueoflegends.com/cdn/${version || 'latest'}/img/profileicon/${account.profileIconId}.png`;

  return (
    <div style={styles.header}>
      <div style={styles.profileInfo}>
        <img 
          src={accountIcon} 
          alt="profile" 
          style={styles.profileIcon} 
          onError={e => { e.currentTarget.style.display = 'none'; }} 
        />
        <div style={styles.nameDetails}>
          <div style={styles.nameContainer}>
            <h2 style={styles.profileName}>{account.gameName}#{account.tagLine}</h2>
            <span style={styles.regionTag}>{region?.toUpperCase()}</span>
          </div>
          <p style={styles.lastUpdate}>최근 업데이트: 4시간 전 (API 추가 필요)</p>
        </div>
      </div>
      <button onClick={onRefresh} disabled={isRefreshing} style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.5 : 1 }}>
        {isRefreshing ? '갱신 중...' : '전적 갱신'}
      </button>
    </div>
  );
};

export default ProfileHeader;
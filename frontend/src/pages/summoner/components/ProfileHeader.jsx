// frontend/src/pages/SummonerPage/components/ProfileHeader.jsx

import React from 'react';

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

  const accountIcon = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${account.profileIconId}.jpg`;

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
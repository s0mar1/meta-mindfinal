// frontend/src/pages/summoner/components/ProfileHeader.jsx
// ...
import { useTFTData } from '../../../context/TFTDataContext'; // useTFTData 임포트 추가

// ... styles 객체 유지

const ProfileHeader = ({ account, region, onRefresh, isRefreshing }) => { //
  if (!account) return null; //

  const { version } = useTFTData(); // version 정보 가져오기

  // Data Dragon에서 프로필 아이콘을 가져오는 URL (DD는 TFT 버전과 관계없이 LoL 버전과 일치)
  // 여기서는 가장 최신 LoL 버전 또는 고정된 안정적인 버전을 사용하는 것이 좋습니다.
  // Riot API는 LoL과 TFT 프로필 아이콘을 공유하며, 보통 LoL 버전으로 관리됩니다.
  // Community Dragon에서 가져오는 경우, `latest`로 고정하는 것이 일반적입니다.
  const accountIcon = `https://ddragon.leagueofoflegends.com/cdn/${version || 'latest'}/img/profileicon/${account.profileIconId}.png`; // LoL DDragon 프로필 아이콘 URL 사용

  return (
    <div style={styles.header}> //
      <div style={styles.profileInfo}> //
        <img 
          src={accountIcon} 
          alt="profile" 
          style={styles.profileIcon} 
          onError={e => { e.currentTarget.style.display = 'none'; }} 
        />
        <div style={styles.nameDetails}> //
          <div style={styles.nameContainer}> //
            <h2 style={styles.profileName}>{account.gameName}#{account.tagLine}</h2> //
            <span style={styles.regionTag}>{region?.toUpperCase()}</span> //
          </div>
          <p style={styles.lastUpdate}>최근 업데이트: 4시간 전 (API 추가 필요)</p> //
        </div>
      </div>
      <button onClick={onRefresh} disabled={isRefreshing} style={{ ...styles.refreshButton, opacity: isRefreshing ? 0.5 : 1 }}> //
        {isRefreshing ? '갱신 중...' : '전적 갱신'} //
      </button>
    </div>
  );
};

export default ProfileHeader; //
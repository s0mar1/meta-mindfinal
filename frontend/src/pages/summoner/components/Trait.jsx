// frontend/src/pages/summoner/components/Trait.jsx
import React from 'react';

const styles = {
  traitGroup: {
    position: 'relative',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitIcon: {
    position: 'relative',
    width: '20px',
    height: '20px',
    zIndex: 2,
    filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.8))', // 아이콘에도 그림자 추가
  },
  traitCount: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    borderRadius: '50%',
    width: '14px',
    height: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
  },
};

const Trait = ({ trait }) => {
  if (!trait?.icon) {
    return null; // 데이터가 없으면 렌더링하지 않음
  }
  
  // ======================= [핵심 수정] =======================
  // 백엔드에서 받은 style 이름(bronze, silver 등)에 따라 CSS 클래스를 결정합니다.
  const styleClassName = `hexagon-${trait.style || 'bronze'}`;
  // ==========================================================

  return (
    <div style={styles.traitGroup} title={`${trait.name} (${trait.tier_current})`}>
      {/* 이제 배경은 CSS 클래스로 렌더링합니다. */}
      <div className={`hexagon-bg ${styleClassName}`} />
      <img src={trait.icon} alt={trait.name} style={styles.traitIcon} />
      <div style={styles.traitCount}>
        {trait.tier_current}
      </div>
    </div>
  );
};

export default Trait;
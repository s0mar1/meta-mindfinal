import React from 'react';

// ⭐️ 스타일 객체를 대폭 단순화하고, 배경 이미지를 사용하도록 변경합니다.
const styles = {
  traitGroup: {
    position: 'relative',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  traitBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  traitIcon: {
    position: 'relative',
    width: '20px',
    height: '20px',
    zIndex: 2,
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
  // ⭐️ trait.icon (특성 문양)과 trait.backgroundUrl (육각 배경)을 모두 사용합니다.
  const iconSrc  = trait.icon;
  const backgroundSrc = trait.backgroundUrl;

  if (!iconSrc || !backgroundSrc) {
    return null; // 데이터가 없으면 렌더링하지 않음
  }

  return (
    <div style={styles.traitGroup} title={`${trait.name} (${trait.tier_current})`}>
      <img src={backgroundSrc} alt="" style={styles.traitBackground} />
      <img src={iconSrc} alt={trait.name} style={styles.traitIcon} />
      <div style={styles.traitCount}>
        {trait.tier_current}
      </div>
    </div>
  );
};

export default Trait;
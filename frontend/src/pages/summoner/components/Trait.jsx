import React from 'react';

const styles = {
  traitGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  traitHexagon: {
    width: '32px',
    height: '32px',
    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  traitImg: {
    width: '20px',
    height: '20px',
  },
  traitCountBox: {
    height: '26px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: '18px',
    paddingRight: '8px',
    borderRadius: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#fff',
    textShadow: '1px 1px 1px rgba(0,0,0,0.5)',
    marginLeft: '-15px',
    zIndex: 1,
  },
};

const Trait = ({ trait, showCount = true }) => {
  const color = trait.color || '#4A5563';
  const slug = trait.name.toLowerCase().replace(/\s+/g, '');
  const fallback = `https://raw.communitydragon.org/latest/game/assets/ux/traiticons/trait_icon_14_${slug}.png`;
  const iconSrc  = trait.image_url || fallback;

  const HexagonWithBorder = (
    <div style={{ ...styles.traitHexagon, backgroundColor: color }}>
      <div style={{ ...styles.traitHexagon, width: '28px', height: '28px', backgroundColor: `${color}99` }}>
        <img src={trait.icon} alt={trait.name} style={styles.traitImg} />
      </div>
    </div>
  );

  if (!showCount) {
    return (<div title={trait.name}>{HexagonWithBorder}</div>);
  }

  return (
    <div style={styles.traitGroup} title={`${trait.name} (${trait.tier_current})`}>
      {HexagonWithBorder}
      <div style={{...styles.traitCountBox, backgroundColor: `${color}66`, border: `1.5px solid ${color}`}}>
        {trait.tier_current}
      </div>
    </div>
  );
};

export default Trait;
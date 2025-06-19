// frontend/src/pages/summoner/components/Unit.jsx

import React from 'react';
import Item from './Item';
import { useTFTData } from '../../../context/TFTDataContext'; // ⬅️ 1. Context 훅 임포트

const styles = {
  unit : { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 42, gap: 2, cursor: 'pointer' }, // cursor 추가
  unitImage : { width: 42, height: 42, borderRadius: '4px' },
  starsContainer: { display: 'flex', fontSize: '0.8rem', textShadow: '0 0 2px #fff', height: 12 },
  itemsContainer: { display: 'flex', justifyContent: 'center', gap: 2, height: 14, marginTop: 1 },
};

const costColors = { 1:'#6B7280', 2:'#16A34A', 3:'#3B82F6', 4:'#9333EA', 5:'#FBBF24' };
const getCostBorderStyle = c => ({ border: `2px solid ${costColors[c] || costColors[1]}` });
const getCostColor       = c => costColors[c] || costColors[1];

// frontend/src/pages/summoner/components/Unit.jsx

// ... 상단 코드 생략 ...
const Unit = ({ unit }) => {
  const { champions, showTooltip, hideTooltip } = useTFTData();
  const championDetails = champions.find(c => c.apiName === unit.character_id);

  const handleMouseEnter = (e) => {
    if (championDetails) {
      showTooltip(championDetails, e);
    }
  };

  return (
    <div
      style={styles.unit}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={hideTooltip}
    >
      <div style={{ ...styles.starsContainer, color: getCostColor(unit.cost) }}>{'★'.repeat(unit.tier)}</div>
      {/* [핵심 수정] image_url -> icon */}
      <img src={unit.image_url || unit.icon || unit.tileIcon} alt={unit.name} style={{ ...styles.unitImage, ...getCostBorderStyle(unit.cost) }} />
      <div style={styles.itemsContainer}>{unit.items.map((it, idx) => it.icon && <Item key={idx} item={it} />)}</div>
    </div>
  );
};

export default Unit;
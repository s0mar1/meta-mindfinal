// frontend/src/pages/summoner/components/Trait.jsx
import React from 'react';

const Trait = ({ trait }) => {
  // [수정] 백엔드에서 가공된 데이터(icon과 styleName)가 없으면 렌더링하지 않음
  if (!trait?.icon || !trait.styleName) {
    return null;
  }

  // [수정] 백엔드에서 받은 styleName(bronze, silver 등)으로 CSS 클래스 이름을 동적으로 생성
  const backgroundClassName = `trait-hexagon-background trait-${trait.styleName}`;

  return (
    <div className="trait-hexagon" title={`${trait.name} (${trait.tier_current})`}>
      {/* 동적으로 생성된 클래스를 적용 */}
      <div className={backgroundClassName} />
      <img src={trait.icon} alt={trait.name} className="trait-hexagon-icon" />
      <div className="trait-hexagon-count">
        {trait.tier_current}
      </div>
    </div>
  );
};

export default Trait;
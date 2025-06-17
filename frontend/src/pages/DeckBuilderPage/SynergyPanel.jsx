import React, { useMemo } from 'react';
import { useTFTData } from '../../context/TFTDataContext';

export default function SynergyPanel({ placedUnits }) {
  const { traits: allTraits } = useTFTData();

  const traitCount = useMemo(() => {
    const cnt = {};
    Object.values(placedUnits).forEach(u => {
      // u.traits는 TFTDataContext에서 가져온 챔피언 원본 데이터의 'traits' 필드 (apiName 배열)여야 합니다.
      if (u.traits && Array.isArray(u.traits)) {
        u.traits.forEach(traitApiName => {
          cnt[traitApiName] = (cnt[traitApiName] || 0) + 1;
        });
      } else {
          // 💡 디버깅 로그: 챔피언에 traits 정보가 없거나 배열이 아닐 경우 경고
          console.warn(`[SynergyPanel] 챔피언 '${u.name}' (API: ${u.apiName})에 traits 정보가 없거나 배열이 아닙니다.`, u.traits);
      }
    });
    return cnt;
  }, [placedUnits]);

  const displayedSynergies = useMemo(
    () => {
      if (!allTraits) return [];
      const num2key   = ['none','bronze','silver','gold','prismatic'];
      const styleRank = { prismatic:4, gold:3, silver:2, bronze:1, unique:4, none:0 };

      // 필드에 있는 챔피언들의 apiName을 기반으로 관련된 모든 특성 apiName을 수집
      const relevantTraitApiNames = new Set();
      Object.values(placedUnits).forEach(unit => {
          if (unit.traits) {
              unit.traits.forEach(traitApiName => relevantTraitApiNames.add(traitApiName));
          }
      });
      // 💡 디버깅 로그: relevantTraitApiNames 확인
      // console.log("[SynergyPanel] Relevant Trait API Names:", Array.from(relevantTraitApiNames));


      const calculatedTraits = allTraits
        // 오직 relevantTraitApiNames에 포함된 특성만 필터링하여 표시
        .filter(tr => relevantTraitApiNames.has(tr.apiName))
        .map(tr => {
          const count = traitCount[tr.apiName] || 0; // tr.apiName과 traitCount의 키(apiName)가 매칭되어야 함
          
          let currentThreshold = 0;
          let activeStyleKey = 'none';
          let activeStyleOrder = 0;
          let nextThreshold = null;
          let nextStyleKey = null;

          const sortedEffects = [...tr.effects].sort((a,b) => a.minUnits - b.minUnits);

          for (let i = 0; i < sortedEffects.length; i++) {
              const effect = sortedEffects[i];
              if (count >= effect.minUnits) {
                  currentThreshold = effect.minUnits;
                  activeStyleKey = (typeof effect.style === 'number')
                      ? (num2key[effect.style] || 'bronze')
                      : (effect.style?.toLowerCase() || 'bronze');
                  activeStyleOrder = styleRank[activeStyleKey] || 0;
              } else {
                  if (nextThreshold === null && effect.minUnits > 0) {
                      nextThreshold = effect.minUnits;
                      nextStyleKey = (typeof effect.style === 'number')
                          ? (num2key[effect.style] || 'bronze')
                          : (effect.style?.toLowerCase() || 'bronze');
                  }
              }
          }

          const isUniqueTrait = sortedEffects.length === 1 && sortedEffects[0].minUnits === 1;

          if (isUniqueTrait) {
              if (count >= 1) {
                  activeStyleKey = 'unique';
                  activeStyleOrder = styleRank['unique'];
                  currentThreshold = 1;
                  nextThreshold = null;
              } else {
                  nextThreshold = 1;
                  nextStyleKey = 'unique';
              }
          }

          const isActive = count >= currentThreshold && currentThreshold > 0;

          return {
            name: tr.name,
            apiName: tr.apiName,
            icon: tr.icon,
            tier_current: count,
            currentThreshold: currentThreshold,
            nextThreshold: nextThreshold,
            activeStyle: activeStyleKey,
            nextStyle: nextStyleKey,
            styleOrder: activeStyleOrder,
            isActive: isActive,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
          if (b.styleOrder !== a.styleOrder) return b.styleOrder - a.styleOrder;
          return b.tier_current - a.tier_current;
        });
        
        // 💡 디버깅 로그: 계산된 시너지 목록 확인
        // console.log("[SynergyPanel] Calculated Synergies:", calculatedTraits);

        return calculatedTraits;
    },
    [allTraits, placedUnits, traitCount]
  );

  const getSynergyColor = (style) => {
    switch (style) {
        case 'bronze': return '#CD7F32';
        case 'silver': return '#C0C0C0';
        case 'gold': return '#FFD700';
        case 'prismatic': return '#B9F2FF';
        case 'unique': return '#FFA773';
        default: return '#4A5563';
    }
  };

  const getLightGrayColor = (style) => {
      switch (style) {
          case 'bronze': return '#8D6E63';
          case 'silver': return '#9E9E9E';
          case 'gold': return '#FFD54F';
          case 'prismatic': return '#A7D9E0';
          case 'unique': return '#E0B28C';
          default: return '#6E6E6E';
      }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white h-full overflow-y-auto">
      <h2 className="mb-2 font-bold text-xl">시너지</h2>
      {displayedSynergies.length === 0 ? (
        <p className="text-gray-400 text-sm">배치된 유닛이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {displayedSynergies.map(tr => (
            <li 
              key={tr.apiName}
              className={`flex items-center gap-2 text-sm p-1 rounded ${tr.isActive ? 'text-white' : 'text-gray-400'}`}
              style={tr.isActive ? { backgroundColor: getSynergyColor(tr.activeStyle) } : {}}
            >
              {tr.icon && 
                <img 
                  src={tr.icon} 
                  alt={tr.name} 
                  className={`w-6 h-6 rounded-full ${tr.isActive ? '' : 'opacity-50'}`}
                  style={tr.isActive ? {} : { filter: `grayscale(100%) brightness(0.8) sepia(1) hue-rotate(180deg) saturate(0.5) contrast(0.8)` }}
                />
              }
              <div className="flex-grow">
                <span className="font-semibold" style={tr.isActive ? {} : { color: getLightGrayColor(tr.nextStyle || tr.activeStyle) }}>{tr.name}</span>
              </div>
              <div className="text-right font-bold">
                {tr.isActive ? (
                    <span style={{ color: getSynergyColor(tr.activeStyle) }}>{tr.tier_current} / {tr.currentThreshold}</span>
                ) : (
                    <span style={{ color: getLightGrayColor(tr.nextStyle || tr.activeStyle) }}>{tr.tier_current} / {tr.nextThreshold || 'N/A'}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
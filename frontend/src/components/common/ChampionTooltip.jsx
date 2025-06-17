import React from 'react';
import PropTypes from 'prop-types';

// 비용별 색상
const costColors = {
  1: '#808080',
  2: '#1E823C',
  3: '#156293',
  4: '#87259E',
  5: '#B89D29',
};
const getCostColor = cost => costColors[cost] || costColors[1];

/**
 * @param {{ champion?: object, position: { x: number, y: number } }} props
 */
export default function ChampionTooltip({ champion, position }) {
  // champion이 없거나 null이면 아예 렌더하지 않음
  if (!champion) return null;

  const {
    name = '',
    cost = 1,
    traits = [],
    stats = {},
    abilities = [],
  } = champion;

  if (!name) return null;

  const ability = abilities[0];

  return (
    <div
      className="fixed z-50 w-80 p-4 bg-gray-800 border border-gray-600 rounded-lg shadow-lg text-white text-sm pointer-events-none"
      style={{ top: position.y, left: position.x }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-bold text-lg" style={{ color: getCostColor(cost) }}>
          {name}
        </h3>
        <span className="font-bold" style={{ color: getCostColor(cost) }}>
          ● {cost}코스트
        </span>
      </div>

      {/* 특성 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {traits.length > 0 ? (
          traits.map(tr => (
            <span key={tr} className="bg-gray-700 px-2 py-1 rounded text-xs">
              {tr}
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">특성 정보 없음</span>
        )}
      </div>

      {/* 스킬 */}
      {ability && (
        <div className="mb-3">
          <p className="font-bold text-yellow-400">{ability.name}</p>
          <p className="text-gray-400 text-xs mb-1">
            마나:{' '}
            {stats.initialMana != null && stats.mana != null
              ? `${stats.initialMana}/${stats.mana}`
              : '없음'}
          </p>
          <p className="text-xs" dangerouslySetInnerHTML={{ __html: ability.desc }} />
        </div>
      )}

      {/* 추천 아이템 (추후 구현) */}
      <div>
        <p className="font-bold mb-1">추천 아이템</p>
        <div className="flex gap-1">
          {/* */}
        </div>
      </div>
    </div>
  );
}

ChampionTooltip.propTypes = {
  champion: PropTypes.shape({
    name: PropTypes.string,
    cost: PropTypes.number,
    traits: PropTypes.arrayOf(PropTypes.string),
    stats: PropTypes.shape({
      initialMana: PropTypes.number,
      mana: PropTypes.number,
    }),
    abilities: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        desc: PropTypes.string,
      })
    ),
  }),
  position: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
  }).isRequired,
};

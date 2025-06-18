// ===== File: frontend/src/pages/DeckBuilderPage/UnitPanel.jsx =====
import React, { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../constants';
import { useTFTData } from '../../context/TFTDataContext';

// 코스트별 테두리 색상 정의
const COST_COLORS = {
  1: '#808080',
  2: '#1E823C',
  3: '#156293',
  4: '#87259E',
  5: '#B89D29'
};

function DraggableUnit({ champion }) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.UNIT,
      item: { championApiName: champion.apiName },
      collect: monitor => ({ isDragging: monitor.isDragging() })
    }),
    [champion]
  );

  // tileIcon 없으면 렌더링
  if (!champion?.tileIcon) return null;

  // .tex → .png 치환
  const iconUrl = champion.tileIcon.replace(/\.tex$/i, '.png');
  const borderColor = COST_COLORS[champion.cost] || COST_COLORS[1];
  const displayName = (champion.name_ko ?? champion.name ?? '').trim();

  return (
    <div
      ref={drag}
      className={`relative rounded-md overflow-hidden shadow-md cursor-grab ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      style={{ width: 47, height: 47, border: `2px solid ${borderColor}` }}
      title={displayName}
    >
      <img
        src={iconUrl}
        alt={displayName}
        onError={e => { e.currentTarget.src = '/fallback-champion.png'; }}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-white text-[0.6rem] leading-none py-0.5 truncate">
        {displayName}
      </div>
      <div className="absolute top-0 left-0 bg-gray-900 bg-opacity-75 text-white text-xs px-0.5 rounded-br-md">
        {champion.cost}
      </div>
    </div>
  );
}

export default function UnitPanel() {
  const { champions, loading } = useTFTData();
  const [filterCost, setFilterCost] = useState(null);
  const [search, setSearch] = useState('');

  // 필터링 (널 안전)
  const filtered = useMemo(() => {
    if (!champions) return [];
    const kw = search.toLowerCase();
    return champions
      .filter(c => !filterCost || Number(c.cost) === filterCost)
      .filter(c => (c.name_ko ?? c.name ?? '').toLowerCase().includes(kw));
  }, [champions, filterCost, search]);

  if (loading) return <div className="text-gray-300">유닛 목록 로딩 중...</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white h-full overflow-y-auto">
      {/* 필터/검색 UI 생략 */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-x-1 gap-y-2">
        {filtered.map(ch => <DraggableUnit key={ch.apiName} champion={ch} />)}
      </div>
    </div>
  );
}

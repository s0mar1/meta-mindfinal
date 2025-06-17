import React, { useState, useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../constants';
import { useTFTData } from '../../context/TFTDataContext';

// 챔피언 코스트별 테두리 색상 정의
const COST_COLORS = {
  1: '#808080', // 회색
  2: '#1E823C', // 초록
  3: '#156293', // 파랑
  4: '#87259E', // 보라
  5: '#B89D29'  // 노랑
};

function DraggableUnit({ champion }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.UNIT,
    item: { championApiName: champion.apiName }, // Drag 아이템에 championApiName으로 변경하여 전달
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  }), [champion]);

  if (!champion || !champion.tileIcon) {
    return null;
  }

  // 코스트에 맞는 테두리 색상 적용
  const borderColor = COST_COLORS[champion.cost] || COST_COLORS[1];

  return (
    <div
      ref={drag}
      className={`relative rounded-md overflow-hidden shadow-md cursor-grab
                  ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      // 기물 크기를 약 47px로 조절 (45px * 1.05)
      style={{ width: '47px', height: '47px', border: `2px solid ${borderColor}` }}
      title={champion.name}
    >
      <img
        src={champion.icon}
        alt={champion.name}
        className="w-full h-full object-cover"
      />
      {/* 챔피언 이름 표시 */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-75 text-white text-center text-[0.6rem] leading-none py-0.5 truncate">
        {champion.name}
      </div>
      {/* 코스트 표시 (이전 위치에서 이름 안쪽으로 이동) */}
      <div className={`absolute top-0 left-0 bg-gray-900 bg-opacity-75 text-white text-xs px-0.5 rounded-br-md`}>
        ${champion.cost}
      </div>
    </div>
  );
}

export default function UnitPanel() {
  const { champions, loading } = useTFTData();
  const [filterCost, setFilterCost] = useState(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!champions) return [];
    return champions
      .filter(c => !filterCost || Number(c.cost) === filterCost)
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  }, [champions, filterCost, search]);

  if (loading) {
    return <div className="text-gray-300">유닛 목록 로딩 중...</div>;
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white h-full overflow-y-auto">
      <h2 className="mb-2 font-bold text-xl">유닛 목록</h2>
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setFilterCost(null)}
          className={`px-2 py-1 rounded text-sm ${filterCost === null ? 'bg-white text-black' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          All
        </button>
        {[1, 2, 3, 4, 5].map(cost => (
          <button
            key={cost}
            onClick={() => setFilterCost(cost)}
            className={`px-2 py-1 rounded text-sm ${filterCost === cost ? 'bg-blue-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            ${cost}
          </button>
        ))}
      </div>
      <input
        type="text"
        placeholder="챔피언 이름 검색..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full p-1 mb-2 text-black rounded bg-gray-200"
      />
      {/* gap-x를 더 줄여 좌우 간격 조절, gap-y는 유지 */}
      <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-x-1 gap-y-2">
        {filtered.map(ch => (
          <DraggableUnit key={ch.apiName} champion={ch} />
        ))}
      </div>
    </div>
  );
}
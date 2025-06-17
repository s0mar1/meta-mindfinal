import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../../constants';

// 챔피언 코스트별 테두리 색상 정의 (PlacedUnit과 동일하게 유지)
const COST_COLORS = {
    1: '#808080', // 회색
    2: '#1E823C', // 초록
    3: '#156293', // 파랑
    4: '#87259E', // 보라
    5: '#B89D29'  // 노랑
};

export default function DetailPanel({
  selectedUnit,
  onUnitRemove,
  onChangeStar,
  onEquip,
  onUnequip,
}) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.ITEM,
    drop: ({ item }) => {
      if (selectedUnit) {
        onEquip(selectedUnit.pos, item);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
    }),
  });

  if (!selectedUnit) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg text-gray-400">
        선택된 유닛이 없습니다.
      </div>
    );
  }

  // 코스트에 맞는 테두리 색상
  const unitBorderColor = COST_COLORS[selectedUnit.cost] || COST_COLORS[1];

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white space-y-4">
      <div className="flex justify-between items-start mb-3">
        {/* 선택된 유닛의 초상화와 이름 */}
        <div className="flex items-center gap-3">
            <img 
                src={selectedUnit.icon}
                alt={selectedUnit.name} 
                className="w-16 h-16 rounded-md" 
                style={{ border: `2px solid ${unitBorderColor}`}} // 코스트 테두리 적용
            />
            <div>
                <h2 className="text-xl font-bold">{selectedUnit.name}</h2>
                {/* 별 등급 변경 */}
                <div>
                    {[1, 2, 3].map(star => (
                    <span
                        key={star}
                        className={
                        selectedUnit.star >= star
                            ? 'text-yellow-300'
                            : 'text-gray-600'
                        }
                        style={{ cursor: 'pointer', fontSize: '1.5rem' }}
                        onClick={() => onChangeStar(selectedUnit.pos, star)}
                    >
                        ★
                    </span>
                    ))}
                </div>
            </div>
        </div>
        <button
          onClick={() => onUnitRemove(selectedUnit.pos)}
          className="text-red-400 hover:text-red-600 text-2xl font-bold"
          title="유닛 제거"
        >
          ×
        </button>
      </div>

      {/* 아이템 드롭존 */}
      <div className="text-lg font-semibold mb-2">장착 아이템</div>
      <div
        ref={drop}
        className={`flex gap-2 p-2 rounded border-2 ${
          isOver && canDrop
            ? 'border-green-400 bg-gray-700'
            : 'border-gray-600'
        }`}
      >
        {selectedUnit.items.map(it => (
          <div key={it.apiName} className="w-12 h-12 relative">
            <img src={it.icon} alt={it.name} className="w-full h-full" />
            <button
              onClick={() => onUnequip(selectedUnit.pos, it)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs cursor-pointer"
              title="아이템 제거"
            >
              x
            </button>
          </div>
        ))}
        {Array.from({ length: 3 - selectedUnit.items.length }).map((_, i) => (
          <div key={i} className="w-12 h-12 bg-gray-900 rounded" />
        ))}
      </div>
    </div>
  );
}
import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { ItemTypes } from '../../constants';

const HEX_CLIP = [
  '50% 0%',
  '100% 25%',
  '100% 75%',
  '50% 100%',
  '0% 75%',
  '0% 25%'
].join(',');

const COST_COLORS = {
  1: '#808080',
  2: '#1E823C',
  3: '#156293',
  4: '#87259E',
  5: '#B89D29'
};

export default function HexGrid({
  placedUnits,
  onUnitAction,
  onSelectUnit,
  onUnitRemove,
  selectedKey
}) {
  const ROWS = 5;
  const COLS = 7;
  const CELL = { w: 80, h: 92 };
  const SPACING = 8;

  const WIDTH = COLS * (CELL.w + SPACING) + CELL.w / 2;
  const HEIGHT = ROWS * ((CELL.h * 0.75) + SPACING) + CELL.h * 0.25;

  const coords = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      coords.push({ x, y });
    }
  }

  return (
    <div className="relative" style={{ width: WIDTH, height: HEIGHT }}>
      {coords.map(({ x, y }) => (
        <HexCell
          key={`${y}-${x}`}
          x={x} y={y}
          CELL={CELL}
          SPACING={SPACING}
          onUnitAction={onUnitAction}
        />
      ))}

      {Object.entries(placedUnits).map(([key, unit]) => {
        const [y, x] = key.split('-').map(Number);
        return (
          <PlacedUnit
            key={key}
            unit={unit}
            pos={{ x, y }}
            CELL={CELL}
            SPACING={SPACING}
            isSelected={key === selectedKey}
            onUnitAction={onUnitAction}
            onSelectUnit={onSelectUnit}
            onUnitRemove={onUnitRemove}
          />
        );
      })}
    </div>
  );
}

function HexCell({ x, y, CELL, SPACING, onUnitAction }) {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [ItemTypes.UNIT, ItemTypes.PLACED_UNIT],
    drop: (item) => {
      // item 객체의 구조를 정확히 파악하여 apiName 추출
      // UnitPanel의 DraggableUnit에서는 { championApiName: ... } 형태로 옴
      // PlacedUnit에서는 { unit: ..., fromKey: ... } 형태로 옴
      const championApiName = item.championApiName || item.unit?.apiName;
      const fromKey = item.fromKey;
      const unit = item.unit; // PlacedUnit에서 이동할 때 원본 unit 데이터 전달

      // onUnitAction에 championApiName과 (이동 시) 기존 unit 정보 전달
      onUnitAction({ championApiName: championApiName, fromKey: fromKey, unit: unit }, { x, y });
    },
    collect: m => ({
      isOver: m.isOver({ shallow: true }),
      canDrop: m.canDrop(),
    }),
  });

  const offsetX = y % 2 ? CELL.w / 2 + SPACING / 2 : 0;
  const left = x * (CELL.w + SPACING) + offsetX;
  const top = y * ((CELL.h * 0.75) + SPACING);

  const borderColor = isOver && canDrop ? '#ffd700' : '#1f2937';

  return (
    <div
      ref={drop}
      className="absolute"
      style={{ left, top, width: CELL.w, height: CELL.h }}
    >
      <div
        className="w-full h-full"
        style={{
          clipPath: `polygon(${HEX_CLIP})`,
          backgroundColor: '#2d323d',
          border: `2px solid ${borderColor}`,
        }}
      />
    </div>
  );
}

function PlacedUnit({
  unit, pos, CELL, SPACING,
  isSelected,
  onUnitAction, onSelectUnit, onUnitRemove
}) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PLACED_UNIT,
    // item에 unit 전체를 전달하여 onUnitAction에서 기존 unit의 star/items를 유지할 수 있도록 함
    item: { unit: unit, fromKey: `${pos.y}-${pos.x}` },
    collect: m => ({ isDragging: m.isDragging() }),
  });

  const offsetX = pos.y % 2 ? CELL.w / 2 + SPACING / 2 : 0;
  const left = pos.x * (CELL.w + SPACING) + offsetX;
  const top = pos.y * ((CELL.h * 0.75) + SPACING);

  const BORDER = 3;
  const cost = Number(unit.cost) || 1;
  const borderColor = COST_COLORS[cost];

  return (
    <div
      ref={drag}
      className="absolute cursor-pointer"
      onClick={() => onSelectUnit(pos)}
      onContextMenu={e => {
        e.preventDefault();
        onUnitRemove(pos);
      }}
      style={{
        left, top,
        width: CELL.w,
        height: CELL.h,
        opacity: isDragging ? 0.5 : 1,
        clipPath: `polygon(${HEX_CLIP})`,
        boxSizing: 'border-box',
        backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
        border: `${BORDER}px solid ${borderColor}`,
        zIndex: 10, // Ensure unit is above the hex cell
      }}
    >
      <img
        src={unit.tileIcon}
        alt={unit.name}
        className="w-full h-full object-cover"
        style={{ clipPath: 'inherit' }}
      />
      {/* 롤체지지 스타일: 유닛 상단 별, 하단 아이템 */}
      {unit.star > 0 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex gap-px text-yellow-300 text-base font-bold z-20" style={{ textShadow: '0 0 2px black' }}>
          {'★'.repeat(unit.star)}
        </div>
      )}
      {unit.items && unit.items.length > 0 && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex justify-center gap-px z-20">
          {unit.items.slice(0, 3).map((item, idx) => item.icon && (
            <img key={idx} src={item.icon} alt={item.name} className="w-5 h-5 rounded-sm" title={item.name} />
          ))}
        </div>
      )}
    </div>
  );
}
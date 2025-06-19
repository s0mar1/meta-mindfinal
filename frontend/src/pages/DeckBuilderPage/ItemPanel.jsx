// frontend/src/pages/DeckBuilderPage/ItemPanel.jsx

import React, { useMemo } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../constants';
import { useTFTData } from '../../context/TFTDataContext';

function DraggableItem({ item }) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ITEM,
    item: { item },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  return (
    <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1, cursor: 'move', width: 40, height: 40, margin: 2 }} title={item.name} >
      <img src={item.icon} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

export default function ItemPanel() {
  const { items: allItems, augments: allAugments, loading } = useTFTData();

  const categorizedItems = useMemo(() => {
    const components = [];
    const completed = [];
    const emblems = [];
    const artifacts = [];
    const radiants = [];
    const supports = [];

    const spatulaApiName = 'TFT_Item_Spatula';

    if (allItems) {
      allItems.forEach(item => {
        const from = item.composition || [];
        
        // Data Dragon 데이터 기준 분류 로직
        // Data Dragon의 'tags' 필드 또는 name을 기준으로 분류합니다.
        // Community Dragon 데이터는 tags 필드 대신 item.desc에서 'radiant' 등을 찾거나 별도의 로직 필요.
        // 현재는 Data Dragon의 태그가 있다고 가정합니다.
        if (item.tags?.includes('radiant')) {
          radiants.push(item);
        } else if (item.tags?.includes('support')) {
          supports.push(item);
        } else if (item.tags?.includes('emblem') || from.includes(spatulaApiName)) {
          emblems.push(item);
        } else if (from.length > 0) {
            completed.push(item);
        } else {
          if (item.tags?.includes('component')) {
            components.push(item);
          } else if (item.unique) { // Data Dragon items.json의 unique 필드 (예: 오른템)
            artifacts.push(item);
          }
        }
      });
    }

    return { components, completed, emblems, artifacts, radiants, supports, augments: allAugments || [] };
  }, [allItems, allAugments]);

  if (loading) return <div className="text-gray-300">아이템 목록 로딩 중...</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg text-white space-y-4 h-full overflow-y-auto">
      <h2 className="text-xl font-bold">아이템 목록</h2>
      <ItemCategory title="재료 아이템" items={categorizedItems.components} />
      <ItemCategory title="완성 아이템" items={categorizedItems.completed} />
      <ItemCategory title="상징" items={categorizedItems.emblems} />
      <ItemCategory title="유물 (오른)" items={categorizedItems.artifacts} />
      <ItemCategory title="지원 아이템" items={categorizedItems.supports} />
      <ItemCategory title="찬란한 아이템" items={categorizedItems.radiants} />
      <ItemCategory title="증강체" items={categorizedItems.augments} />
    </div>
  );
}

const ItemCategory = ({ title, items }) => {
  if (!items || items.length === 0) return null;
  return (
    <section>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="flex flex-wrap">
        {items.map(item => ( <DraggableItem key={item.apiName || item.id} item={item} /> ))}
      </div>
    </section>
  );
};
import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTFTData } from '../../context/TFTDataContext';

import UnitPanel from './UnitPanel';
import SynergyPanel from './SynergyPanel';
import HexGrid from './HexGrid';
import ItemPanel from './ItemPanel';
import DetailPanel from './DetailPanel';

import { encodeDeck, decodeDeck } from '../../utils/deckCode';
import axios from 'axios';

export default function DeckBuilderPage() {
  const { champions, items, augments, traits, loading } = useTFTData();
  const [placedUnits, setPlacedUnits] = useState({});
  const [selectedKey, setSelectedKey] = useState(null);
  const [deckCode, setDeckCode] = useState('');

  const handleUnitAction = useCallback((draggedItem, targetPos) => {
    const toKey = `${targetPos.y}-${targetPos.x}`;
    setPlacedUnits(prev => {
      const next = { ...prev };
      
      const apiName = draggedItem.championApiName || draggedItem.unit?.apiName;
      const fromKey = draggedItem.fromKey;

      if (fromKey === toKey) {
        setSelectedKey(toKey);
        return prev;
      }

      if (fromKey && next[fromKey]) {
        delete next[fromKey];
      }

      if (next[toKey] && next[toKey].apiName !== apiName) {
        delete next[toKey];
      }
      
      const fullUnitData = champions.find(c => c.apiName === apiName);
      if (!fullUnitData) {
          console.warn("Full unit data not found for:", apiName);
          return prev;
      }

      next[toKey] = {
        ...fullUnitData,
        pos: { x: targetPos.x, y: targetPos.y },
        star: (fromKey && prev[fromKey]) ? prev[fromKey].star : (draggedItem.unit?.star || 1),
        items: (fromKey && prev[fromKey]) ? prev[fromKey].items : (draggedItem.unit?.items || [])
      };
      return next;
    });
    setSelectedKey(toKey);
  }, [champions]);

  const handleUnitRemove = useCallback(pos => {
    const key = `${pos.y}-${pos.x}`;
    setPlacedUnits(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (selectedKey === key) setSelectedKey(null);
  }, [selectedKey]);

  const handleSelectUnit = useCallback(pos => {
    const key = `${pos?.y}-${pos?.x}`;
    if (pos && !placedUnits[key]) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey(prev => (prev === key ? null : key));
  }, [placedUnits]);

  const handleChangeStar = useCallback((pos, star) => {
    const key = `${pos.y}-${pos.x}`;
    setPlacedUnits(prev => {
      const unit = prev[key];
      if (!unit) return prev;
      return { ...prev, [key]: { ...unit, star } };
    });
  }, []);

  const handleEquip = useCallback((pos, item) => {
    const key = `${pos.y}-${pos.x}`;
    setPlacedUnits(prev => {
      const unit = prev[key];
      if (!unit) return prev;
      const existing = unit.items || [];
      if (existing.some(i => i.apiName === item.apiName)) return prev;
      if (existing.length >= 3) return prev;

      const nextItems = [...existing, item];
      return { ...prev, [key]: { ...unit, items: nextItems } };
    });
  }, []);

  const handleUnequip = useCallback((pos, itemToRemove) => {
    const key = `${pos.y}-${pos.x}`;
    setPlacedUnits(prev => {
      const unit = prev[key];
      if (!unit) return prev;
      const nextItems = (unit.items || []).filter(item => item.apiName !== itemToRemove.apiName);
      return { ...prev, [key]: { ...unit, items: nextItems } };
    });
  }, []);

  const handleLoadDeck = useCallback(() => {
    try {
      const decoded = decodeDeck(deckCode, champions, items);
      setPlacedUnits(decoded);
      setSelectedKey(null);
      alert('덱을 성공적으로 불러왔습니다!');
    } catch (e) {
      alert('잘못된 덱 코드입니다. 다시 확인해주세요.');
      console.error("Deck load error:", e);
    }
  }, [deckCode, champions, items]);

  const handleSaveDeck = useCallback(async () => {
    if (Object.keys(placedUnits).length === 0) {
      alert('저장할 덱이 없습니다.');
      return;
    }
    const deckName = prompt('덱 이름을 입력해주세요:');
    if (!deckName) return;

    try {
      const response = await axios.post('/api/deck-builder', {
        deckName: deckName,
        placements: Object.values(placedUnits).map(unit => ({
          unitApiName: unit.apiName,
          x: unit.pos.x,
          y: unit.pos.y,
        })),
      });
      alert(`덱 "${response.data.deckName}"이 성공적으로 저장되었습니다!`);
    } catch (e) {
      console.error("Deck save error:", e.response?.data?.error || e.message);
      alert('덱 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }, [placedUnits]);

  const selectedUnit = selectedKey ? placedUnits[selectedKey] : null;

  return (
    <DndProvider backend={HTML5Backend}>
      {/* min-h-screen 및 z-index 관련 조정 */}
      <div className="flex flex-col min-h-[calc(100vh-theme(space.16))] bg-background-base p-4 lg:p-6 relative z-0">
        {/* 상단 컨트롤 패널 */}
        <div className="bg-gray-800 p-4 rounded-lg text-white mb-4 shadow-md z-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">덱 빌더</h2>
            <select className="bg-gray-700 text-white p-2 rounded">
              <option value="set11">시즌 11</option>
            </select>
          </div>

          <div className="flex gap-2 items-center mb-4">
            <input
              type="text"
              className="flex-grow p-2 rounded text-black bg-gray-200"
              placeholder="덱 코드를 여기에 붙여넣으세요..."
              value={deckCode}
              onChange={(e) => setDeckCode(e.target.value)}
            />
            <button
              onClick={handleLoadDeck}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold text-sm"
            >
              불러오기
            </button>
            <button
              onClick={() => {
                const currentDeckCode = encodeDeck(placedUnits);
                navigator.clipboard.writeText(currentDeckCode);
                setDeckCode(currentDeckCode);
                alert('덱 코드가 클립보드에 복사되었습니다!');
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold text-sm"
            >
              복사
            </button>
            <button
              onClick={handleSaveDeck}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-semibold text-sm"
            >
              저장
            </button>
          </div>
        </div>

        {/* 중앙: 헥사곤 그리드, 상세 패널, 시너지 패널 */}
        <div className="flex flex-grow gap-4 mb-4 relative z-0"> {/* 중앙 컨테이너에 relative 및 z-index 추가 */}
            {/* 왼쪽: 시너지 패널 */}
            <aside className="w-64 flex-shrink-0 bg-gray-800 p-4 rounded-lg shadow-md h-full z-10"> {/* z-index 추가 */}
                <SynergyPanel placedUnits={placedUnits} />
            </aside>

            {/* 중앙: 헥사곤 그리드 */}
            <main className="flex-grow flex justify-center items-center bg-gray-900 rounded-lg p-4 shadow-md z-10"> {/* z-index 추가 */}
                <HexGrid
                    placedUnits={placedUnits}
                    onUnitAction={handleUnitAction}
                    onSelectUnit={handleSelectUnit}
                    onUnitRemove={handleUnitRemove}
                    selectedKey={selectedKey}
                />
            </main>

            {/* 오른쪽: 상세 패널 */}
            <aside className="w-80 flex-shrink-0 z-10"> {/* z-index 추가 */}
                <DetailPanel
                    selectedUnit={selectedUnit}
                    onUnitRemove={handleUnitRemove}
                    onChangeStar={handleChangeStar}
                    onEquip={handleEquip}
                    onUnequip={handleUnequip}
                />
            </aside>
        </div>

        {/* 하단: 유닛 및 아이템 선택 패널 */}
        <div className="bg-gray-800 p-4 rounded-lg shadow-md z-10"> {/* z-index 추가 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UnitPanel />
            <ItemPanel />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
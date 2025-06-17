// frontend/src/pages/tierlist/TierListPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// --- 헬퍼 함수 ---
const getTierColor = (tierRank) => {
  const colorMap = { S: '#E13434', A: '#B45AF3', B: '#2C98F0', C: '#20B359', D: '#9E9E9E' };
  return colorMap[tierRank] || '#6E6E6E';
};

const getCostBorderStyle = (cost) => {
  const colorMap = { 1: '#808080', 2: '#1E823C', 3: '#156293', 4: '#87259E', 5: '#B89D29' };
  return { border: `2px solid ${colorMap[cost] || colorMap[1]}` };
};

// --- 재사용 컴포넌트 ---
const UnitWithItems = ({ unit, showItems, isMajorUnit }) => {
  if (!unit || !unit.image_url) {
    // 유닛 데이터가 없을 경우를 대비한 플레이스홀더
    return <div className="w-14 h-24" />;
  }

  const displayedItems = showItems ? (unit.recommendedItems || []).slice(0, 3) : [];

  return (
    <div className="relative flex flex-col items-center gap-1 w-14">
      {/* 3성 뱃지 */}
      {unit.tier === 3 && (
        <div className="absolute top-0 right-0 z-10 flex items-center justify-center w-5 h-5 bg-yellow-400 border border-yellow-600 rounded-full text-white font-bold text-xs">★</div>
      )}
      {/* 캐리/서브캐리 별 등급 */}
      {isMajorUnit && unit.tier > 0 && (
        <div className="absolute top-10 w-full text-center text-yellow-400 font-bold text-lg" style={{ textShadow: '0 0 3px black' }}>
          {'★'.repeat(unit.tier)}
        </div>
      )}
      <img 
        src={unit.image_url} 
        alt={unit.name} 
        title={unit.name} 
        className="w-12 h-12 rounded-md" 
        style={getCostBorderStyle(unit.cost)}
      />
      <div className="flex justify-center items-center h-4 gap-px mt-0.5">
        {displayedItems.map((item, index) =>
          item.image_url && <img key={index} src={item.image_url} alt={item.name} title={item.name} className="w-4 h-4 rounded-sm" />
        )}
      </div>
      <span className="w-full text-xs text-center text-gray-500 truncate">{unit.name}</span>
    </div>
  );
};

const DeckCard = ({ deck }) => {
  const tierColor = getTierColor(deck.tierRank);
  const top4Rate = deck.totalGames > 0 ? ((deck.top4Count / deck.totalGames) * 100).toFixed(1) : "0.0";
  const winRate = deck.totalGames > 0 ? ((deck.winCount / deck.totalGames) * 100).toFixed(1) : "0.0";

  // 핵심 유닛 정렬: 캐리 -> 코스트 오름차순 -> 티어 내림차순
  const sortedCoreUnits = [...(deck.coreUnits || [])].sort((a, b) => {
    const isA_Carry = a.name === deck.carryChampionName;
    const isB_Carry = b.name === deck.carryChampionName;
    if (isA_Carry && !isB_Carry) return -1;
    if (!isA_Carry && isB_Carry) return 1;
    if (a.cost !== b.cost) return a.cost - b.cost;
    return b.tier - a.tier;
  });

  // 아이템/별 표시할 주요 유닛 선정 로직
  const majorUnitsToShow = new Set();
  if (deck.carryChampionName) {
      const carryUnit = sortedCoreUnits.find(u => u.name === deck.carryChampionName);
      if(carryUnit) majorUnitsToShow.add(carryUnit.apiName);
  }
  const nonCarry4Costs = sortedCoreUnits.filter(u => u.cost === 4 && u.name !== deck.carryChampionName);
  nonCarry4Costs.slice(0, 2).forEach(u => majorUnitsToShow.add(u.apiName));
  const remainingUnits = sortedCoreUnits.filter(u => !majorUnitsToShow.has(u.apiName));
  remainingUnits.forEach(u => {
      if(majorUnitsToShow.size < 3) majorUnitsToShow.add(u.apiName);
  });
  
  return (
    <div className="flex items-center gap-6 p-4 bg-white rounded-lg shadow-md border-l-4" style={{ borderLeftColor: tierColor }}>
      {/* 1열: 티어, 덱 이름 */}
      <div className="flex items-center gap-4 flex-shrink-0 w-56">
        <div className="flex items-center justify-center w-10 h-10 rounded-md text-white text-2xl font-bold" style={{ backgroundColor: tierColor }}>
          {deck.tierRank}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-800">{deck.mainTraitName} {deck.carryChampionName}</h3>
        </div>
      </div>

      {/* 2열: 핵심 유닛 */}
      <div className="flex-grow flex items-start gap-1.5">
        {sortedCoreUnits.slice(0, 8).map((unit) => (
          <UnitWithItems
            key={unit.apiName || unit.name}
            unit={unit}
            showItems={majorUnitsToShow.has(unit.apiName)}
            isMajorUnit={majorUnitsToShow.has(unit.apiName)}
          />
        ))}
      </div>

      {/* 3열: 통계 데이터 */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-4 w-72 text-right">
        <div><p className="font-bold text-lg text-gray-800">{deck.averagePlacement.toFixed(2)}</p><p className="text-xs text-gray-500">평균 등수</p></div>
        <div><p className="font-bold text-lg text-blue-500">{top4Rate}%</p><p className="text-xs text-gray-500">Top 4</p></div>
        <div><p className="font-bold text-lg text-yellow-500">{winRate}%</p><p className="text-xs text-gray-500">1등</p></div>
        <div><p className="font-bold text-lg text-gray-800">{deck.totalGames}</p><p className="text-xs text-gray-500">게임 수</p></div>
      </div>
      
      {/* 4열: 상세보기 버튼 */}
      <div className="flex-shrink-0">
        <button className="p-2 text-gray-500 text-2xl hover:bg-gray-100 rounded-md">▼</button>
      </div>
    </div>
  );
};

// --- 메인 페이지 컴포넌트 ---
function TierListPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tierData, setTierData] = useState([]);

  useEffect(() => {
    const fetchTierData = async () => {
      try {
        setLoading(true);
        // 🚨 API 주소 수정: /api/tierlist -> /api/deck-tiers
        const response = await axios.get('/api/deck-tiers');
        setTierData(response.data);
      } catch (err) { 
        setError('덱 티어 정보를 불러오는 데 실패했습니다. 서버를 확인해 주세요.'); 
        console.error("TierList fetch error:", err);
      }
      finally { setLoading(false); }
    };
    fetchTierData();
  }, []);
  
  if (loading) return <div className="py-8 text-center text-gray-500">티어리스트를 분석 중입니다...</div>;
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">실시간 덱 티어리스트</h1>
      <p className="text-center text-gray-500 mb-8">최신 랭커 데이터를 기반으로 집계된 티어리스트입니다.</p>
      
      {tierData.length > 0 ? (
        <div className="flex flex-col gap-3">
          {tierData.map((deck) => <DeckCard key={deck.deckKey} deck={deck} />)}
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500">
          아직 분석된 덱 티어 정보가 없습니다. <br />
          데이터 수집 및 분석이 완료될 때까지 기다려주세요. (매시간 분석이 갱신됩니다)
        </div>
      )}
    </div>
  );
}

export default TierListPage;
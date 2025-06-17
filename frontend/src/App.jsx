// frontend/src/App.jsx

import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import SummonerPage from './pages/summoner/SummonerPage';
import TierListPage from './pages/tierlist/TierListPage';
import RankingPage from './pages/ranking/RankingPage'; // 랭킹 페이지 import (기존)
import AiQnaPage from './pages/AiQnaPage/AiQnaPage.jsx';  // ⬅️ 새로 만든 AI Q&A 페이지 import
import DeckBuilderPage from './pages/DeckBuilderPage/DeckBuilderPage'; // ⬅️ 새로 추가
import { useTFTData } from './context/TFTDataContext';
import ChampionTooltip from './components/common/ChampionTooltip'; 

// 임시 페이지 컴포넌트들 (이제 AIChatPage는 AiQnaPage로 대체됩니다)
// const AIChatPage = () => <div className="p-8 text-center">AI 질문하기 기능은 현재 개발 중입니다.</div>; // 이제 필요 없습니다.
const AboutPage = () => <div className="p-8 text-center">MetaMind 프로젝트 소개 페이지입니다.</div>;

function App() {
 const { tooltip } = useTFTData();

  return (
    <div className="bg-background-base min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/summoner/:region" element={<SummonerPage />} />
          <Route path="/tierlist" element={<TierListPage />} />
          
          {/* ⬇️⬇️⬇️ 랭킹 페이지 경로를 실제 컴포넌트로 연결 ⬇️⬇️⬇️ */}
          <Route path="/ranking" element={<RankingPage />} />
          
          {/* ⬇️⬇️⬇️ AI 질문하기 페이지 경로를 실제 AiQnaPage 컴포넌트로 연결 ⬇️⬇️⬇️ */}
          <Route path="/ai-chat" element={<AiQnaPage />} /> {/* AIChatPage 대신 AiQnaPage 사용 */}
          <Route path="/deck-builder" element={<DeckBuilderPage />}/>
          
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>
      {tooltip.visible && <ChampionTooltip champion={tooltip.data} position={tooltip.position} />}
    </div>
  );
}

export default App;
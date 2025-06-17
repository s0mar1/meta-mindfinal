import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// HomePage 전용 검색창. 기존 SearchBar와는 별개입니다.
const HomeSearchBar = () => {
  const [summonerInput, setSummonerInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!summonerInput.trim() || !summonerInput.includes('#')) {
      alert('소환사명#태그 형식으로 입력해주세요. (예: 챌린저#KR1)');
      return;
    }
    const [gameName, tagLine] = summonerInput.trim().split('#');
    const queryString = new URLSearchParams({ gameName, tagLine }).toString();
    // 현재는 KR 지역만 지원하므로 'kr'로 고정
    navigate(`/summoner/kr?${queryString}`);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          value={summonerInput}
          onChange={(e) => setSummonerInput(e.target.value)}
          placeholder="소환사명 #태그"
          className="w-full text-lg py-4 px-6 rounded-full bg-background-card border-2 border-border-light focus:outline-none focus:ring-2 focus:ring-brand-mint text-text-primary"
        />
        <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-6 text-text-secondary hover:text-brand-mint">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
        </button>
      </div>
    </form>
  );
};

function HomePage() {
  return (
    <div>
      <div className="text-center pt-16 pb-20">
        <h1 className="text-5xl font-extrabold text-text-primary mb-4">당신의 플레이,</h1>
        <h2 className="text-5xl font-extrabold text-brand-mint mb-8">챌린저의 관점에서 분석해 보세요.</h2>
        <p className="text-text-secondary max-w-2xl mx-auto mb-12">
          MetaMind는 상위 랭커들의 데이터를 실시간으로 분석하여, 당신의 게임에 대한 깊이 있는 피드백과 함께 최신 메타 트렌드를 제공합니다.
        </p>
        <HomeSearchBar />
      </div>

      {/* 실시간 메타 트렌드 섹션 (추후 구현) */}
      <div className="mt-16">
        <h3 className="text-2xl font-bold text-center mb-6">실시간 메타 트렌드</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 아래는 임시 플레이스홀더 카드입니다. */}
          <div className="bg-background-card p-6 rounded-lg shadow-md">덱 1 정보</div>
          <div className="bg-background-card p-6 rounded-lg shadow-md">덱 2 정보</div>
          <div className="bg-background-card p-6 rounded-lg shadow-md">덱 3 정보</div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
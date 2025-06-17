import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SearchBar() {
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
    navigate(`/summoner/kr?${queryString}`); // 지역(region)은 KR로 고정, 추후 확장 가능
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <input
          type="text"
          value={summonerInput}
          onChange={(e) => setSummonerInput(e.target.value)}
          placeholder="소환사명#태그 ..."
          className="w-full py-2 pl-4 pr-10 rounded-full bg-background-base border border-border-light focus:outline-none focus:ring-2 focus:ring-brand-mint"
        />
        <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-3 text-text-secondary hover:text-brand-mint">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"></path></svg>
        </button>
      </div>
    </form>
  );
}

export default SearchBar;
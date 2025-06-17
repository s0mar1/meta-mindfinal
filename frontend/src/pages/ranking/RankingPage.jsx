import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';

// 랭킹 테이블 한 줄을 그리는 컴포넌트
const RankerRow = ({ ranker, rank }) => {
  const totalGames = ranker.wins + ranker.losses;
  const top4Rate = totalGames > 0 ? ((ranker.wins / totalGames) * 100).toFixed(1) : 0;
  
  // ⬇️⬇️⬇️ 실제 1등 승률 계산 로직 추가 ⬇️⬇️⬇️
  const winRate = totalGames > 0 && ranker.firstPlaceWins > 0 
      ? ((ranker.firstPlaceWins / totalGames) * 100).toFixed(1) 
      : "0.0"; 

  const profileIconUrl = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/profile-icons/${ranker.profileIconId}.jpg`;

  return (
    <tr className="border-b border-border-light hover:bg-gray-50 transition-colors">
      <td className="p-4 text-center font-bold text-lg text-text-secondary">{rank}</td>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={profileIconUrl} 
            alt={ranker.gameName} 
            className="w-10 h-10 rounded-md" 
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/40' }}
          />
          <Link 
            to={`/summoner/kr?gameName=${encodeURIComponent(ranker.gameName)}&tagLine=${encodeURIComponent(ranker.tagLine)}`} 
            className="font-bold text-text-primary hover:text-brand-mint transition-colors"
          >
            {ranker.gameName || ranker.summonerName}
          </Link>
        </div>
      </td>
      <td className="p-4 text-center font-bold text-brand-mint">{ranker.leaguePoints.toLocaleString()} LP</td>
      <td className="p-4 text-center font-semibold text-text-secondary">{totalGames} 게임</td>
      <td className="p-4 text-center text-blue-500 font-bold">{top4Rate}%</td>
      {/* ⬇️⬇️⬇️ 'N/A' 대신 실제 승률 표시 ⬇️⬇️⬇️ */}
      <td className="p-4 text-center text-yellow-500 font-bold">{winRate}%</td>
    </tr>
  );
};

// 페이지네이션 컴포넌트
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 7;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage - 2 > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage + 2 < totalPages - 1) pages.push('...');
      
      pages.push(totalPages);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded bg-background-card border border-border-light disabled:opacity-50 hover:bg-gray-100"> 이전 </button>
      {pageNumbers.map((number, index) => 
        typeof number === 'number' ? (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`px-3 py-1 rounded ${currentPage === number ? 'bg-brand-mint text-white border-brand-mint' : 'bg-background-card border border-border-light hover:bg-gray-100'}`}
          >
            {number}
          </button>
        ) : (
          <span key={`dots-${index}`} className="px-3 py-1">...</span>
        )
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-background-card border border-border-light disabled:opacity-50 hover:bg-gray-100"> 다음 </button>
    </div>
  );
};


// 메인 랭킹 페이지 컴포넌트
function RankingPage() {
  const [rankers, setRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const currentPage = parseInt(searchParams.get('page')) || 1;

  useEffect(() => {
    const fetchRankers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/ranking?page=${currentPage}`);
        setRankers(response.data.rankers);
        setTotalPages(response.data.totalPages);
      } catch (err) {
        setError('랭킹 정보를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    fetchRankers();
  }, [currentPage]);

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      navigate(`/ranking?page=${page}`);
    }
  };

  if (error) return <div className="p-8 text-center text-error-red">{error}</div>;

  return (
    <div className="bg-background-card shadow-md rounded-lg p-6 my-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">TFT 챌린저 랭킹</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b-2 border-border-light">
            <tr>
              <th className="p-3 text-center w-16 font-bold text-text-secondary">#</th>
              <th className="p-3 text-left font-bold text-text-secondary">소환사</th>
              <th className="p-3 text-center w-32 font-bold text-text-secondary">LP</th>
              <th className="p-3 text-center w-32 font-bold text-text-secondary">총 게임 수</th>
              <th className="p-3 text-center w-28 font-bold text-text-secondary">순방률 (Top 4)</th>
              <th className="p-3 text-center w-28 font-bold text-text-secondary">승률 (1위)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-16 text-center text-text-secondary">로딩 중...</td></tr>
            ) : (
              rankers.map((ranker, index) => (
                <RankerRow key={ranker.puuid} ranker={ranker} rank={(currentPage - 1) * 50 + index + 1} />
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />}
    </div>
  );
}

export default RankingPage;
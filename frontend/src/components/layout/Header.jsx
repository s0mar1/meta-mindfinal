import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import SearchBar from '../common/SearchBar';

// 임시 로고 아이콘
const LogoIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C21.9939 8.94833 20.3541 6.19524 17.75 4.75" stroke="#3ED2B9" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" stroke="#3ED2B9" strokeWidth="2"/>
    <path d="M12 12V16C12 17.1046 12.8954 18 14 18" stroke="#3ED2B9" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const Header = () => {
  // 서브 네비게이션 링크에 적용할 스타일
  const navLinkClass = ({ isActive }) =>
    `py-3 text-sm font-bold border-b-2 transition-colors duration-200 ${
      isActive
        ? 'text-brand-mint border-brand-mint'
        : 'text-text-secondary border-transparent hover:text-text-primary'
    }`;

  return (
    <header className="bg-background-card border-b border-border-light sticky top-0 z-10">
      {/* 1단: 로고, 검색, 개인 메뉴 */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center py-2">
          {/* 로고 (클릭 시 홈으로) */}
          <Link to="/" className="flex items-center gap-2">
            <LogoIcon />
            <span className="text-xl font-bold text-text-primary">MetaMind</span>
          </Link>

          {/* 검색창 */}
          <div className="w-1/3">
            <SearchBar />
          </div>

          {/* 추후 추가될 개인 메뉴 (로그인, 언어 설정 등) */}
          <div className="w-48 text-right">
            {/* <button>Login</button> */}
          </div>
        </div>
      </div>

      {/* 2단: 서브 네비게이션 */}
      <div className="border-t border-border-light">
          <nav className="max-w-7xl mx-auto px-6 flex items-center gap-8">
            <NavLink to="/tierlist" className={navLinkClass}>추천 메타</NavLink>
            <NavLink to="/ranking" className={navLinkClass}>랭킹</NavLink>
            <NavLink to="/deck-builder" className={navLinkClass}>덱 빌더</NavLink> {/* ⬅️ 새로 추가 */}
            <NavLink to="/ai-chat" className={navLinkClass}>AI 질문하기</NavLink>
            <NavLink to="/about" className={navLinkClass}>About MetaMind</NavLink>
          </nav>
      </div>
    </header>
  );
};

export default Header;
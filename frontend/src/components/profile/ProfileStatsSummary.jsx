import React from 'react';

export default function ProfileStatsSummary({ stats }) {
  // stats: { wins, losses, winRate, avgPlacement }
  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-white shadow rounded mt-4">
      <div className="text-center">
        <p className="text-lg font-semibold">승/패</p>
        <p>{stats.wins} / {stats.losses}</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">승률</p>
        <p>{stats.winRate}%</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">평균 순위</p>
        <p>{stats.avgPlacement}</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold">플레이 수</p>
        <p>{stats.totalGames}</p>
      </div>
    </div>
  );
}
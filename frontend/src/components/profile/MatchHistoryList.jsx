import React from 'react';

export default function MatchHistoryList({ matches }) {
  return (
    <ul className="space-y-2 mt-4">
      {matches.map(match => (
        <li key={match.id} className="flex justify-between p-3 bg-white shadow rounded">
          <div>
            <p className="font-medium">{new Date(match.timestamp).toLocaleString()}</p>
            <p className="text-sm text-gray-600">결과: {match.result}</p>
          </div>
          <div className="flex space-x-1">
            {match.decks.map(deck => (
              <span key={deck} className="bg-gray-200 px-2 py-1 rounded text-xs">{deck}</span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
}

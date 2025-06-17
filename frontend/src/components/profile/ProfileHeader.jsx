import React from 'react';

export default function ProfileHeader({ gameName, tagLine, tier }) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-white shadow rounded">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0" />
      <div>
        <h1 className="text-xl font-semibold">{gameName}#{tagLine}</h1>
        <p className="text-gray-600">티어: {tier || 'Unranked'}</p>
      </div>
    </div>
  );
}

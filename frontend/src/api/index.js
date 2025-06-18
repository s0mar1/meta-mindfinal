// src/api/index.js
export const fetchSummonerDataAPI = async (region, rawName) => {
  const response = await fetch(`/api/summoner/${region}/${rawName}`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'API Error');
  }
  return response.json();
};

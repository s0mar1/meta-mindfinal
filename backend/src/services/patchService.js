import axios from 'axios';

const REALM_URL = region => `https://ddragon.leagueoflegends.com/realms/${region}.json`;

export async function fetchPatchVersion(region = 'kr') {
  try {
    const { data } = await axios.get(REALM_URL(region));
    return data.n.champion;
  } catch {
    return 'latest';
  }
}

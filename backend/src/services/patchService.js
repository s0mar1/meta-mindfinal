import axios from 'axios';

const REALM_URL = region => `https://ddragon.leagueoflegends.com/realms/${region}.json`;

export async function fetchPatchVersion(region = 'kr') {
  try {
    const { data } = await axios.get(REALM_URL(region));
    // Data Dragon provides a separate TFT version under `n.tft`
    // which is required when requesting tft-champions.json and
    // related TFT data files
    return data.n.tft;
  } catch {
    return 'latest';
  }
}

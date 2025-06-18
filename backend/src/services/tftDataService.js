import championsData from '../../data/champions.json' assert { type: 'json' };
import itemsData from '../../data/items.json' assert { type: 'json' };

/**
 * Load TFT static data from local JSON files.
 * The JSON may either be an array or wrapped in a { data: [...] } object.
 */
export function getTFTData() {
  const champions = Array.isArray(championsData)
    ? championsData
    : championsData.data || Object.values(championsData);

  const items = Array.isArray(itemsData)
    ? itemsData
    : itemsData.data || itemsData;

  return { champions, items };
}

// 이전 코드와의 호환성을 위해 남겨둡니다
export const loadTFTData = getTFTData;

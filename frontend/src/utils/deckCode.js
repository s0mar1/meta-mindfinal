// frontend/src/utils/deckCode.js

/**
 * 덱 정보를 문자열로 변환합니다.
 * 포맷: y-x:name:star:item1|item2,...;y-x:...
 */
export function encodeDeck(placedUnits) {
  return Object.entries(placedUnits)
    .map(([key, u]) => {
      const [y, x] = key.split('-');
      const items = (u.items || []).map(i => i.name).join('|');
      return [y, x, u.name, u.star, items].join(':');
    })
    .join(';');
}

/**
 * 문자열로부터 덱 정보를 복원합니다.
 * encodeDeck 포맷을 디코드합니다.
 */
export function decodeDeck(code, allChampions, allItems) {
  const placed = {};
  if (!code) return placed;
  code.split(';').forEach(chunk => {
    const [y, x, name, starStr, itemsStr] = chunk.split(':');
    const star = Number(starStr) || 1;
    const champ = allChampions.find(c => c.name === name);
    if (!champ) return;
    const unit = {
      ...champ,
      pos: { x: Number(x), y: Number(y) },
      star,
      items: itemsStr
        ? itemsStr.split('|').map(itemName => allItems.find(i => i.name === itemName)).filter(Boolean)
        : [],
    };
    placed[`${y}-${x}`] = unit;
  });
  return placed;
}

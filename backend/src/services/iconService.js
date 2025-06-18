export function getItemIconUrl(version, itemIcon) {
  const ddUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${itemIcon}`;
  const communityUrl = `https://raw.communitydragon.org/latest/game/assets/tex/tft/Item_Icons/${itemIcon}`;
  return { ddUrl, communityUrl };
}

// frontend/src/pages/summoner/components/Item.jsx

import React from 'react';

const styles = {
  itemImage : { width: 14, height: 14, borderRadius: '2px' },
};

const Item = ({ item }) => (
  // [핵심 수정] item.image_url -> item.icon
  <img src={item.image_url || item.icon} alt={item.name} style={styles.itemImage} title={item.name}/>
);

export default Item;
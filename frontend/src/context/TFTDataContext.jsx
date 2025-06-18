// frontend/src/context/TFTDataContext.jsx
import React, { createContext, useContext } from 'react';
import championsData from '../../backend/data/champions.json';
import itemsData from '../../backend/data/items.json';

const TFTDataContext = createContext();

export const useTFTData = () => useContext(TFTDataContext);

const champions = Array.isArray(championsData)
  ? championsData
  : championsData.data || Object.values(championsData);

const items = Array.isArray(itemsData)
  ? itemsData
  : itemsData.data || itemsData;

export const TFTDataProvider = ({ children }) => {
  const tooltipInitial = { visible: false, data: null, position: { x: 0, y: 0 } };
  const [tooltip, setTooltip] = React.useState(tooltipInitial);

  const showTooltip = (championData, event) => {
    setTooltip({
      visible: true,
      data: championData,
      position: { x: event.clientX + 15, y: event.clientY + 15 }
    });
  };

  const hideTooltip = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  const value = {
    champions,
    items,
    loading: false,
    tooltip,
    showTooltip,
    hideTooltip,
  };

  return (
    <TFTDataContext.Provider value={value}>
      {children}
    </TFTDataContext.Provider>
  );
};

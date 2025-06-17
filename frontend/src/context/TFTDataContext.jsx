// frontend/src/context/TFTDataContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const TFTDataContext = createContext();

export const useTFTData = () => useContext(TFTDataContext);

export const TFTDataProvider = ({ children }) => {
  const [tftData, setTftData] = useState({ champions: [], items: [], traits: [] });
  const [loading, setLoading] = useState(true);

  // 툴팁 상태 관리
  const [tooltip, setTooltip] = useState({
    visible: false,
    data: null,
    position: { x: 0, y: 0 },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/static-data');
        setTftData(response.data);
      } catch (error) {
        console.error("TFT 정적 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
    ...tftData,
    loading,
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
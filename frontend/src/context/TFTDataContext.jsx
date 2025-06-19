// frontend/src/context/TFTDataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const TFTDataContext = createContext();

export const useTFTData = () => useContext(TFTDataContext);

export const TFTDataProvider = ({ children }) => {
  const [tftData, setTftData] = useState({
    champions: [],
    items: [],
    traits: [],
    traitMap: new Map(),
    krNameMap: new Map(),
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [tooltip, setTooltip] = useState({ visible: false, data: null, position: { x: 0, y: 0 } });

  useEffect(() => {
    const fetchTFTData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/static-data');
        const data = response.data;
        
        setTftData({
          champions: data.champions || [],
          items: data.items || [],
          traits: data.traits || [],
          traitMap: new Map((data.traits || []).map(t => [t.apiName.toLowerCase(), t])),
          krNameMap: new Map([
            ...(data.champions || []).map(c => [c.apiName.toLowerCase(), c.name]),
            ...(data.traits || []).map(t => [t.apiName.toLowerCase(), t.name])
          ]),
        });

      } catch (err) {
        console.error("Failed to fetch TFT data from backend:", err);
        setError("TFT 기본 데이터를 불러오는 데 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.");
      } finally {
        setLoading(false);
      }
    };

    fetchTFTData();
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
    error,
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
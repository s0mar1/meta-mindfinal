// frontend/src/context/TFTDataContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react'; //
import axios from 'axios'; //

const TFTDataContext = createContext(); //

export const useTFTData = () => useContext(TFTDataContext); //

export const TFTDataProvider = ({ children }) => { //
  const [tftData, setTftData] = useState({ //
    champions: [], //
    items: [], //
    traits: [], //
    augments: [], // <-- augments 필드 추가
    traitMap: new Map(), //
    krNameMap: new Map(), //
    version: '', // <-- version 필드 추가
    currentSet: '', // <-- currentSet 필드 추가
  });
  
  const [loading, setLoading] = useState(true); //
  const [error, setError] = useState(null); //
  
  const [tooltip, setTooltip] = useState({ visible: false, data: null, position: { x: 0, y: 0 } }); //

  useEffect(() => { //
    const fetchTFTData = async () => { //
      try { //
        setLoading(true); //
        // [핵심] 백엔드의 /api/static-data 엔드포인트에서 모든 데이터를 한번에 가져옵니다.
        const response = await axios.get('/api/static-data'); //
        const data = response.data; //
        
        setTftData({ //
          champions: data.champions || [], //
          items: data.items || [], //
          traits: data.traits || [], //
          augments: data.augments || [], // <-- augments 데이터 추가
          // 백엔드에서 배열로 전달된 Map을 다시 Map 객체로 생성합니다.
          traitMap: new Map((data.traitMap || [])), 
          krNameMap: new Map((data.krNameMap || [])),
          version: data.version || '', // <-- version 필드 추가
          currentSet: data.currentSet || '', // <-- currentSet 필드 추가
        });

      } catch (err) { //
        console.error("Failed to fetch TFT data from backend:", err); //
        setError("TFT 기본 데이터를 불러오는 데 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요."); //
      } finally { //
        setLoading(false); //
      }
    };

    fetchTFTData(); //
  }, []); // 최초 1회만 실행

  const showTooltip = (championData, event) => { //
    setTooltip({ //
      visible: true, //
      data: championData, //
      position: { x: event.clientX + 15, y: event.clientY + 15 } //
    });
  };

  const hideTooltip = () => { //
    setTooltip(prev => ({ ...prev, visible: false })); //
  };

  const value = { //
    ...tftData, //
    loading, //
    error, //
    tooltip, //
    showTooltip, //
    hideTooltip, //
  };

  return ( //
    <TFTDataContext.Provider value={value}> //
      {children} //
    </TFTDataContext.Provider> //
  );
};
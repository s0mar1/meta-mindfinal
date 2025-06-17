// frontend/src/pages/SummonerPage/components/LpGraph.jsx

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const placeholderLpData = [
    { name: '5월 27일', LP: 1200 }, { name: '5월 28일', LP: 1250 },
    { name: '5월 29일', LP: 1300 }, { name: '5월 30일', LP: 1280 },
    { name: '5월 31일', LP: 1350 }, { name: '6월 01일', LP: 1400 },
    { name: '6월 02일', LP: 1420 },
];

const styles = {
    header: {
        fontSize: '0.9rem',
        fontWeight: 'bold',
        padding: '12px 16px',
        color: '#1f2937',
        borderBottom: '1px solid #e5e7eb',
    },
    content: {
        // [수정 유지] padding을 0으로 유지하여 ResponsiveContainer가 최대 공간을 사용하게 합니다.
        padding: '0px', 
        width: '100%',
        height: '280px', // 그래프가 차지할 전체 높이는 유지
        boxSizing: 'border-box',
    },
};

const LpGraph = ({ lpHistory }) => { 
    const data = lpHistory && lpHistory.length > 0 ? lpHistory : placeholderLpData;
    const yAxisDomain = [
        // [수정 유지] domain을 더 타이트하게 조정하여 데이터가 세로로 더 펼쳐지도록 합니다.
        dataMin => (Math.floor((dataMin - 5) / 10) * 10), 
        dataMax => (Math.ceil((dataMax + 5) / 10) * 10),  
    ];

    return (
        <>
            <h3 style={styles.header}>티어 그래프</h3>
            <div style={styles.content}>
                <ResponsiveContainer width="100%" height="100%">
                    {/* [핵심 수정] LineChart의 margin을 극한으로 줄여서 그래프 영역을 확장합니다.
                        top: 5 (상단 여백 최소화)
                        right: 5 (우측 여백 최소화)
                        left: -50 (Y축 라벨을 그래프 안으로 대폭 당겨오는 음수 마진)
                        bottom: -30 (X축 라벨을 그래프 안으로 대폭 당겨오는 음수 마진)
                        이 값들은 라벨의 실제 크기에 따라 조절이 필요하며, 특정 폰트 크기에서는 라벨이 잘릴 위험이 있습니다.
                    */}
                    <LineChart data={data} margin={{ top: 5, right: 5, left: -50, bottom: -30 }}> 
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        {/* [수정] XAxis 라벨의 위치 조정: dy 값을 양수로 주어 라벨이 그래프 하단에 거의 붙도록 합니다.
                           음수 bottom 마진을 상쇄하고, 라벨이 잘리지 않도록 합니다.
                        */}
                        <XAxis
                            dataKey="name"
                            stroke="#6B7280"
                            fontSize="0.8rem"
                            tickLine={false} 
                            axisLine={{ stroke: '#E5E7EB' }} 
                            tick={{ dy: 35 }} // X축 라벨을 아래로 35px 이동 (롤체지지처럼 라벨을 더 내립니다)
                            // 롤체지지처럼 대각선 라벨을 원하면 angle: -45, textAnchor: 'end' 추가 가능
                        /> 
                        {/* [수정] YAxis 라벨의 위치 조정: dx 값을 양수로 주어 라벨이 그래프 왼쪽에 거의 붙도록 합니다. */}
                        <YAxis
                            stroke="#6B7280"
                            fontSize="0.8rem"
                            domain={yAxisDomain}
                            tickLine={false} 
                            axisLine={{ stroke: '#E5E7EB' }} 
                            tick={{ dx: 45 }} // Y축 라벨을 오른쪽으로 45px 이동 (롤체지지처럼 라벨을 더 우측으로 밀어냅니다)
                        />
                        <Tooltip contentStyle={{ background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                        <Line type="monotone" dataKey="LP" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};

export default LpGraph;
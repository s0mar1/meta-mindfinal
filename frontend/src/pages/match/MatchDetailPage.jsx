import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// SummonerPage에서 사용했던 스타일과 헬퍼 컴포넌트들을 재활용합니다.
const styles = { container: { padding: '2rem', backgroundColor: '#1A202C', color: '#EAEAEA', minHeight: '100vh', }, header: { marginBottom: '2rem', }, error: { color: '#E53E3E', }, playerCard: { backgroundColor: '#2D3748', border: '1px solid #4A5568', borderRadius: '8px', padding: '1.5rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }, playerInfo: { flex: '0 0 120px' }, placement: { fontSize: '1.5rem', fontWeight: 'bold', }, playerDetails: { flex: '1', display: 'flex', flexDirection: 'column', gap: '1rem', }, traitsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }, traitIcon: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#1A202C', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }, unitsContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }, unit: { position: 'relative', width: '48px', paddingTop: '8px' }, unitImage: { width: '100%', borderRadius: '4px', display: 'block' }, starsContainer: { position: 'absolute', top: '-2px', left: '50%', transform: 'translateX(-50%)', display: 'flex', fontSize: '1.1rem', textShadow: '0 0 3px black, 0 0 3px black' }, itemsContainer: { display: 'flex', justifyContent: 'center', gap: '2px', marginTop: '2px' }, itemImage: { width: '15px', height: '15px', borderRadius: '2px', border: '1px solid #555' } };
const getPlacementColor = (placement) => { if (placement === 1) return '#FFD700'; if (placement <= 4) return '#63B3ED'; return '#A0AEC0'; };
const costColors = { 1: '#808080', 2: '#1E823C', 3: '#156293', 4: '#87259E', 5: '#B89D29' };
const getCostBorderStyle = (cost) => ({ border: `2px solid ${costColors[cost] || costColors[1]}` });
const getCostColor = (cost) => costColors[cost] || costColors[1];

const Trait = ({ trait }) => ( <div style={styles.traitIcon}> <img src={trait.image_url} alt={trait.name} style={{ width: '16px', height: '16px' }} title={trait.name} /> <span>{trait.tier_current}</span> </div> );
const Item = ({ item }) => ( <img src={item.image_url} alt={item.name} style={styles.itemImage} title={item.name} /> );
const Unit = ({ unit }) => ( <div style={styles.unit}> <div style={{ ...styles.starsContainer, color: getCostColor(unit.cost) }}> {'★'.repeat(unit.tier)} </div> <img src={unit.image_url} alt={unit.name} style={{ ...styles.unitImage, ...getCostBorderStyle(unit.cost) }} title={unit.name} /> <div style={styles.itemsContainer}> {unit.items.map((item, index) => item.image_url && <Item key={index} item={item} />)} </div> </div> );

// 8명의 플레이어 정보를 보여주는 카드
const PlayerCard = ({ participant }) => (
    <div style={{ ...styles.playerCard, borderLeft: `5px solid ${getPlacementColor(participant.placement)}` }}>
        <div style={styles.playerInfo}>
            <div style={{ ...styles.placement, color: getPlacementColor(participant.placement) }}>#{participant.placement}</div>
            {/* 닉네임 표시는 puuid만으로 알 수 없으므로, 일단 생략하거나 puuid를 표시합니다. */}
            <div style={{fontSize: '0.8rem', wordBreak: 'break-all'}}>{participant.puuid}</div>
        </div>
        <div style={styles.playerDetails}>
            <div style={styles.traitsContainer}>
            {participant.traits.map((trait, index) => trait.image_url && <Trait key={index} trait={trait} />)}
            </div>
            <div style={styles.unitsContainer}>
            {participant.units.map((unit, index) => unit.image_url && <Unit key={index} unit={unit} />)}
            </div>
        </div>
    </div>
);

function MatchDetailPage() {
    const { matchId } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [matchData, setMatchData] = useState(null);

    useEffect(() => {
        if (!matchId) {
            setLoading(false);
            setError('매치 ID가 없습니다.');
            return;
        };

        const fetchMatchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/match/${matchId}`);
            const result = await response.json();
            if (!response.ok) {
            throw new Error(result.error || '매치 정보를 불러오는데 실패했습니다.');
            }
            // 등수 오름차순으로 정렬
            result.info.participants.sort((a, b) => a.placement - b.placement);
            setMatchData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        };

        fetchMatchData();
    }, [matchId]);

    if (loading) return <div style={styles.container}>매치 상세 정보를 불러오는 중입니다...</div>;
    if (error) return <div style={{ ...styles.container, ...styles.error }}>에러: {error}</div>;
    if (!matchData) return <div style={styles.container}>매치 정보가 없습니다.</div>;

    return (
        <div style={styles.container}>
        <header style={styles.header}>
            <h3>매치 상세 정보</h3>
            <p>게임 시간: {new Date(matchData.info.game_datetime).toLocaleString()}</p>
        </header>
        <section>
            {matchData.info.participants.map(p => (
            <PlayerCard key={p.puuid} participant={p} />
            ))}
        </section>
        </div>
    );
}

export default MatchDetailPage;
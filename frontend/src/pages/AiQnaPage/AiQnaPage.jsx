// frontend/src/pages/AiQnaPage/AiQnaPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.12)',
    padding: '2rem',
    maxWidth: '960px', // [수정] max-width를 960px로 늘려 여백을 줄입니다. (SummonerPage 컨테이너와 유사)
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '70vh', 
  },
  header: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#1f2937',
    textAlign: 'center',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
  },
  introText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: '0.9rem',
    marginBottom: '1rem',
    marginTop: '1rem',
  },
  chatArea: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '1rem',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    backgroundColor: '#F9FAFB',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  messageContainer: {
    display: 'flex',
  },
  userMessage: {
    // [수정] 사용자 말풍선 색상을 사이트 주 색상 계열로 변경 (AI 질문하기 탭 색상 참고)
    backgroundColor: '#00C2A8', // AI 질문하기 탭 활성화 색상 (예시)
    color: '#fff',
    padding: '10px 15px',
    borderRadius: '15px 15px 0px 15px',
    maxWidth: '70%',
    wordBreak: 'break-word',
    marginLeft: 'auto',
  },
  aiMessage: {
    // [수정] AI 말풍선 배경을 흰색 계열로 유지하되, 테두리 색상 등을 고려
    backgroundColor: '#fff', // 흰색 또는 아주 연한 회색
    color: '#1f2937', // 어두운 텍스트 색상
    padding: '10px 15px',
    borderRadius: '15px 15px 15px 0px',
    maxWidth: '70%',
    wordBreak: 'break-word',
    marginRight: 'auto',
    border: '1px solid #e5e7eb', // 테두리 추가하여 구분 명확히
  },
  aiMessageLoading: {
    backgroundColor: '#fff', // 로딩 메시지 배경도 흰색 계열
    color: '#1f2937',
    padding: '10px 15px',
    borderRadius: '15px 15px 15px 0px',
    maxWidth: '70%',
    marginRight: 'auto',
    fontStyle: 'italic',
    border: '1px solid #e5e7eb', // 테두리 추가
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'row',
    gap: '0.5rem',
    marginTop: 'auto',
  },
  textarea: {
    flexGrow: 1,
    minHeight: '50px',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    resize: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px 20px',
    borderRadius: '6px',
    border: 'none',
    // [수정] 버튼 색상을 AI 질문하기 탭 활성화 색상으로 변경
    backgroundColor: '#00C2A8', // AI 질문하기 탭 활성화 색상 (예시)
    color: '#fff',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    flexShrink: 0,
  },
  buttonHover: {
    backgroundColor: '#00A894', // 호버 시 약간 어둡게
  },
  loading: {
    textAlign: 'center',
    color: '#6E6E6E',
    padding: '15px 0',
  },
  error: {
    textAlign: 'center',
    color: '#E74C3C',
    padding: '15px 0',
  },
};

export default function AiQnaPage() {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatAreaRef = useRef(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // 초기 AI 환영 메시지 추가
  useEffect(() => {
    if (messages.length === 0 && !loading && !error) {
      setMessages([{ role: 'ai', content: '안녕하세요! 롤토체스 챌린저 전문가입니다. 무엇을 도와드릴까요? 궁금한 점을 분석해 드리고 게임에 대한 정보를 주시면 최선을 다해 답변드리겠습니다. MetaMind의 실시간 챌린저 통계 데이터를 바탕으로 최적의 전략을 제시해 드릴 수 있습니다.' }]);
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행되도록 빈 의존성 배열

  const handleQuestionSubmit = async () => {
    if (!question.trim()) {
      setError('질문을 입력해주세요.');
      return;
    }

    const userMessage = { role: 'user', content: question };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setQuestion('');
    setLoading(true);
    setError(null);

    try {
      const historyToSend = messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          content: msg.content
      }));

      const response = await axios.post('/api/ai/qna', { 
        question: question,
        chatHistory: historyToSend
      });
      const aiAnswer = response.data.answer;
      setMessages(prevMessages => [...prevMessages, { role: 'ai', content: aiAnswer }]);
    } catch (err) {
      console.error("AI Q&A 오류:", err);
      setError(err.response?.data?.error || err.message || '답변을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>챌린저 AI에게 질문하기</h2>
      <p style={styles.introText}>
        롤토체스에 대한 어떤 질문이든 해주세요! 챌린저 전문가가 답변해 드립니다. (롤토체스 관련 질문이 아니면 답변을 거절할 수 있습니다.)
      </p>

      <div style={styles.chatArea} ref={chatAreaRef}>
        {messages.map((msg, index) => (
          <div key={index} style={styles.messageContainer}>
            <div style={msg.role === 'user' ? styles.userMessage : styles.aiMessage}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
            <div style={styles.messageContainer}>
                <div style={styles.aiMessageLoading}>
                    답변을 생성 중입니다...
                </div>
            </div>
        )}
        {error && <div style={styles.error}>{error}</div>}
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.textarea}
          placeholder="여기에 질문을 입력하세요..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows="1"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleQuestionSubmit();
            }
          }}
          disabled={loading}
        />
        <button
          style={styles.button}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = styles.buttonHover.backgroundColor}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = styles.button.backgroundColor}
          onClick={handleQuestionSubmit}
          disabled={loading}
        >
          {loading ? '전송 중' : '전송'}
        </button>
      </div>
    </div>
  );
}
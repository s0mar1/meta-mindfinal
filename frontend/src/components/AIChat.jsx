import React, { useState } from 'react';

export default function AIChat({ onSend }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {/* 메시지 목록 자리 */}
      </div>
      <div className="flex p-4 bg-white border-t">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="질문을 입력하세요..."
          className="flex-1 border rounded px-2 py-1 mr-2"
        />
        <button onClick={handleSend} className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700">
          전송
        </button>
      </div>
    </div>
  );
}
import React, { useState } from 'react';

function LiveChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you with your booking today?", sender: "bot" }
  ]);
  const [input, setInput] = useState("");

  const toggleChat = () => setIsOpen(!isOpen);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { text: "Thanks for your message. A concierge will be with you shortly.", sender: "bot" }]);
    }, 1000);
  };

  return (
    <div className="live-chat-widget">
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={toggleChat}>
          💬 Chat
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h4>Concierge</h4>
            <button onClick={toggleChat}>&times;</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
          </div>
          <form className="chat-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default LiveChat;
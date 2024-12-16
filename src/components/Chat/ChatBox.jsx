import React, { useEffect, useRef, useState } from "react";
import InputEmoji from "react-input-emoji";
import "./ChatBox.css";

const ChatBox = ({ messages = [], currentUserId }) => {
  const scroll = useRef();
  const imageRef = useRef();
  const [newMessage, setNewMessage] = useState("");
  const handleChange = (message) => setNewMessage(message);

  const handleSend = () => {
    if (newMessage.trim()) {
      // Example send logic; replace with actual implementation
      console.log("Message sent:", newMessage);
      setNewMessage("");
    }
  };

  useEffect(() => {
    scroll.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
    <div className="ChatBox-container">
          <div className="chat-body">
            {messages.map((message, index) => (
              <div
                key={index}
                ref={scroll}
                className={
                  message.senderId === currentUserId ? "message own" : "message"
                }
              >
                {/* Sender Details */}
                <div className="sender-details">
                  {message.senderUrl && (
                    <img
                      src={message.senderUrl}
                      alt={message.senderName}
                      className="sender-avatar"
                    />
                  )}
                  <span className="sender-name">{message.senderName}</span>
                </div>
                {/* Message Content */}
                <div className="message-content">
                  <span>{message.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Sender */}
          <div className="chat-sender">
            <div className="add-image" onClick={() => imageRef.current.click()}>
              +
            </div>
            <InputEmoji
              value={newMessage}
              onChange={handleChange}
              placeholder="Type a message"
            />
            <div className="send-button" onClick={handleSend}>
              Send
            </div>
            <input
              type="file"
              style={{ display: "none" }}
              ref={imageRef}
              accept="image/*"
            />
          </div>
</div>
          </>
    )
};
export default ChatBox;

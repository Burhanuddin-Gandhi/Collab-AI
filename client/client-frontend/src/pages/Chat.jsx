import { useState, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:5000");

export default function Chat() {

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  const sendMessage = () => {

    if (message.trim() === "") return;

    const messageData = {
      text: message,
      time: new Date().toLocaleTimeString()
    };

    socket.emit("send_message", messageData);

    setMessage("");
  };

  useEffect(() => {

    socket.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("typing", ({ user, isTyping }) => {
      setTypingUsers((prev) =>
      isTyping 
        ? [...prev.filter((n) => n !== user?.name), user?.name] 
        : prev.filter((n) => n !== user?.name)
      );
    });

  }, []);

  return (
    <div style={{ padding: "40px" }}>

      <h2>Live Chat</h2>

      <div style={{ border: "1px solid gray", height: "300px", overflowY: "scroll", padding: "10px" }}>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.text} <small>{msg.time}</small>
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type message..."
      />

      <button onClick={sendMessage}>Send</button>

    </div>
  );
}
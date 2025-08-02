import { useEffect, useState } from "react";

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    fetch("https://mirakle-website-server.onrender.com/api/contact")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMessages(data.messages);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Contact Messages</h1>
      {messages.length === 0 ? (
        <p>No messages yet</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg._id} className="border rounded-lg p-4 bg-white shadow">
              <p className="font-semibold">{msg.name} ({msg.email})</p>
              <p className="text-gray-700 mt-2">{msg.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

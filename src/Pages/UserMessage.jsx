import { useEffect, useState } from "react";
import AdminLayout from "../Componenets/AdminLayout";

const UserMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unrepliedCount = messages.filter(msg => msg.status !== "responded").length;

  // Fetch messages from backend
  const fetchMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("https://mirakle-website-server.onrender.com/api/contact");
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
      } else {
        setError(data.error || "Failed to fetch messages");
        console.error("Failed to fetch messages:", data.error);
      }
    } catch (fetchError) {
      setError("Error fetching messages");
      console.error("Error fetching messages:", fetchError);
    } finally {
      setLoading(false);
    }
  };

  // Mark a message as replied
  const markAsReplied = async (id) => {
    try {
      const res = await fetch(
        `https://mirakle-website-server.onrender.com/api/contact/respond/${id}`,
        { method: "PUT" }
      );
      const data = await res.json();

      if (data.success) {
        // Refresh messages after marking replied
        fetchMessages();
      } else {
        alert("Failed to mark as replied");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while marking as replied.");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">User Messages</h2>
          {unrepliedCount > 0 && (
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm">
              {unrepliedCount} Unreplied
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-gray-600">Loading messages...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500">No messages found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-200 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Message</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Date</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, index) => (
                  <tr key={msg._id || index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{msg.name}</td>
                    <td className="border border-gray-200 px-4 py-2">{msg.email}</td>
                    <td className="border border-gray-200 px-4 py-2 whitespace-pre-wrap">{msg.message}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {new Date(msg.createdAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {msg.status === "responded" ? (
                        <span className="text-green-600 font-semibold">Replied</span>
                      ) : (
                        <>
                          <button
                            className="text-blue-600 hover:underline mr-2 text-sm"
                            onClick={() =>
                              window.open(`mailto:${msg.email}?subject=Re: Your message`)
                            }
                            aria-label={`Reply to ${msg.name}`}
                          >
                            Reply
                          </button>
                          <button
                            className="text-sm text-gray-600 hover:underline"
                            onClick={() => markAsReplied(msg._id)}
                            aria-label={`Mark message from ${msg.name} as replied`}
                          >
                            Mark as Replied
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserMessages;

import { useEffect, useState } from "react";
import AdminLayout from "../Componenets/AdminLayout";

const UserMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const res = await fetch("https://mirakle-website-server.onrender.com/api/contact");
      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
      } else {
        console.error("Failed to fetch messages:", data.error);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  if (loading) return <p>Loading messages...</p>;

  return (
    <AdminLayout>
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">User Messages</h2>

        {messages.length === 0 ? (
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
                </tr>
              </thead>
              <tbody>
                {messages.map((msg, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">{msg.name}</td>
                    <td className="border border-gray-200 px-4 py-2">{msg.email}</td>
                    <td className="border border-gray-200 px-4 py-2">{msg.message}</td>
                    <td className="border border-gray-200 px-4 py-2">
                      {new Date(msg.createdAt).toLocaleString()}
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

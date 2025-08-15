import Chat from "../model/chat.js";

export const getChatHistoryByChatId = async (req, res) => {
  const { userId, chatId } = req.params;
  try {
    const chat = await Chat.findOne({ chatId, userId });
    if (!chat) {
      return res.status(200).json({ message: "Chat not found", data: null });
    }

    res.json({ data: chat.messages });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getChatIdsHistoryByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find all chats for the user and return only chatId field
    const chats = await Chat.find({ userId }).select("chatId -_id");

    if (!chats || chats.length === 0) {
      return res
        .status(200)
        .json({ message: "No chats found for this user", data: [] });
    }

    // Extract chatIds into a simple array
    const chatIds = chats.map((chat) => chat.chatId);

    res.json({ data: chatIds });
  } catch (error) {
    console.error("Error fetching chat IDs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

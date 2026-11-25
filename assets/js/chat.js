const ZynkChatEngine = {
  activeTimers: [],

  clearTimers() {
    this.activeTimers.forEach((id) => clearTimeout(id));
    this.activeTimers = [];
  },

  getChatMessages(currentUserId, targetChat) {
    if (!targetChat) return [];
    const all = ZynkStorage.getMessages();

    if (targetChat.chat_type === "group") {
      return all.filter(
        (m) => m.chat_type === "group" && m.receiver_id === targetChat.id
      );
    }

    return all.filter(
      (m) =>
        m.chat_type === "direct" &&
        ((m.sender_id === currentUserId && m.receiver_id === targetChat.id) ||
          (m.sender_id === targetChat.id && m.receiver_id === currentUserId))
    );
  },

  markChatAsRead(currentUserId, targetChat) {
    if (!targetChat) return;
    const messages = ZynkStorage.getMessages();
    let changed = false;

    const updated = messages.map((m) => {
      const isIncomingToCurrent =
        targetChat.chat_type === "direct"
          ? m.chat_type === "direct" &&
            m.sender_id === targetChat.id &&
            m.receiver_id === currentUserId
          : m.chat_type === "group" &&
            m.receiver_id === targetChat.id &&
            m.sender_id !== currentUserId;

      if (isIncomingToCurrent && m.unread) {
        changed = true;
        return { ...m, unread: false, traffic_status: "seen" };
      }
      return m;
    });

    if (changed) {
      ZynkStorage.saveMessages(updated);
    }
  },

  sendMessage(payload, onRefresh) {
    const {
      currentUser,
      targetChat,
      text,
      attachment,
      codeSnippet,
      isBurnOnRead
    } = payload;

    if (!currentUser || !targetChat) return false;
    if (targetChat.chat_type === "direct" && ZynkStorage.isBlocked(currentUser.user_id, targetChat.id)) {
      return false;
    }

    const cleanText = (text || "").trim();
    if (!cleanText && !attachment && !codeSnippet) return false;

    let msgType = "text";
    if (codeSnippet) {
      msgType = "code";
    } else if (attachment) {
      msgType = attachment.file_type.startsWith("image/") ? "image" : "file";
    }

    const nowIso = new Date().toISOString();
    const newMsg = {
      msg_id: "msg_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      chat_type: targetChat.chat_type,
      sender_id: currentUser.user_id,
      receiver_id: targetChat.id,
      text: cleanText,
      type: msgType,
      file_name: attachment ? attachment.file_name : "",
      file_type: attachment ? attachment.file_type : "",
      file_url: attachment ? attachment.file_url : "",
      code_language: codeSnippet ? codeSnippet.language : "",
      code_content: codeSnippet ? codeSnippet.code : "",
      burn_on_read: Boolean(isBurnOnRead),
      burn_revealed: false,
      traffic_status: "offline",
      unread: true,
      timestamp: nowIso
    };

    ZynkStorage.addMessage(newMsg);
    if (onRefresh) onRefresh();

    const t1 = setTimeout(() => {
      ZynkStorage.updateMessage(newMsg.msg_id, { traffic_status: "delivered" });
      if (onRefresh) onRefresh();
    }, 1200);

    this.activeTimers.push(t1);
    return true;
  },

  startBurnCountdown(msgId, onTick, onExpire) {
    let secondsLeft = 10;
    ZynkStorage.updateMessage(msgId, { burn_revealed: true });
    if (onTick) onTick(secondsLeft);

    const intervalId = setInterval(() => {
      secondsLeft -= 1;
      if (secondsLeft <= 0) {
        clearInterval(intervalId);
        ZynkStorage.deleteMessage(msgId);
        if (onExpire) onExpire();
      } else if (onTick) {
        onTick(secondsLeft);
      }
    }, 1000);
  }
};
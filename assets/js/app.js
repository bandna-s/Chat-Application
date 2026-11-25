document.addEventListener("DOMContentLoaded", () => {
  const currentUser = ZynkAuth.requireAuth();
  if (!currentUser) return;

  ZynkAuth.bindThemeToggle("themeToggleBtn");

  let activeFilter = "all";
  let activeCustomListId = null;
  let activeChat = null;
  let pendingAttachment = null;
  let pendingCodeSnippet = null;
  let burnModeEnabled = false;
  let typingText = "";
  const burnCounters = {};

  const appLockOverlay = document.getElementById("appLockOverlay");
  const appLockInput = document.getElementById("appLockInput");
  const appLockError = document.getElementById("appLockError");
  const appLockUnlockBtn = document.getElementById("appLockUnlockBtn");

  const globalLoader = document.getElementById("globalLoader");
  const sidebarPane = document.getElementById("sidebarPane");
  const chatPane = document.getElementById("chatPane");
  const mobileBackBtn = document.getElementById("mobileBackBtn");

  const desktopMenuBtn = document.getElementById("desktopMenuBtn");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const dropdownMenu = document.getElementById("dropdownMenu");

  const currentUserAvatar = document.getElementById("currentUserAvatar");
  const currentUserName = document.getElementById("currentUserName");
  const currentUserHandle = document.getElementById("currentUserHandle");

  const contactSearchInput = document.getElementById("contactSearchInput");
  const categoryTabs = document.getElementById("categoryTabs");
  const customListsBar = document.getElementById("customListsBar");
  const chatListContainer = document.getElementById("chatListContainer");

  const emptyChatState = document.getElementById("emptyChatState");
  const activeChatView = document.getElementById("activeChatView");
  const activeChatAvatar = document.getElementById("activeChatAvatar");
  const activeChatTitle = document.getElementById("activeChatTitle");
  const activeChatStatus = document.getElementById("activeChatStatus");
  const messagesContainer = document.getElementById("messagesContainer");

  const summarizeChatBtn = document.getElementById("summarizeChatBtn");
  const summaryBanner = document.getElementById("summaryBanner");
  const summaryList = document.getElementById("summaryList");
  const closeSummaryBtn = document.getElementById("closeSummaryBtn");

  const editNicknameBtn = document.getElementById("editNicknameBtn");
  const blockUserBtn = document.getElementById("blockUserBtn");
  const reportUserBtn = document.getElementById("reportUserBtn");

  const quickRepliesBar = document.getElementById("quickRepliesBar");
  const toggleAiToolsBtn = document.getElementById("toggleAiToolsBtn");
  const aiRewriteToolbar = document.getElementById("aiRewriteToolbar");
  const toneFormalBtn = document.getElementById("toneFormalBtn");
  const toneFriendlyBtn = document.getElementById("toneFriendlyBtn");
  const translateLangSelect = document.getElementById("translateLangSelect");
  const translateTextBtn = document.getElementById("translateTextBtn");

  const burnToggleBtn = document.getElementById("burnToggleBtn");
  const voiceInputBtn = document.getElementById("voiceInputBtn");
  const openCodeSnippetBtn = document.getElementById("openCodeSnippetBtn");
  const fileAttachInput = document.getElementById("fileAttachInput");
  const attachmentPreviewBar = document.getElementById("attachmentPreviewBar");

  const messageForm = document.getElementById("messageForm");
  const messageInput = document.getElementById("messageInput");

  const modalBackdrop = document.getElementById("modalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const closeModalBtn = document.getElementById("closeModalBtn");

  function showLoaderBrief() {
    if (!globalLoader) return;
    globalLoader.classList.remove("hidden");
    setTimeout(() => {
      globalLoader.classList.add("hidden");
    }, 260);
  }

  function checkAppLock() {
    const freshUser = ZynkStorage.getUserById(currentUser.user_id) || currentUser;
    const session = ZynkStorage.getSession();
    if (freshUser.app_lock_pin && (!session || !session.unlocked_pin)) {
      appLockOverlay.classList.remove("hidden");
      appLockInput.value = "";
      appLockError.textContent = "";
      appLockError.classList.remove("visible");
      appLockInput.focus();
    } else {
      appLockOverlay.classList.add("hidden");
    }
  }

  appLockUnlockBtn.addEventListener("click", () => {
    const freshUser = ZynkStorage.getUserById(currentUser.user_id) || currentUser;
    if (appLockInput.value.trim() === freshUser.app_lock_pin) {
      const session = ZynkStorage.getSession() || { user_id: freshUser.user_id };
      ZynkStorage.setSession({ ...session, unlocked_pin: true });
      appLockOverlay.classList.add("hidden");
    } else {
      appLockError.textContent = "Incorrect 4-digit PIN. Try again.";
      appLockError.classList.add("visible");
    }
  });

  function getInitials(name) {
    const parts = (name || "U").trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function getAvatarColor(seed) {
    const colors = ["#2563eb", "#0d9488", "#7c3aed", "#db2777", "#d97706", "#059669"];
    let sum = 0;
    for (let i = 0; i < seed.length; i += 1) {
      sum += seed.charCodeAt(i);
    }
    return colors[sum % colors.length];
  }

  function renderAvatar(container, name, picUrl, seed) {
    container.innerHTML = "";
    if (picUrl) {
      const img = document.createElement("img");
      img.src = picUrl;
      img.alt = name;
      img.onerror = () => {
        container.innerHTML = "";
        container.style.background = getAvatarColor(seed || name);
        container.textContent = getInitials(name);
      };
      container.appendChild(img);
    } else {
      container.style.background = getAvatarColor(seed || name);
      container.textContent = getInitials(name);
    }
  }

  function renderCurrentUserHeader() {
    const fresh = ZynkStorage.getUserById(currentUser.user_id) || currentUser;
    currentUserName.textContent = fresh.name;
    currentUserHandle.textContent = "@" + fresh.username + " · " + (fresh.status || "online").toUpperCase();
    renderAvatar(currentUserAvatar, fresh.name, fresh.profile_pic, fresh.user_id);
  }

  function getDisplayNameForUser(user) {
    const nick = ZynkStorage.getNickname(currentUser.user_id, user.user_id);
    return nick ? nick + " (" + user.name + ")" : user.name;
  }

  function getUnreadCountForChat(item) {
    const msgs = ZynkStorage.getMessages();
    if (item.chat_type === "group") {
      return msgs.filter(
        (m) => m.chat_type === "group" && m.receiver_id === item.id && m.sender_id !== currentUser.user_id && m.unread
      ).length;
    }
    return msgs.filter(
      (m) => m.chat_type === "direct" && m.sender_id === item.id && m.receiver_id === currentUser.user_id && m.unread
    ).length;
  }

  function getLastMessageForChat(item) {
    const msgs = ZynkChatEngine.getChatMessages(currentUser.user_id, item);
    if (msgs.length === 0) return null;
    return msgs[msgs.length - 1];
  }

  function buildChatItems() {
    const users = ZynkStorage.getUsers().filter((u) => u.user_id !== currentUser.user_id);
    const groups = ZynkStorage.getGroups();

    const userItems = users.map((u) => {
      const blockedByMe = ZynkStorage.isBlocked(currentUser.user_id, u.user_id);
      return {
        id: u.user_id,
        chat_type: "direct",
        raw_user: u,
        name: blockedByMe ? u.name + " (Blocked)" : getDisplayNameForUser(u),
        subtitle: blockedByMe ? "Blocked" : u.status === "online" ? "Online" : "Offline",
        pic: blockedByMe ? "" : u.profile_pic,
        is_group: false
      };
    });

    const groupItems = groups.map((g) => ({
      id: g.group_id,
      chat_type: "group",
      raw_group: g,
      name: g.name,
      subtitle: g.description || "Group Chat",
      pic: "",
      is_group: true
    }));

    return [...userItems, ...groupItems];
  }

  function renderCustomListsBar() {
    const lists = ZynkStorage.getCustomLists(currentUser.user_id);
    if (lists.length === 0) {
      customListsBar.classList.add("hidden");
      customListsBar.innerHTML = "";
      return;
    }

    customListsBar.classList.remove("hidden");
    customListsBar.innerHTML = "";

    lists.forEach((lst) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tab-btn" + (activeCustomListId === lst.id ? " active" : "");
      btn.textContent = lst.title;
      btn.addEventListener("click", () => {
        activeCustomListId = activeCustomListId === lst.id ? null : lst.id;
        renderCustomListsBar();
        renderChatList();
      });
      customListsBar.appendChild(btn);
    });
  }

  function renderChatList() {
    const query = (contactSearchInput.value || "").trim().toLowerCase();
    let items = buildChatItems();

    if (activeFilter === "unread") {
      items = items.filter((item) => getUnreadCountForChat(item) > 0);
    } else if (activeFilter === "groups") {
      items = items.filter((item) => item.is_group);
    }

    if (activeCustomListId) {
      const lists = ZynkStorage.getCustomLists(currentUser.user_id);
      const selectedList = lists.find((l) => l.id === activeCustomListId);
      if (selectedList && Array.isArray(selectedList.member_ids)) {
        items = items.filter((item) => selectedList.member_ids.includes(item.id));
      }
    }

    if (query) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query)
      );
    }

    chatListContainer.innerHTML = "";

   if (items.length === 0) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "not-found-box";

      if (query) {
        emptyBox.textContent = "User not found";
      } else if (activeFilter === "unread") {
        emptyBox.textContent = "No unread message";
      } else if (activeFilter === "groups") {
        emptyBox.textContent = "No groups available";
      } else {
        emptyBox.textContent = "No chats available";
      }

      chatListContainer.appendChild(emptyBox);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "chat-row" + (activeChat && activeChat.id === item.id ? " active" : "");

      const avatar = document.createElement("div");
      avatar.className = "avatar-box";
      renderAvatar(avatar, item.name, item.pic, item.id);

      const body = document.createElement("div");
      body.className = "chat-row-body";

      const top = document.createElement("div");
      top.className = "chat-row-top";

      const titleEl = document.createElement("span");
      titleEl.className = "chat-row-name";
      titleEl.textContent = item.name;

      const lastMsg = getLastMessageForChat(item);
      const timeEl = document.createElement("span");
      timeEl.className = "chat-row-time";
      timeEl.textContent = lastMsg ? new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

      top.appendChild(titleEl);
      top.appendChild(timeEl);

      const bottom = document.createElement("div");
      bottom.className = "chat-row-bottom";

      const previewEl = document.createElement("span");
      previewEl.className = "chat-row-preview";
      if (lastMsg) {
        previewEl.textContent =
          lastMsg.type === "code"
            ? "[Code Snippet]"
            : lastMsg.type === "image"
            ? "[Photo]"
            : lastMsg.type === "file"
            ? "[File: " + lastMsg.file_name + "]"
            : lastMsg.burn_on_read
            ? "[10s Secret Message]"
            : lastMsg.text;
      } else {
        previewEl.textContent = item.subtitle;
      }

      bottom.appendChild(previewEl);

      const unreadCount = getUnreadCountForChat(item);
      if (unreadCount > 0) {
        const badge = document.createElement("span");
        badge.className = "unread-badge";
        badge.textContent = String(unreadCount);
        bottom.appendChild(badge);
      }

      body.appendChild(top);
      body.appendChild(bottom);

      row.appendChild(avatar);
      row.appendChild(body);

      row.addEventListener("click", () => {
        openChat(item);
      });

      chatListContainer.appendChild(row);
    });
  }

  function applyWallpaper() {
    const fresh = ZynkStorage.getUserById(currentUser.user_id) || currentUser;
    const wp = fresh.wallpaper_url || "default";
    messagesContainer.style.backgroundImage = "";
    messagesContainer.style.background = "";

    if (wp.startsWith("data:image") || wp.startsWith("http") || wp.startsWith("assets/")) {
      messagesContainer.style.backgroundImage = "url('" + wp + "')";
      messagesContainer.style.backgroundSize = "cover";
      messagesContainer.style.backgroundPosition = "center";
    } else if (wp.startsWith("linear-gradient") || wp.startsWith("#") || wp.startsWith("rgb")) {
      messagesContainer.style.backgroundImage = "none";
      messagesContainer.style.backgroundColor = wp;
      messagesContainer.style.background = wp;
    } else {
      messagesContainer.style.background = "var(--bg-chat-area)";
    }
  }

  function openChat(item) {
    showLoaderBrief();
    ZynkChatEngine.clearTimers();
    typingText = "";
    activeChat = item;

    ZynkChatEngine.markChatAsRead(currentUser.user_id, activeChat);
    emptyChatState.classList.add("hidden");
    activeChatView.classList.remove("hidden");
    summaryBanner.classList.add("hidden");

    if (window.innerWidth <= 768) {
      sidebarPane.classList.add("mobile-hidden");
      chatPane.classList.remove("mobile-hidden");
    }

    updateActiveChatHeader();
    applyWallpaper();
    renderChatList();
    renderMessages();
    renderQuickReplies();
  }

  function updateActiveChatHeader() {
    if (!activeChat) return;

    if (activeChat.chat_type === "direct") {
      const freshTarget = ZynkStorage.getUserById(activeChat.id) || activeChat.raw_user;
      const blocked = ZynkStorage.isBlocked(currentUser.user_id, freshTarget.user_id);
      const displayName = getDisplayNameForUser(freshTarget);

      activeChatTitle.textContent = blocked ? displayName + " (Blocked)" : displayName;
      renderAvatar(
        activeChatAvatar,
        displayName,
        blocked ? "" : freshTarget.profile_pic,
        freshTarget.user_id
      );

      if (typingText) {
        activeChatStatus.innerHTML = '<span class="typing-indicator">' + typingText + ' <span class="typing-dots"><span></span><span></span><span></span></span></span>';
      } else if (blocked) {
        activeChatStatus.textContent = "Blocked · Activity hidden";
      } else {
        activeChatStatus.textContent = freshTarget.status === "online" ? "Online" : "Offline";
      }

      editNicknameBtn.classList.remove("hidden");
      blockUserBtn.classList.remove("hidden");
      reportUserBtn.classList.remove("hidden");
      blockUserBtn.textContent = blocked ? "🔓" : "🚫";
    } else {
      const freshGroup = ZynkStorage.getGroups().find((g) => g.group_id === activeChat.id) || activeChat.raw_group;
      activeChatTitle.textContent = freshGroup.name;
      renderAvatar(activeChatAvatar, freshGroup.name, "", freshGroup.group_id);

      if (typingText) {
        activeChatStatus.innerHTML = '<span class="typing-indicator">' + typingText + ' <span class="typing-dots"><span></span><span></span><span></span></span></span>';
      } else {
        activeChatStatus.textContent = (freshGroup.members ? freshGroup.members.length : 3) + " members · Group";
      }

      editNicknameBtn.classList.add("hidden");
      blockUserBtn.classList.add("hidden");
      reportUserBtn.classList.add("hidden");
    }
  }

  function renderMessages() {
    if (!activeChat) return;
    const msgs = ZynkChatEngine.getChatMessages(currentUser.user_id, activeChat);
    const users = ZynkStorage.getUsers();
    const usersMap = {};
    users.forEach((u) => {
      usersMap[u.user_id] = u;
    });

    messagesContainer.innerHTML = "";

    msgs.forEach((m) => {
      const isSent = m.sender_id === currentUser.user_id;
      const row = document.createElement("div");
      row.className = "msg-row " + (isSent ? "sent" : "received");

      if (activeChat.chat_type === "group" && !isSent) {
        const senderObj = usersMap[m.sender_id];
        const label = document.createElement("div");
        label.className = "msg-sender-label";
        label.textContent = senderObj ? senderObj.name : "Member";
        row.appendChild(label);
      }

      const bubble = document.createElement("div");
      bubble.className = "msg-bubble";

      if (m.burn_on_read && !m.burn_revealed) {
        bubble.classList.add("burn-blurred");
      }

      if (m.text) {
        const textSpan = document.createElement("div");
        textSpan.textContent = m.text;
        bubble.appendChild(textSpan);
      }

      if (m.type === "code" && m.code_content) {
        const codeBox = document.createElement("div");
        codeBox.className = "code-block-box";

        const topBar = document.createElement("div");
        topBar.className = "code-block-top";

        const langTag = document.createElement("span");
        langTag.textContent = m.code_language || "Code";

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "msg-action-link";
        copyBtn.textContent = "Copy";
        copyBtn.addEventListener("click", () => ZynkVoiceCode.copyText(m.code_content, copyBtn));

        topBar.appendChild(langTag);
        topBar.appendChild(copyBtn);

        const preEl = document.createElement("pre");
        preEl.textContent = m.code_content;

        codeBox.appendChild(topBar);
        codeBox.appendChild(preEl);
        bubble.appendChild(codeBox);
      }

      if ((m.type === "image" || m.type === "file") && m.file_url) {
        const mediaCard = document.createElement("div");
        mediaCard.className = "media-card";

        if (m.type === "image") {
          const img = document.createElement("img");
          img.src = m.file_url;
          img.alt = m.file_name || "Image";
          mediaCard.appendChild(img);
        }

        const fileLabel = document.createElement("div");
        fileLabel.textContent = m.file_name || "Attachment";
        mediaCard.appendChild(fileLabel);

        const dlBtn = document.createElement("button");
        dlBtn.type = "button";
        dlBtn.className = "msg-action-link";
        dlBtn.textContent = "Download / Preview";

        dlBtn.addEventListener("click", () => {
          const overlay = document.createElement("div");
          overlay.className = "media-spinner-overlay";
          overlay.innerHTML = '<div class="spinner spinner-sm"></div>';
          mediaCard.appendChild(overlay);

          setTimeout(() => {
            overlay.remove();
            const link = document.createElement("a");
            link.href = m.file_url;
            link.download = m.file_name || "zynkchat_file";
            document.body.appendChild(link);
            link.click();
            link.remove();
          }, 600);
        });

        mediaCard.appendChild(dlBtn);
        bubble.appendChild(mediaCard);
      }

      row.appendChild(bubble);

      const meta = document.createElement("div");
      meta.className = "msg-meta";

      const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const timeSpan = document.createElement("span");
      timeSpan.textContent = timeStr;
      meta.appendChild(timeSpan);

      if (m.burn_on_read) {
        const burnBtn = document.createElement("button");
        burnBtn.type = "button";
        burnBtn.className = "msg-action-link";
        burnBtn.textContent = burnCounters[m.msg_id]
          ? "🔥 " + burnCounters[m.msg_id] + "s"
          : "🔥 Open 10s";

        burnBtn.addEventListener("click", () => {
          if (burnCounters[m.msg_id]) return;
          ZynkChatEngine.startBurnCountdown(
            m.msg_id,
            (sec) => {
              burnCounters[m.msg_id] = sec;
              renderMessages();
            },
            () => {
              delete burnCounters[m.msg_id];
              renderMessages();
              renderChatList();
            }
          );
        });
        meta.appendChild(burnBtn);
      }

      if (m.text) {
        const speakBtn = document.createElement("button");
        speakBtn.type = "button";
        speakBtn.className = "msg-action-link";
        speakBtn.textContent = "🔊";
        speakBtn.title = "Read Aloud";
        speakBtn.addEventListener("click", () => ZynkVoiceCode.readAloud(m.text));
        meta.appendChild(speakBtn);
      }

      if (isSent) {
        const statusLabel = document.createElement("span");
        const st = m.traffic_status || "offline";
        statusLabel.textContent = st === "seen" ? "Seen" : st === "delivered" ? "Delivered" : "Sent";

        const dot = document.createElement("span");
        dot.className = "traffic-dot " + st;

        meta.appendChild(statusLabel);
        meta.appendChild(dot);
      }

      row.appendChild(meta);
      messagesContainer.appendChild(row);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function renderQuickReplies() {
    if (!activeChat) return;
    const msgs = ZynkChatEngine.getChatMessages(currentUser.user_id, activeChat);
    const lastIncoming = [...msgs].reverse().find((m) => m.sender_id !== currentUser.user_id && m.text);
    const suggestions = ZynkAI.getQuickReplies(lastIncoming ? lastIncoming.text : "");

    quickRepliesBar.innerHTML = "";
    suggestions.forEach((replyText) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-reply-btn";
      btn.textContent = replyText;
      btn.addEventListener("click", () => {
        messageInput.value = replyText;
        messageInput.focus();
      });
      quickRepliesBar.appendChild(btn);
    });
  }

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeChat) return;

    const ok = ZynkChatEngine.sendMessage(
      {
        currentUser,
        targetChat: activeChat,
        text: messageInput.value,
        attachment: pendingAttachment,
        codeSnippet: pendingCodeSnippet,
        isBurnOnRead: burnModeEnabled
      },
      () => {
        renderMessages();
        renderChatList();
        renderQuickReplies();
      },
      (isTyping, whoName) => {
        typingText = isTyping ? whoName + " is typing" : "";
        updateActiveChatHeader();
      }
    );

    if (ok) {
      messageInput.value = "";
      pendingAttachment = null;
      pendingCodeSnippet = null;
      burnModeEnabled = false;
      burnToggleBtn.classList.remove("active-tool");
      attachmentPreviewBar.classList.add("hidden");
      attachmentPreviewBar.innerHTML = "";
    }
  });

  fileAttachInput.addEventListener("change", () => {
    const file = fileAttachInput.files && fileAttachInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      pendingAttachment = {
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_url: reader.result
      };
      attachmentPreviewBar.classList.remove("hidden");
      attachmentPreviewBar.innerHTML = "";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = "Attached: " + file.name;

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "tiny-close-btn";
      clearBtn.textContent = "✕";
      clearBtn.addEventListener("click", () => {
        pendingAttachment = null;
        fileAttachInput.value = "";
        attachmentPreviewBar.classList.add("hidden");
        attachmentPreviewBar.innerHTML = "";
      });

      attachmentPreviewBar.appendChild(nameSpan);
      attachmentPreviewBar.appendChild(clearBtn);
    };
    reader.readAsDataURL(file);
  });

  burnToggleBtn.addEventListener("click", () => {
    burnModeEnabled = !burnModeEnabled;
    burnToggleBtn.classList.toggle("active-tool", burnModeEnabled);
  });

  voiceInputBtn.addEventListener("click", () => {
    ZynkVoiceCode.toggleVoiceToText(messageInput, voiceInputBtn, (statusMsg) => {
      if (statusMsg) {
        messageInput.placeholder = statusMsg;
      } else {
        messageInput.placeholder = "Type a message or emoji...";
      }
    });
  });

  openCodeSnippetBtn.addEventListener("click", () => {
    ZynkVoiceCode.openCodeModal((snippetObj) => {
      pendingCodeSnippet = snippetObj;
      attachmentPreviewBar.classList.remove("hidden");
      attachmentPreviewBar.innerHTML = "";

      const tagSpan = document.createElement("span");
      tagSpan.textContent = "Code Snippet (" + snippetObj.language + ") ready to send";

      const clearBtn = document.createElement("button");
      clearBtn.type = "button";
      clearBtn.className = "tiny-close-btn";
      clearBtn.textContent = "✕";
      clearBtn.addEventListener("click", () => {
        pendingCodeSnippet = null;
        attachmentPreviewBar.classList.add("hidden");
        attachmentPreviewBar.innerHTML = "";
      });

      attachmentPreviewBar.appendChild(tagSpan);
      attachmentPreviewBar.appendChild(clearBtn);
    });
  });

  toggleAiToolsBtn.addEventListener("click", () => {
    aiRewriteToolbar.classList.toggle("hidden");
  });

  toneFormalBtn.addEventListener("click", () => {
    if (!messageInput.value.trim()) return;
    messageInput.value = ZynkAI.rewriteTone(messageInput.value, "formal");
  });

  toneFriendlyBtn.addEventListener("click", () => {
    if (!messageInput.value.trim()) return;
    messageInput.value = ZynkAI.rewriteTone(messageInput.value, "friendly");
  });

  translateTextBtn.addEventListener("click", () => {
    if (!messageInput.value.trim()) return;
    messageInput.value = ZynkAI.translateText(messageInput.value, translateLangSelect.value);
  });

  summarizeChatBtn.addEventListener("click", () => {
    if (!activeChat) return;
    const msgs = ZynkChatEngine.getChatMessages(currentUser.user_id, activeChat);
    const usersMap = {};
    ZynkStorage.getUsers().forEach((u) => {
      usersMap[u.user_id] = u;
    });
    const points = ZynkAI.summarizeMessages(msgs, usersMap);
    summaryList.innerHTML = "";
    points.forEach((pt) => {
      const li = document.createElement("li");
      li.textContent = pt;
      summaryList.appendChild(li);
    });
    summaryBanner.classList.remove("hidden");

    aiRewriteToolbar.classList.add("hidden");
  });

  closeSummaryBtn.addEventListener("click", () => {
    summaryBanner.classList.add("hidden");
  });

  function openSimpleModal(titleText, contentNodes) {
    modalTitle.textContent = titleText;
    modalBody.innerHTML = "";
    contentNodes.forEach((node) => modalBody.appendChild(node));
    modalBackdrop.classList.remove("hidden");
  }

  closeModalBtn.addEventListener("click", () => {
    modalBackdrop.classList.add("hidden");
  });

  editNicknameBtn.addEventListener("click", () => {
    if (!activeChat || activeChat.chat_type !== "direct") return;
    const existingNick = ZynkStorage.getNickname(currentUser.user_id, activeChat.id);

    const input = document.createElement("input");
    input.type = "text";
    input.className = "form-input";
    input.value = existingNick;
    input.placeholder = "Enter custom nickname";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "primary-btn full-width";
    saveBtn.textContent = "Save Nickname";

    saveBtn.addEventListener("click", () => {
      ZynkStorage.setNickname(currentUser.user_id, activeChat.id, input.value);
      modalBackdrop.classList.add("hidden");
      updateActiveChatHeader();
      renderChatList();
    });

    openSimpleModal("Edit Contact Nickname", [input, saveBtn]);
  });

  blockUserBtn.addEventListener("click", () => {
    if (!activeChat || activeChat.chat_type !== "direct") return;
    ZynkStorage.toggleBlock(currentUser.user_id, activeChat.id);
    updateActiveChatHeader();
    renderChatList();
  });

  reportUserBtn.addEventListener("click", () => {
    if (!activeChat || activeChat.chat_type !== "direct") return;
    const reasonInput = document.createElement("input");
    reasonInput.type = "text";
    reasonInput.className = "form-input";
    reasonInput.placeholder = "Reason for reporting user...";

    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.className = "primary-btn full-width";
    submitBtn.textContent = "Submit Report";

    submitBtn.addEventListener("click", () => {
      ZynkStorage.addReport({
        reporter_id: currentUser.user_id,
        reported_id: activeChat.id,
        reason: reasonInput.value.trim() || "Unspecified",
        created_at: new Date().toISOString()
      });
      modalBackdrop.classList.add("hidden");
    });

    openSimpleModal("Report User", [reasonInput, submitBtn]);
  });

  function openCreateGroupModal() {
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "form-input";
    nameInput.placeholder = "Group Name";

    const descInput = document.createElement("input");
    descInput.type = "text";
    descInput.className = "form-input";
    descInput.placeholder = "Short description";

    const createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.className = "primary-btn full-width";
    createBtn.textContent = "Create Group";

    createBtn.addEventListener("click", () => {
      const gName = nameInput.value.trim();
      if (!gName) return;
      const allUsers = ZynkStorage.getUsers().map((u) => u.user_id);
      ZynkStorage.addGroup({
        group_id: "grp_" + Date.now(),
        name: gName,
        description: descInput.value.trim() || "Custom group",
        members: allUsers,
        created_at: new Date().toISOString()
      });
      modalBackdrop.classList.add("hidden");
      activeFilter = "groups";
      document.querySelectorAll(".tab-btn[data-filter]").forEach((b) => {
        b.classList.toggle("active", b.dataset.filter === "groups");
      });
      renderChatList();
    });

    openSimpleModal("Create New Group", [nameInput, descInput, createBtn]);
  }

  function openCreateCustomListModal() {
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.className = "form-input";
    titleInput.placeholder = "List name (e.g. Close Friends, Team)";

    const users = ZynkStorage.getUsers().filter((u) => u.user_id !== currentUser.user_id);
    const checkList = document.createElement("div");
    checkList.style.display = "flex";
    checkList.style.flexDirection = "column";
    checkList.style.gap = "6px";

    users.forEach((u) => {
      const lbl = document.createElement("label");
      lbl.style.display = "flex";
      lbl.style.alignItems = "center";
      lbl.style.gap = "8px";
      lbl.style.fontSize = "13.5px";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = u.user_id;

      lbl.appendChild(cb);
      lbl.appendChild(document.createTextNode(u.name));
      checkList.appendChild(lbl);
    });

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "primary-btn full-width";
    saveBtn.textContent = "Save Custom List";

    saveBtn.addEventListener("click", () => {
      const titleVal = titleInput.value.trim();
      if (!titleVal) return;
      const selectedIds = Array.from(checkList.querySelectorAll("input:checked")).map((c) => c.value);
      const created = ZynkStorage.addCustomList({
        id: "lst_" + Date.now(),
        owner_id: currentUser.user_id,
        title: titleVal,
        member_ids: selectedIds
      });
      activeCustomListId = created.id;
      modalBackdrop.classList.add("hidden");
      renderCustomListsBar();
      renderChatList();
    });

    openSimpleModal("Create Custom Filter List", [titleInput, checkList, saveBtn]);
  }

  function toggleDropdown() {
    dropdownMenu.classList.toggle("hidden");
  }

  desktopMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  mobileMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#dropdownMenu") && !e.target.closest("#desktopMenuBtn") && !e.target.closest("#mobileMenuBtn")) {
      dropdownMenu.classList.add("hidden");
    }
    if (!e.target.closest("#aiRewriteToolbar") && !e.target.closest("#toggleAiToolsBtn")) {
      aiRewriteToolbar.classList.add("hidden");
    }
  });

  document.getElementById("menuUnreadBtn").addEventListener("click", () => {
    activeFilter = "unread";
    document.querySelectorAll(".tab-btn[data-filter]").forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === "unread");
    });
    renderChatList();
  });

  document.getElementById("menuGroupsBtn").addEventListener("click", () => {
    activeFilter = "groups";
    document.querySelectorAll(".tab-btn[data-filter]").forEach((b) => {
      b.classList.toggle("active", b.dataset.filter === "groups");
    });
    renderChatList();
  });

  document.getElementById("menuNewGroupBtn").addEventListener("click", openCreateGroupModal);
  document.getElementById("menuCustomListBtn").addEventListener("click", openCreateCustomListModal);
  document.getElementById("addCustomListTabBtn").addEventListener("click", openCreateCustomListModal);

  document.getElementById("menuLogoutBtn").addEventListener("click", () => {
    ZynkChatEngine.clearTimers();
    ZynkAuth.logout();
  });

  categoryTabs.querySelectorAll(".tab-btn[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter;
      categoryTabs.querySelectorAll(".tab-btn[data-filter]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderChatList();
    });
  });

  contactSearchInput.addEventListener("input", renderChatList);

  mobileBackBtn.addEventListener("click", () => {
    chatPane.classList.add("mobile-hidden");
    sidebarPane.classList.remove("mobile-hidden");
  });

  checkAppLock();
  renderCurrentUserHeader();
  renderCustomListsBar();
  renderChatList();
  
  const themeToggleEl = document.getElementById("themeToggleBtn");
  if (themeToggleEl) {
    themeToggleEl.addEventListener("click", () => {
      setTimeout(() => {
        applyWallpaper();
        renderChatList();
        if (activeChat) {
          updateActiveChatHeader();
          renderMessages();
        }
      }, 20);
    });
  }
});

const ZYNK_KEYS = {
  USERS: "zynk_users_v1",
  SESSION: "zynk_session_v1",
  MESSAGES: "zynk_messages_v1",
  GROUPS: "zynk_groups_v1",
  CUSTOM_LISTS: "zynk_custom_lists_v1",
  NICKNAMES: "zynk_nicknames_v1",
  BLOCKS: "zynk_blocks_v1",
  REPORTS: "zynk_reports_v1",
  THEME: "zynk_theme_v1"
};

const DEFAULT_DEMO_USERS = [
  {
    user_id: "usr_aarav",
    name: "Aarav Sharma",
    username: "aarav",
    email: "aarav@zynkchat.in",
    password: "password123",
    status: "online",
    profile_pic: "",
    app_lock_pin: "",
    wallpaper_url: "default",
    is_demo: true,
    created_at: "2026-11-20T10:00:00.000Z"
  },
  {
    user_id: "usr_meera",
    name: "Meera Verma",
    username: "meera",
    email: "meera@zynkchat.in",
    password: "password123",
    status: "online",
    profile_pic: "",
    app_lock_pin: "",
    wallpaper_url: "default",
    is_demo: true,
    created_at: "2026-11-20T10:05:00.000Z"
  },
  {
    user_id: "usr_rohan",
    name: "Rohan Singh",
    username: "rohan",
    email: "rohan@zynkchat.in",
    password: "password123",
    status: "offline",
    profile_pic: "",
    app_lock_pin: "",
    wallpaper_url: "default",
    is_demo: true,
    created_at: "2026-11-20T10:10:00.000Z"
  }
];

const DEFAULT_GROUPS = [
  {
    group_id: "grp_bca_project",
    name: "Final Year Project Team",
    description: "ZynkChat college presentation & demo coordination",
    members: ["usr_aarav", "usr_meera", "usr_rohan"],
    created_at: "2026-11-21T09:00:00.000Z"
  }
];

const ZynkStorage = {
  init() {
    if (!localStorage.getItem(ZYNK_KEYS.USERS)) {
      localStorage.setItem(ZYNK_KEYS.USERS, JSON.stringify(DEFAULT_DEMO_USERS));
    }
    if (!localStorage.getItem(ZYNK_KEYS.GROUPS)) {
      localStorage.setItem(ZYNK_KEYS.GROUPS, JSON.stringify(DEFAULT_GROUPS));
    }
    if (!localStorage.getItem(ZYNK_KEYS.MESSAGES)) {
      localStorage.setItem(ZYNK_KEYS.MESSAGES, JSON.stringify([]));
    }
    if (!localStorage.getItem(ZYNK_KEYS.CUSTOM_LISTS)) {
      localStorage.setItem(ZYNK_KEYS.CUSTOM_LISTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(ZYNK_KEYS.NICKNAMES)) {
      localStorage.setItem(ZYNK_KEYS.NICKNAMES, JSON.stringify({}));
    }
    if (!localStorage.getItem(ZYNK_KEYS.BLOCKS)) {
      localStorage.setItem(ZYNK_KEYS.BLOCKS, JSON.stringify({}));
    }
    if (!localStorage.getItem(ZYNK_KEYS.REPORTS)) {
      localStorage.setItem(ZYNK_KEYS.REPORTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(ZYNK_KEYS.THEME)) {
      localStorage.setItem(ZYNK_KEYS.THEME, "light");
    }
  },

  readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  },

  writeJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getUsers() {
    this.init();
    return this.readJSON(ZYNK_KEYS.USERS, []);
  },

  saveUsers(users) {
    this.writeJSON(ZYNK_KEYS.USERS, users);
  },

  getUserById(userId) {
    return this.getUsers().find((u) => u.user_id === userId) || null;
  },

  updateUser(userId, updates) {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.user_id === userId);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    this.saveUsers(users);
    return users[index];
  },

  getSession() {
    return this.readJSON(ZYNK_KEYS.SESSION, null);
  },

  setSession(sessionObj) {
    this.writeJSON(ZYNK_KEYS.SESSION, sessionObj);
  },

  clearSession() {
    localStorage.removeItem(ZYNK_KEYS.SESSION);
  },

  getCurrentUser() {
    const session = this.getSession();
    if (!session || !session.user_id) return null;
    return this.getUserById(session.user_id);
  },

  seedStarterMessagesForUser(userId) {
    const messages = this.getMessages();
    const alreadySeeded = messages.some(
      (m) => m.sender_id === userId || m.receiver_id === userId
    );
    if (alreadySeeded) return;

    const now = Date.now();
    const starter = [
      {
        msg_id: "msg_" + (now - 300000),
        chat_type: "direct",
        sender_id: "usr_aarav",
        receiver_id: userId,
        text: "Hey! Welcome to ZynkChat. Ready for tomorrow's college presentation?",
        type: "text",
        traffic_status: "seen",
        unread: true,
        timestamp: new Date(now - 300000).toISOString()
      },
      {
        msg_id: "msg_" + (now - 180000),
        chat_type: "direct",
        sender_id: "usr_meera",
        receiver_id: userId,
        text: "Maine UI layout aur dark mode check kiya, bohot clean lag raha hai!",
        type: "text",
        traffic_status: "seen",
        unread: true,
        timestamp: new Date(now - 180000).toISOString()
      },
      {
        msg_id: "msg_" + (now - 90000),
        chat_type: "group",
        sender_id: "usr_aarav",
        receiver_id: "grp_bca_project",
        text: "Sab log demo ke liye apne test messages aur AI features verify kar lena.",
        type: "text",
        traffic_status: "seen",
        unread: false,
        timestamp: new Date(now - 90000).toISOString()
      }
    ];

    this.saveMessages([...messages, ...starter]);
  },

  getMessages() {
    this.init();
    return this.readJSON(ZYNK_KEYS.MESSAGES, []);
  },

  saveMessages(messages) {
    this.writeJSON(ZYNK_KEYS.MESSAGES, messages);
  },

  addMessage(messageObj) {
    const messages = this.getMessages();
    messages.push(messageObj);
    this.saveMessages(messages);
    return messageObj;
  },

  updateMessage(msgId, updates) {
    const messages = this.getMessages();
    const index = messages.findIndex((m) => m.msg_id === msgId);
    if (index === -1) return null;
    messages[index] = { ...messages[index], ...updates };
    this.saveMessages(messages);
    return messages[index];
  },

  deleteMessage(msgId) {
    const messages = this.getMessages().filter((m) => m.msg_id !== msgId);
    this.saveMessages(messages);
  },

  getGroups() {
    this.init();
    return this.readJSON(ZYNK_KEYS.GROUPS, []);
  },

  saveGroups(groups) {
    this.writeJSON(ZYNK_KEYS.GROUPS, groups);
  },

  addGroup(groupObj) {
    const groups = this.getGroups();
    groups.push(groupObj);
    this.saveGroups(groups);
    return groupObj;
  },

  getCustomLists(ownerId) {
    const all = this.readJSON(ZYNK_KEYS.CUSTOM_LISTS, []);
    return all.filter((item) => item.owner_id === ownerId);
  },

  addCustomList(listObj) {
    const all = this.readJSON(ZYNK_KEYS.CUSTOM_LISTS, []);
    all.push(listObj);
    this.writeJSON(ZYNK_KEYS.CUSTOM_LISTS, all);
    return listObj;
  },

  getNickname(ownerId, targetId) {
    const map = this.readJSON(ZYNK_KEYS.NICKNAMES, {});
    return (map[ownerId] && map[ownerId][targetId]) || "";
  },

  setNickname(ownerId, targetId, nickname) {
    const map = this.readJSON(ZYNK_KEYS.NICKNAMES, {});
    if (!map[ownerId]) map[ownerId] = {};
    if (nickname.trim()) {
      map[ownerId][targetId] = nickname.trim();
    } else {
      delete map[ownerId][targetId];
    }
    this.writeJSON(ZYNK_KEYS.NICKNAMES, map);
  },

  isBlocked(blockerId, targetId) {
    const blocks = this.readJSON(ZYNK_KEYS.BLOCKS, {});
    return Array.isArray(blocks[blockerId]) && blocks[blockerId].includes(targetId);
  },

  toggleBlock(blockerId, targetId) {
    const blocks = this.readJSON(ZYNK_KEYS.BLOCKS, {});
    if (!Array.isArray(blocks[blockerId])) blocks[blockerId] = [];
    const exists = blocks[blockerId].includes(targetId);
    if (exists) {
      blocks[blockerId] = blocks[blockerId].filter((id) => id !== targetId);
    } else {
      blocks[blockerId].push(targetId);
    }
    this.writeJSON(ZYNK_KEYS.BLOCKS, blocks);
    return !exists;
  },

  addReport(reportObj) {
    const reports = this.readJSON(ZYNK_KEYS.REPORTS, []);
    reports.push(reportObj);
    this.writeJSON(ZYNK_KEYS.REPORTS, reports);
  },

  getTheme() {
    return localStorage.getItem(ZYNK_KEYS.THEME) || "light";
  },

  setTheme(theme) {
    localStorage.setItem(ZYNK_KEYS.THEME, theme);
    document.documentElement.setAttribute("data-theme", theme);
  },

  applySavedTheme() {
    const theme = this.getTheme();
    document.documentElement.setAttribute("data-theme", theme);
    return theme;
  }
};

ZynkStorage.init();
ZynkStorage.applySavedTheme();
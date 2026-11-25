const ZynkAI = {
  rewriteTone(text, mode) {
    const clean = (text || "").trim();
    if (!clean) return "";

    const base = clean.charAt(0).toUpperCase() + clean.slice(1);
    const withPeriod = /[.!?]$/.test(base) ? base : base + ".";

    if (mode === "formal") {
      const normalized = withPeriod
        .replace(/\bhi\b/gi, "Hello")
        .replace(/\bhey\b/gi, "Hello")
        .replace(/\bpls\b/gi, "please")
        .replace(/\bplz\b/gi, "please")
        .replace(/\bu\b/gi, "you")
        .replace(/\bur\b/gi, "your")
        .replace(/\bthx\b/gi, "thank you")
        .replace(/\bthanks\b/gi, "thank you")
        .replace(/\basap\b/gi, "at your earliest convenience")
        .replace(/\bk\b/gi, "Understood");
      return "Kindly note: " + normalized + " Please let me know your thoughts.";
    }

    if (mode === "friendly") {
      return "Hey! 😊 " + withPeriod + " Hope everything is going great!";
    }

    return withPeriod;
  },

  translateText(text, targetLang) {
    const clean = (text || "").trim();
    if (!clean) return "";

    const lower = clean.toLowerCase();
    const dictionary = {
      hi: {
        "hello": "नमस्ते",
        "hi": "नमस्ते",
        "how are you": "आप कैसे हैं?",
        "how are you?": "आप कैसे हैं?",
        "thank you": "धन्यवाद",
        "thanks": "धन्यवाद",
        "good morning": "सुप्रभात",
        "good night": "शुभ रात्रि",
        "yes": "हाँ",
        "no": "नहीं",
        "ok": "ठीक है",
        "okay": "ठीक है",
        "ready for tomorrow's presentation": "कल के प्रेजेंटेशन के लिए तैयार हैं"
      },
      es: {
        "hello": "Hola",
        "hi": "Hola",
        "how are you": "¿Cómo estás?",
        "how are you?": "¿Cómo estás?",
        "thank you": "Muchas gracias",
        "thanks": "Gracias",
        "good morning": "Buenos días",
        "good night": "Buenas noches",
        "yes": "Sí",
        "no": "No",
        "ok": "Está bien",
        "okay": "Está bien"
      },
      en: {
        "नमस्ते": "Hello",
        "आप कैसे हैं?": "How are you?",
        "धन्यवाद": "Thank you",
        "ठीक है": "Okay",
        "हाँ": "Yes",
        "नहीं": "No"
      }
    };

    if (dictionary[targetLang] && dictionary[targetLang][lower]) {
      return dictionary[targetLang][lower];
    }

    if (targetLang === "hi") {
      return "[Hindi] " + clean + " (अनुवादित संदेश)";
    }
    if (targetLang === "es") {
      return "[Español] " + clean;
    }
    return "[English] " + clean;
  },

  summarizeMessages(messages, usersMap) {
    if (!Array.isArray(messages) || messages.length === 0) {
      return [
        "No recent messages in this conversation yet.",
        "Send a message or attach a file to start tracking updates.",
        "Use AI Quick Replies or Tone Rewriter for faster responses."
      ];
    }

    const recent = messages.slice(-6);
    const points = [];

    const first = recent[0];
    const firstSender = (usersMap[first.sender_id] && usersMap[first.sender_id].name) || "Participant";
    points.push(firstSender + " initiated discussion: \"" + this.shorten(first.text || first.file_name || "Shared media", 65) + "\"");

    const latest = recent[recent.length - 1];
    const latestSender = (usersMap[latest.sender_id] && usersMap[latest.sender_id].name) || "Participant";
    points.push("Latest update from " + latestSender + ": \"" + this.shorten(latest.text || latest.file_name || "Shared media", 65) + "\"");

    const unreadCount = messages.filter((m) => m.unread).length;
    const fileCount = messages.filter((m) => m.type === "image" || m.type === "file" || m.type === "code").length;
    points.push("Conversation stats: " + messages.length + " total messages, " + unreadCount + " unread, and " + fileCount + " shared attachments/code snippets.");

    return points;
  },

  getQuickReplies(lastIncomingText) {
    const text = (lastIncomingText || "").toLowerCase();

    if (text.includes("presentation") || text.includes("demo") || text.includes("project")) {
      return [
        "Yes, everything is tested and ready!",
        "Let's review the final checklist once.",
        "Sharing the latest update right now."
      ];
    }

    if (text.includes("?") || text.includes("how") || text.includes("kaisa") || text.includes("ready")) {
      return [
        "Yes, sounds good to me!",
        "Give me 5 minutes, checking now.",
        "Sure, let's proceed."
      ];
    }

    if (text.includes("thank") || text.includes("thanks") || text.includes("dhanyawad")) {
      return [
        "You're welcome! Happy to help.",
        "Anytime! Let me know if needed.",
        "Glad it worked smoothly!"
      ];
    }

    return [
      "Got it, thanks for the update!",
      "Looks great, let's continue.",
      "Can you share more details?"
    ];
  },

  shorten(str, maxLen) {
    if (!str) return "";
    return str.length > maxLen ? str.slice(0, maxLen - 3) + "..." : str;
  }
};
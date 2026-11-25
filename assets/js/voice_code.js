const ZynkVoiceCode = {
  recognition: null,
  isListening: false,

  toggleVoiceToText(inputEl, buttonEl, onStatus) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onStatus) onStatus("Voice typing is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (this.isListening && this.recognition) {
      this.recognition.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.isListening = true;
      if (buttonEl) buttonEl.classList.add("active-tool");
      if (onStatus) onStatus("Listening... Speak now");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (inputEl) {
        const current = inputEl.value.trim();
        inputEl.value = current ? current + " " + transcript : transcript;
        inputEl.focus();
      }
    };

    recognition.onerror = () => {
      if (onStatus) onStatus("Could not capture voice. Check microphone permission.");
    };

    recognition.onend = () => {
      this.isListening = false;
      if (buttonEl) buttonEl.classList.remove("active-tool");
      if (onStatus) onStatus("");
    };

    this.recognition = recognition;
    recognition.start();
  },

  readAloud(text) {
    const clean = (text || "").trim();
    if (!clean) return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = /[\u0900-\u097F]/.test(clean) ? "hi-IN" : "en-IN";
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  },

  openCodeModal(onSendCode) {
    const backdrop = document.getElementById("modalBackdrop");
    const title = document.getElementById("modalTitle");
    const body = document.getElementById("modalBody");
    if (!backdrop || !title || !body) return;

    title.textContent = "Send Code Snippet </>";
    body.innerHTML = "";

    const langSelect = document.createElement("select");
    langSelect.className = "form-input";
    ["JavaScript", "HTML", "CSS", "Python", "Java", "SQL"].forEach((lang) => {
      const opt = document.createElement("option");
      opt.value = lang;
      opt.textContent = lang;
      langSelect.appendChild(opt);
    });

    const codeArea = document.createElement("textarea");
    codeArea.className = "form-input";
    codeArea.rows = 7;
    codeArea.style.fontFamily = "Consolas, monospace";
    codeArea.placeholder = "Paste or write your code here...";

    const errorSpan = document.createElement("div");
    errorSpan.className = "field-error";

    const sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.className = "primary-btn full-width";
    sendBtn.textContent = "Send Code Block";

    sendBtn.addEventListener("click", () => {
      const codeText = codeArea.value.trim();
      if (!codeText) {
        errorSpan.textContent = "Please enter some code before sending.";
        errorSpan.classList.add("visible");
        return;
      }
      backdrop.classList.add("hidden");
      if (onSendCode) {
        onSendCode({
          language: langSelect.value,
          code: codeText
        });
      }
    });

    body.appendChild(langSelect);
    body.appendChild(codeArea);
    body.appendChild(errorSpan);
    body.appendChild(sendBtn);
    backdrop.classList.remove("hidden");
    codeArea.focus();
  },

  copyText(text, btnEl) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      if (btnEl) {
        const old = btnEl.textContent;
        btnEl.textContent = "Copied!";
        setTimeout(() => {
          btnEl.textContent = old;
        }, 1400);
      }
    });
  }
};
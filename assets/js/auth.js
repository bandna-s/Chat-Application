const ZynkAuth = {
  setFieldError(inputEl, errorEl, message) {
    if (!inputEl || !errorEl) return;
    if (message) {
      inputEl.classList.add("input-error");
      errorEl.textContent = message;
      errorEl.classList.add("visible");
    } else {
      inputEl.classList.remove("input-error");
      errorEl.textContent = "";
      errorEl.classList.remove("visible");
    }
  },

  setBannerError(bannerEl, message) {
    if (!bannerEl) return;
    if (message) {
      bannerEl.textContent = message;
      bannerEl.classList.add("visible");
    } else {
      bannerEl.textContent = "";
      bannerEl.classList.remove("visible");
    }
  },

  setBannerSuccess(bannerEl, message) {
    if (!bannerEl) return;
    bannerEl.classList.remove("form-banner-error", "form-banner-success", "visible");
    if (message) {
      bannerEl.classList.add("form-banner-success", "visible");
      bannerEl.textContent = message;
    } else {
      bannerEl.classList.add("form-banner-error");
      bannerEl.textContent = "";
    }
  },

  isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email.trim());
  },

  isValidUsername(username) {
    const pattern = /^[a-zA-Z0-9_]{3,20}$/;
    return pattern.test(username.trim());
  },

  loginUser(identifier, password) {
    const cleanId = identifier.trim().toLowerCase();
    const users = ZynkStorage.getUsers();

    const matchedUser = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.username.toLowerCase() === cleanId
    );

    if (!matchedUser) {
      return { ok: false, field: "identifier", message: "No account found with this email or username." };
    }

    if (matchedUser.password !== password) {
      return { ok: false, field: "password", message: "Incorrect password. Please enter correct details." };
    }

    const updated = ZynkStorage.updateUser(matchedUser.user_id, { status: "online" });
    ZynkStorage.seedStarterMessagesForUser(updated.user_id);
    ZynkStorage.setSession({
      user_id: updated.user_id,
      unlocked_pin: !updated.app_lock_pin,
      logged_in_at: new Date().toISOString()
    });

    return { ok: true, user: updated };
  },

  registerUser(name, username, email, password) {
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const users = ZynkStorage.getUsers();

    const usernameTaken = users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (usernameTaken) {
      return { ok: false, field: "username", message: "This username is already taken." };
    }

    const emailTaken = users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (emailTaken) {
      return { ok: false, field: "email", message: "An account with this email already exists." };
    }

    const newUser = {
      user_id: "usr_" + Date.now(),
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      password: password,
      status: "online",
      profile_pic: "",
      app_lock_pin: "",
      wallpaper_url: "default",
      is_demo: false,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    ZynkStorage.saveUsers(users);
    ZynkStorage.seedStarterMessagesForUser(newUser.user_id);
    ZynkStorage.setSession({
      user_id: newUser.user_id,
      unlocked_pin: true,
      logged_in_at: new Date().toISOString()
    });

    return { ok: true, user: newUser };
  },

  logout() {
    const currentUser = ZynkStorage.getCurrentUser();
    if (currentUser) {
      ZynkStorage.updateUser(currentUser.user_id, { status: "offline" });
    }
    ZynkStorage.clearSession();
    window.location.href = "index.html";
  },

  requireAuth() {
    const currentUser = ZynkStorage.getCurrentUser();
    if (!currentUser) {
      window.location.href = "index.html";
      return null;
    }
    if (currentUser.status !== "online") {
      ZynkStorage.updateUser(currentUser.user_id, { status: "online" });
    }
    return currentUser;
  },

  syncThemeToggleUI(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    const isDark = ZynkStorage.getTheme() === "dark";
    btn.setAttribute("aria-pressed", isDark ? "true" : "false");
  },

  bindThemeToggle(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    ZynkStorage.applySavedTheme();
    this.syncThemeToggleUI(buttonId);
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const currentTheme = ZynkStorage.getTheme();
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      ZynkStorage.setTheme(nextTheme);
      this.syncThemeToggleUI(buttonId);
    });
  }
};

document.addEventListener("DOMContentLoaded", () => {
  ZynkAuth.bindThemeToggle("themeToggleBtn");

  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  const existingUser = ZynkStorage.getCurrentUser();
  if (existingUser) {
    window.location.href = "dashboard.html";
    return;
  }

  const showLoginTab = document.getElementById("showLoginTab");
  const showSignupTab = document.getElementById("showSignupTab");
  const signupForm = document.getElementById("signupForm");
  const authHeading = document.getElementById("authHeading");
  const authSubtitle = document.getElementById("authSubtitle");
  const bannerError = document.getElementById("authBannerError");

  const loginIdentifier = document.getElementById("loginIdentifier");
  const loginPassword = document.getElementById("loginPassword");
  const loginIdentifierError = document.getElementById("loginIdentifierError");
  const loginPasswordError = document.getElementById("loginPasswordError");

  const signupName = document.getElementById("signupName");
  const signupUsername = document.getElementById("signupUsername");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const signupNameError = document.getElementById("signupNameError");
  const signupUsernameError = document.getElementById("signupUsernameError");
  const signupEmailError = document.getElementById("signupEmailError");
  const signupPasswordError = document.getElementById("signupPasswordError");

  function clearAllErrors() {
    bannerError.className = "form-banner-error";
    bannerError.textContent = "";
    ZynkAuth.setFieldError(loginIdentifier, loginIdentifierError, "");
    ZynkAuth.setFieldError(loginPassword, loginPasswordError, "");
    ZynkAuth.setFieldError(signupName, signupNameError, "");
    ZynkAuth.setFieldError(signupUsername, signupUsernameError, "");
    ZynkAuth.setFieldError(signupEmail, signupEmailError, "");
    ZynkAuth.setFieldError(signupPassword, signupPasswordError, "");
  }

  showLoginTab.addEventListener("click", () => {
    clearAllErrors();
    showLoginTab.classList.add("active");
    showSignupTab.classList.remove("active");
    loginForm.classList.remove("hidden-form");
    signupForm.classList.add("hidden-form");
    authHeading.textContent = "Welcome back";
    authSubtitle.textContent = "Sign in with your account to access your workspace chats.";
  });

  showSignupTab.addEventListener("click", () => {
    clearAllErrors();
    showSignupTab.classList.add("active");
    showLoginTab.classList.remove("active");
    signupForm.classList.remove("hidden-form");
    loginForm.classList.add("hidden-form");
    authHeading.textContent = "Create your account";
    authSubtitle.textContent = "Register once and start messaging in ZynkChat.";
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const idVal = loginIdentifier.value.trim();
    const passVal = loginPassword.value;
    let hasError = false;

    if (!idVal) {
      ZynkAuth.setFieldError(loginIdentifier, loginIdentifierError, "Please enter your email or username.");
      hasError = true;
    }

    if (!passVal) {
      ZynkAuth.setFieldError(loginPassword, loginPasswordError, "Please enter your password.");
      hasError = true;
    }

    if (hasError) return;

    const result = ZynkAuth.loginUser(idVal, passVal);
    if (!result.ok) {
      if (result.field === "identifier") {
        ZynkAuth.setFieldError(loginIdentifier, loginIdentifierError, result.message);
      } else if (result.field === "password") {
        ZynkAuth.setFieldError(loginPassword, loginPasswordError, result.message);
      } else {
        ZynkAuth.setBannerError(bannerError, result.message);
      }
      return;
    }

    window.location.href = "dashboard.html";
  });

  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    clearAllErrors();

    const nameVal = signupName.value.trim();
    const usernameVal = signupUsername.value.trim();
    const emailVal = signupEmail.value.trim();
    const passwordVal = signupPassword.value;
    let hasError = false;

    if (!nameVal || nameVal.length < 2) {
      ZynkAuth.setFieldError(signupName, signupNameError, "Full name must be at least 2 characters.");
      hasError = true;
    }

    if (!usernameVal) {
      ZynkAuth.setFieldError(signupUsername, signupUsernameError, "Username is required.");
      hasError = true;
    } else if (!ZynkAuth.isValidUsername(usernameVal)) {
      ZynkAuth.setFieldError(signupUsername, signupUsernameError, "Use 3-20 letters, numbers, or underscores only.");
      hasError = true;
    }

    if (!emailVal) {
      ZynkAuth.setFieldError(signupEmail, signupEmailError, "Email address is required.");
      hasError = true;
    } else if (!ZynkAuth.isValidEmail(emailVal)) {
      ZynkAuth.setFieldError(signupEmail, signupEmailError, "Enter a valid email address.");
      hasError = true;
    }

    if (!passwordVal) {
      ZynkAuth.setFieldError(signupPassword, signupPasswordError, "Password is required.");
      hasError = true;
    } else if (passwordVal.length < 6) {
      ZynkAuth.setFieldError(signupPassword, signupPasswordError, "Password must be at least 6 characters.");
      hasError = true;
    }

    if (hasError) return;

    const result = ZynkAuth.registerUser(nameVal, usernameVal, emailVal, passwordVal);
    if (!result.ok) {
      if (result.field === "username") {
        ZynkAuth.setFieldError(signupUsername, signupUsernameError, result.message);
      } else if (result.field === "email") {
        ZynkAuth.setFieldError(signupEmail, signupEmailError, result.message);
      } else {
        ZynkAuth.setBannerError(bannerError, result.message);
      }
      return;
    }

    ZynkStorage.clearSession();
    signupForm.reset();
    showLoginTab.click();
    ZynkAuth.setBannerSuccess(bannerError, "Account created successfully! Please log in with your credentials.");
  });
});
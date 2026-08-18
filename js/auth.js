import { supabase } from "./supabase.js";

const loginForm =
  document.getElementById("loginForm");

const loginMessage =
  document.getElementById("loginMessage");

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    loginMessage.textContent =
      "Signing in...";

    const email =
      document
        .getElementById("email")
        .value
        .trim();

    const password =
      document
        .getElementById("password")
        .value;

    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      loginMessage.textContent =
        error.message;

      return;
    }

    const user = data.user;

    const {
      data: profile,
      error: profileError
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);

      loginMessage.textContent =
        "Account profile failed to load.";

      return;
    }

    loginMessage.textContent =
      "Signed in successfully.";

    if (profile.role === "admin") {

      window.location.href =
        "https://limzl1128.github.io/LZL-STORE/html/admin.html";

    } else {

      window.location.href =
        "https://limzl1128.github.io/LZL-STORE/html/store.html";

    }

  }
);
import { supabase } from "./supabase.js";

const signupForm =
  document.getElementById("signupForm");

const signupMessage =
  document.getElementById("signupMessage");

signupForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    signupMessage.textContent =
      "Creating account...";

    const email =
      document
        .getElementById("signupEmail")
        .value
        .trim();

    const password =
      document
        .getElementById("signupPassword")
        .value;

    const confirmPassword =
      document
        .getElementById("confirmPassword")
        .value;

    if (password !== confirmPassword) {

      signupMessage.textContent =
        "Passwords do not match.";

      return;
    }

    const {
      data,
      error
    } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {

      signupMessage.textContent =
        error.message;

      return;
    }

    const user =
      data.user;

    if (!user) {

      signupMessage.textContent =
        "Account created. Check your email to confirm your account.";

      return;
    }

    const {
      error: profileError
    } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        role: "customer"
      });

    if (profileError) {

      console.error(profileError);

      signupMessage.textContent =
        "Account created, but profile setup failed.";

      return;
    }

    signupMessage.textContent =
      "Account created successfully.";

    setTimeout(() => {

      window.location.href =
        "./store.html";

    }, 800);

  }
);
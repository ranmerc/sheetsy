import { FormEventHandler, useEffect, useState } from "react";
import Styles from "./LoginForm.module.css";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { QueryState } from "@/typings/types";
import QueryStatus from "./QueryStatus/QueryStatus";

export default function LoginForm() {
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState<QueryState>("idle");
  const router = useRouter();
  const supabaseClient = useSupabaseClient();

  useEffect(() => {
    const event = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.push("/");
      }
    });

    return () => {
      event.data.subscription.unsubscribe();
    };
  }, [router, supabaseClient]);

  const handleSubmit: FormEventHandler = async (e) => {
    e.preventDefault();

    setStatus("sending");

    const { error } = await supabaseClient.auth.signInWithOtp({
      email: inputValue,
      options: {
        emailRedirectTo: "http://localhost:3000/login/",
      },
    });

    if (error) {
      setStatus("error");
    } else {
      setStatus("success");
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={Styles.container}>
        <div>
          <label htmlFor="login-email" className={Styles.label}>
            Enter email to get login link
          </label>
          <input
            id="login-email"
            type="email"
            required
            className={Styles.input}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
          />
          <QueryStatus status={status} />
        </div>
        <button
          type="submit"
          disabled={status !== "idle"}
          className={Styles.button}
        >
          {status !== "idle" ? "Sent" : "Login"}
        </button>
      </form>
    </>
  );
}

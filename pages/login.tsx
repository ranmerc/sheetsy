import Head from "next/head";
import LoginIcon from "@/components/LoginIcon/LoginIcon";
import LoginForm from "@/components/LoginForm/LoginForm";
import Styles from "@/styles/Login.module.css";

export default function Login() {
  return (
    <>
      <Head>
        <title>Login - sheetsy</title>
        <meta name="description" content="Login page for sheetsy" />
      </Head>
      <div className={Styles.layoutContainer}>
        <div className={Styles.container}>
          <LoginIcon />
          <LoginForm />
        </div>
      </div>
    </>
  );
}

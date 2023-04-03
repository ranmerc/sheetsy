import Head from "next/head";
import styles from "@/styles/Index.module.css";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSideProps } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Index() {
  const user = useUser();
  const supabaseClient = useSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    const event = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push("/login");
      }
    });

    return () => {
      event.data.subscription.unsubscribe();
    };
  }, [router, supabaseClient]);

  return (
    <>
      <Head>
        <title>Sheetsy</title>
        <meta name="description" content="Turn your Google Sheet into API✨" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      {user && <main>hello</main>}
      <button
        onClick={async () => {
          const { error } = await supabaseClient.auth.signOut();
        }}
      >
        signout
      </button>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const supabaseServerClient = createServerSupabaseClient(context);
  const { data, error } = await supabaseServerClient.auth.getUser();

  if (error) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return {
    props: { data },
  };
};

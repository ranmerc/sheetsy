import { QueryState } from "@/typings/types";
import Styles from "./QueryStatus.module.css";

export default function QueryStatus({ status }: { status: QueryState }) {
  if (status === "sending") {
    return (
      <div role="alert" className={Styles.sending}>
        Sending mail...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div role="alert" className={Styles.error}>
        Unable to send login link. Please try again later!
      </div>
    );
  }

  if (status === "success") {
    return (
      <div role="alert" className={Styles.success}>
        Check your email for login link!
      </div>
    );
  }

  return null;
}

import DatabaseIcon from "@/icons/DatabaseIcon";
import Style from "./Loginicon.module.css";

export default function LoginIcon() {
  return (
    <>
      <div className={Style.container}>
        <DatabaseIcon width={70} height={73.33} />
        <div className={Style.title}>sheetsy</div>
      </div>
    </>
  );
}

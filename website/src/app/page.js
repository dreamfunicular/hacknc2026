import RegistrationComponent from "@/components/RegistrationComponent";
import LoginComponent from "@/components/LoginComponent";

export default function Home() {
  return (
    <>
        <div className={"flex flex-row items-center justify-center gap-15"}>
            <RegistrationComponent />
            <LoginComponent />
        </div>

    </>
  );
}

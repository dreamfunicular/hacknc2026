import RegistrationComponent from "@/components/RegistrationComponent";
import LoginComponent from "@/components/LoginComponent";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-row items-center justify-center gap-15">
        <RegistrationComponent />
        <LoginComponent />
      </div>
    </main>
  );
}

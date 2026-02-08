import { redirect } from "next/navigation";

import { AuthForm } from "~/app/_components/auth-form";
import { getSession } from "~/server/better-auth/server";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center">
      <div className="container flex flex-col items-center gap-8 px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-6xl font-extrabold tracking-tight sm:text-[6rem]">
            Leafy <span className="text-primary">Log</span>
          </h1>
          <p className="text-muted-foreground max-w-lg text-xl">
            Track your nutrition with precision.
          </p>
        </div>
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}

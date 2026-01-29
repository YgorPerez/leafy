import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthForm } from "~/app/_components/auth-form";
import { Dashboard } from "~/app/_components/dashboard";
import { Button } from "~/components/ui/button";
import { calculateDRI, type UserProfile } from "~/lib/clinical-calculator";
import { auth } from "~/server/better-auth";
import { getSession } from "~/server/better-auth/server";
import { db } from "~/server/db";
import { user } from "~/server/db/schema";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getSession();
  let metrics = null;
  let dbUser = null;

  if (session?.user) {
    dbUser = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
    });

    if (
      dbUser?.sex &&
      dbUser?.weight &&
      dbUser?.height &&
      dbUser?.birthDate &&
      dbUser?.activityLevel
    ) {
      const age = new Date().getFullYear() - dbUser.birthDate.getFullYear();
      const profile: UserProfile = {
        sex: dbUser.sex as "male" | "female",
        age,
        weight: dbUser.weight,
        height: dbUser.height,
        activityLevel: dbUser.activityLevel as any,
      };
      metrics = calculateDRI(profile);
    }
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-start bg-background text-foreground">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="flex flex-col items-center gap-4 text-center">
            <h1 className="font-extrabold text-6xl tracking-tight sm:text-[6rem]">
              Leafy <span className="text-primary">Log</span>
            </h1>
            <p className="max-w-lg text-muted-foreground text-xl">
              Track your nutrition with precision.
            </p>
          </div>

          <Dashboard
            metrics={metrics}
            customGoals={dbUser?.goals ?? undefined}
            session={session}
          />

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-2xl">
                {session && <span>Logged in as {session.user?.name}</span>}
              </p>
              {!session ? (
                <div className="w-full max-w-md">
                  <AuthForm />
                </div>
              ) : (
                <form>
                  <Button
                    className="rounded-full px-10 py-6 font-semibold text-lg"
                    formAction={async () => {
                      "use server";
                      await auth.api.signOut({
                        headers: await headers(),
                      });
                      redirect("/");
                    }}
                    size="lg"
                    variant="outline"
                  >
                    Sign out
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}

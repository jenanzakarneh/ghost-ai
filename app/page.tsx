import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { isAuthenticated } = await auth();
  const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in";

  redirect(isAuthenticated ? "/editor" : signInUrl);
}

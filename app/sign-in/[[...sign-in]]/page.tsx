import { SignIn } from "@clerk/nextjs"
import { AuthShell } from "@/components/auth/auth-shell"

export default function SignInPage() {
  return (
    <AuthShell
      eyebrow="Enter the workspace"
      title="Design systems with more signal."
      description="Bring your architecture ideas into one shared workspace and make the next decision easier to see."
    >
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" fallbackRedirectUrl="/editor" />
    </AuthShell>
  )
}
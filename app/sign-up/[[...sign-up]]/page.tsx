import { SignUp } from "@clerk/nextjs"
import { AuthShell } from "@/components/auth/auth-shell"

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Start designing"
      title="Make the architecture visible."
      description="Create a workspace for exploring systems, collaborating on tradeoffs, and capturing the final shape."
    >
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" fallbackRedirectUrl="/editor" />
    </AuthShell>
  )
}
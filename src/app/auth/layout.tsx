// Force all /auth/* routes to be server-rendered so Vercel's @vercel/next
// builder creates lambdas for them (required because middleware matches all routes).
export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RootPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const { role } = session.user;

  if (role === "super_admin") redirect("/super-admin");
  if (role === "restaurant_owner" || role === "restaurant_manager") redirect("/admin");

  // Fallback — should never reach here with a valid session
  redirect("/auth/login");
}

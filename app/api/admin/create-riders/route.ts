import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";

const RIDERS = [
  { name: "Rider One", email: "rider1@rapidmart.in", password: "Rider@1234" },
  { name: "Rider Two", email: "rider2@rapidmart.in", password: "Rider@5678" },
];

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "admin";
  const hasKey  = searchParams.get("key") === "rapidmart-seed-2025";
  if (!isAdmin && !hasKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const results: { email: string; password: string; status: string }[] = [];

  for (const r of RIDERS) {
    const existing = await User.findOne({ email: r.email });
    if (existing) {
      results.push({ email: r.email, password: r.password, status: "already exists" });
      continue;
    }
    await User.create({
      name:         r.name,
      email:        r.email,
      passwordHash: r.password,   // pre-save hook hashes it
      role:         "rider",
      addresses:    [],
    });
    results.push({ email: r.email, password: r.password, status: "created" });
  }

  return NextResponse.json({ success: true, riders: results });
}

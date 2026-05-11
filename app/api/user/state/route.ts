import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import UserState from "@/models/UserState";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ cart: [], wishlist: [] });

  await connectDB();
  const state = await UserState.findOne({ userId: session.user.id }).lean() as
    { cart: unknown[]; wishlist: unknown[] } | null;

  return NextResponse.json({
    cart:     state?.cart     ?? [],
    wishlist: state?.wishlist ?? [],
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { cart, wishlist } = await req.json();

  await connectDB();
  await UserState.findOneAndUpdate(
    { userId: session.user.id },
    { $set: { cart, wishlist } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { publishSSE } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "rider" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const order = await Order.findOneAndUpdate(
    { _id: params.id, riderId: session.user.id, status: "out_for_delivery" },
    { $set: { status: "delivered" } },
    { new: true }
  ).lean();

  if (!order) {
    return NextResponse.json({ error: "Order not found or not yours" }, { status: 404 });
  }

  // Notify customer's tracking page
  publishSSE(`track:${params.id}`, { status: "delivered" });

  return NextResponse.json({ success: true });
}

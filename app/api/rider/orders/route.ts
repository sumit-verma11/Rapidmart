import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

async function requireRider() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "rider" && session.user.role !== "admin")) return null;
  return session;
}

// GET — available confirmed orders (no rider yet) + this rider's active order
export async function GET() {
  const session = await requireRider();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const [available, active] = await Promise.all([
    Order.find({ status: "confirmed", riderId: null })
      .sort({ placedAt: 1 })
      .select("orderNumber items deliveryAddress grandTotal placedAt estimatedDelivery")
      .lean(),
    Order.findOne({ status: "out_for_delivery", riderId: session.user.id })
      .select("orderNumber items deliveryAddress grandTotal placedAt estimatedDelivery deliveryPartner")
      .lean(),
  ]);

  return NextResponse.json({ success: true, available, active });
}

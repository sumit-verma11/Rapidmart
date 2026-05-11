import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "rider" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  // Check rider doesn't already have an active delivery
  const existing = await Order.findOne({ status: "out_for_delivery", riderId: session.user.id });
  if (existing) {
    return NextResponse.json({ error: "Complete your current delivery first" }, { status: 409 });
  }

  const rider = await User.findById(session.user.id).select("name phone").lean() as { name: string; phone?: string } | null;

  const order = await Order.findOneAndUpdate(
    { _id: params.id, status: "confirmed", riderId: null },
    {
      $set: {
        status:          "out_for_delivery",
        riderId:         session.user.id,
        "deliveryPartner.name":  rider?.name ?? session.user.name ?? "Rider",
        "deliveryPartner.phone": rider?.phone ?? "",
      },
    },
    { new: true }
  ).lean();

  if (!order) {
    return NextResponse.json({ error: "Order not available or already taken" }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: order });
}

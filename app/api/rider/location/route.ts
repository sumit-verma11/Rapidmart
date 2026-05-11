import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import { publishSSE } from "@/lib/sse";

export const dynamic = "force-dynamic";

// POST { orderId, lat, lng } — update rider location and broadcast to customer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "rider" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId, lat, lng } = await req.json();
  if (!orderId || lat == null || lng == null) {
    return NextResponse.json({ error: "orderId, lat and lng required" }, { status: 400 });
  }

  await connectDB();

  await Order.findOneAndUpdate(
    { _id: orderId, riderId: session.user.id, status: "out_for_delivery" },
    {
      $set: {
        "deliveryPartner.lat":       lat,
        "deliveryPartner.lng":       lng,
        "deliveryPartner.updatedAt": new Date(),
      },
    }
  );

  // Broadcast live to customer's SSE connection
  publishSSE(`track:${orderId}`, { lat, lng, ts: Date.now() });

  return NextResponse.json({ ok: true });
}

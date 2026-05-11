import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

// GET — tracking snapshot for customer (public by orderId)
export async function GET(_req: NextRequest, { params }: { params: { orderId: string } }) {
  await connectDB();

  const order = await Order.findById(params.orderId)
    .select("orderNumber status deliveryAddress deliveryPartner estimatedDelivery placedAt grandTotal items riderId")
    .populate("riderId", "name phone")
    .lean();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: order });
}

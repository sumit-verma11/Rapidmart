import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { IProductDocument } from "@/models";
import { generateOrderNumber, getDeliveryCharge } from "@/lib/utils";
import { sendOrderConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 10;

    const [orders, total] = await Promise.all([
      Order.find({ userId: session.user.id })
        .sort({ placedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId: session.user.id }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[ORDERS GET]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { items, deliveryAddress, estimatedDelivery } = await req.json();

    if (!items?.length || !deliveryAddress) {
      return NextResponse.json(
        { success: false, error: "Items and delivery address are required" },
        { status: 400 }
      );
    }

    const { street, city, state, pincode } = deliveryAddress;
    if (!street || !city || !state || !pincode) {
      return NextResponse.json(
        { success: false, error: "Complete delivery address is required" },
        { status: 400 }
      );
    }

    await connectDB();

    let totalMRP = 0;
    let grandTotalItems = 0;
    const orderItems = [];

    for (const item of items as { productId: string; variantSku: string; qty: number }[]) {
      const product = await Product.findById(item.productId) as IProductDocument | null;
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }
      if (!product.isAvailable || product.stockQty < item.qty) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      const variant = product.variants.find((v) => v.sku === item.variantSku.toUpperCase());
      if (!variant) {
        return NextResponse.json(
          { success: false, error: `Variant ${item.variantSku} not found for ${product.name}` },
          { status: 400 }
        );
      }

      totalMRP += variant.mrp * item.qty;
      grandTotalItems += variant.sellingPrice * item.qty;

      orderItems.push({
        productId: product._id,
        variantSku: variant.sku,
        name: product.name,
        qty: item.qty,
        price: variant.sellingPrice,
      });

      // Deduct stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stockQty: -item.qty },
      });
    }

    const deliveryCharge = getDeliveryCharge(grandTotalItems);
    const grandTotal = grandTotalItems + deliveryCharge;
    const totalDiscount = Math.max(0, totalMRP - grandTotalItems);

    const finalEstimate = estimatedDelivery ?? { minHours: 2, maxHours: 4 };

    const order = await Order.create({
      userId: session.user.id,
      orderNumber: generateOrderNumber(),
      items: orderItems,
      deliveryAddress: { street, city, state, pincode },
      billingType: "COD",
      status: "confirmed",
      estimatedDelivery: finalEstimate,
      totalMRP,
      totalDiscount,
      deliveryCharge,
      grandTotal,
    });

    // Send order confirmation email (non-blocking)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const user = await User.findById(session.user.id).select("email name").lean() as { email: string; name: string } | null;
      if (user?.email) {
        sendOrderConfirmation({
          to: user.email,
          customerName: user.name ?? session.user.name ?? "Customer",
          orderNumber: order.orderNumber,
          items: orderItems,
          deliveryAddress: { street, city, state, pincode },
          totalMRP,
          totalDiscount,
          deliveryCharge,
          grandTotal,
          estimatedDelivery: finalEstimate,
        }).catch((err) => console.error("[ORDER EMAIL]", err));
      }
    }

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error) {
    console.error("[ORDERS POST]", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

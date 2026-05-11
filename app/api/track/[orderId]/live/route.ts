import { NextRequest } from "next/server";
import { sseEmitter, SSE_HEADERS, sseConnect, sseDisconnect } from "@/lib/sse";

export const dynamic = "force-dynamic";

// SSE — streams live rider location to the customer's tracking page
export async function GET(_req: NextRequest, { params }: { params: { orderId: string } }) {
  const channel = `track:${params.orderId}`;

  const stream = new ReadableStream({
    start(controller) {
      sseConnect();

      const send = (data: object) => {
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
        } catch {
          // client disconnected
        }
      };

      // Send initial ping so the client knows the stream is open
      send({ type: "connected" });

      sseEmitter.on(channel, send);

      // Clean up when client disconnects
      _req.signal.addEventListener("abort", () => {
        sseEmitter.off(channel, send);
        sseDisconnect();
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

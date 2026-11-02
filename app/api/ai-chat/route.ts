// Lokasi: app/api/ai-chat/route.ts
import { NextResponse } from "next/server";
import { askSiMantapAI } from "@/lib/ai/textToSql";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    // Mengambil pesan terakhir yang diketik oleh user di widget chat
    const lastMessage = messages[messages.length - 1]?.content;

    if (!lastMessage) {
      return NextResponse.json({ reply: "Pertanyaan tidak boleh kosong." }, { status: 400 });
    }

    // Menjalankan proses Text-to-SQL (Few-Shot + RAG)
    const hasil = await askSiMantapAI(lastMessage);

    // Mengembalikan properti 'reply', 'sql', dan 'pageLink' sesuai yang diminta oleh ai-chat-widget.tsx
    return NextResponse.json({
      reply: hasil.reply,
      sql: hasil.sql, // Berguna untuk kamu catat saat pengujian Bab 4 Skripsi!
      pageLink: hasil.pageLink || null,
    });
  } catch (error: any) {
    console.error("Error AI Text-to-SQL:", error.message);
    return NextResponse.json(
      {
        reply: `Maaf, sistem mengalami kendala teknis saat memproses data,silakan tanyakan dengan lebih detail`,
      },
      { status: 500 }
    );
  }
}
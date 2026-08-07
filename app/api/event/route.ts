import { NextResponse } from "next/server";
import { trackServer } from "@/lib/amplitude/server";

export async function POST() {
  await trackServer("server_action");
  return NextResponse.json({ ok: true });
}

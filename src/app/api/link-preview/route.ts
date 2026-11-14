import { NextResponse, type NextRequest } from "next/server";
import { getLinkPreview, LinkPreviewError } from "@/lib/link-preview/fetch";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/link-preview?url=...
 * Returns a LinkPreview for the composer. Signed-in users only, so this
 * cannot be used as an open proxy.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return NextResponse.json({ error: "Sign in to preview links." }, { status: 401 });
  }

  const input = request.nextUrl.searchParams.get("url") ?? "";
  if (!input || input.length > 2048) {
    return NextResponse.json({ error: "Paste a link to preview." }, { status: 400 });
  }

  try {
    const preview = await getLinkPreview(input);
    return NextResponse.json(preview, {
      headers: { "cache-control": "private, max-age=300" },
    });
  } catch (error) {
    if (error instanceof LinkPreviewError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("link-preview failed:", error);
    return NextResponse.json(
      { error: "We couldn't load a preview for that link." },
      { status: 502 },
    );
  }
}

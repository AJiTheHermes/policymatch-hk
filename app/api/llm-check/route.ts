/** Verifies an OpenAI-compatible endpoint from the server, so the browser never
 *  has to deal with CORS. Returns a boolean; the key is never echoed back. */
export async function POST(req: Request) {
  const { base, key, model } = (await req.json().catch(() => ({}))) as {
    base?: string;
    key?: string;
    model?: string;
  };
  if (!base || !key) return Response.json({ ok: false, reason: "missing" }, { status: 400 });

  try {
    const url = `${base.replace(/\/+$/, "")}/models`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return Response.json({ ok: false, status: r.status }, { status: 200 });

    const j: any = await r.json().catch(() => ({}));
    const ids: string[] = Array.isArray(j?.data) ? j.data.map((m: any) => m.id).slice(0, 40) : [];
    const hasModel = model ? ids.includes(model) : true;
    return Response.json({ ok: true, modelKnown: hasModel, models: ids.slice(0, 10) });
  } catch {
    return Response.json({ ok: false, reason: "unreachable" }, { status: 200 });
  }
}

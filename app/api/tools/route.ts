import { getCurrentTime, findElderlyCentres, getAeWaiting, getWeather, policySearch, webSearch } from "@/lib/tools-server";
import { RAG_DEFAULT, type RagConfig, type ToolId } from "@/lib/registry";

/** One endpoint for the tools the transcript can show. Demo mode calls this so a
 *  keyless laptop still performs real time lookups and real (optional) searches. */
export async function POST(req: Request) {
  const { name, input, rag, webKey } = (await req.json().catch(() => ({}))) as {
    name?: ToolId;
    input?: Record<string, unknown>;
    rag?: RagConfig;
    webKey?: string;
  };
  const started = Date.now();

  try {
    let output: unknown;
    switch (name) {
      case "getCurrentTime":
        output = getCurrentTime();
        break;
      case "searchPolicy": {
        const q = String(input?.query ?? "");
        output = policySearch(q, rag ?? RAG_DEFAULT);
        break;
      }
      case "webSearch": {
        const q = String(input?.query ?? "");
        output = await webSearch(q, webKey);
        if (!(output as { enabled: boolean }).enabled) {
          return Response.json({ ok: false, reason: "disabled", ms: Date.now() - started }, { status: 200 });
        }
        break;
      }
      case "findElderlyCentres":
        output = await findElderlyCentres(String(input?.district ?? "").trim() || undefined);
        break;
      case "getAeWaiting":
        output = await getAeWaiting();
        break;
      case "getWeatherStatus":
        output = await getWeather();
        break;
      default:
        return Response.json({ ok: false, reason: "unknown-tool" }, { status: 400 });
    }
    return Response.json({ ok: true, output, ms: Date.now() - started });
  } catch (e) {
    return Response.json({ ok: false, reason: "failed", message: String(e), ms: Date.now() - started }, { status: 200 });
  }
}

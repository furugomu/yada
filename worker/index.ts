export interface Env {
  YADA_KV: KVNamespace;
}

interface StatsResponse {
  totalCount: number;
  userCount: number;
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function handleStats(env: Env): Promise<Response> {
  const [totalStr, userStr] = await Promise.all([
    env.YADA_KV.get("total_count"),
    env.YADA_KV.get("user_count"),
  ]);
  const stats: StatsResponse = {
    totalCount: totalStr ? parseInt(totalStr, 10) : 0,
    userCount: userStr ? parseInt(userStr, 10) : 0,
  };
  return jsonResponse(stats);
}

async function handleYada(request: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "invalid json" }, 400);
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>)["userId"] !== "string" ||
    typeof (body as Record<string, unknown>)["count"] !== "number"
  ) {
    return jsonResponse({ error: "invalid request" }, 400);
  }

  const { userId, count } = body as { userId: string; count: number };

  if (!userId || count <= 0 || !Number.isInteger(count) || count > 1000) {
    return jsonResponse({ error: "invalid request" }, 400);
  }

  const [totalStr, userStr, seenStr] = await Promise.all([
    env.YADA_KV.get("total_count"),
    env.YADA_KV.get("user_count"),
    env.YADA_KV.get(`user:${userId}:seen`),
  ]);

  const currentTotal = totalStr ? parseInt(totalStr, 10) : 0;
  const currentUsers = userStr ? parseInt(userStr, 10) : 0;
  const isNewUser = seenStr === null;

  const newTotal = currentTotal + count;
  const newUsers = isNewUser ? currentUsers + 1 : currentUsers;

  const puts: Promise<void>[] = [env.YADA_KV.put("total_count", String(newTotal))];
  if (isNewUser) {
    puts.push(env.YADA_KV.put("user_count", String(newUsers)));
    puts.push(env.YADA_KV.put(`user:${userId}:seen`, "1"));
  }
  await Promise.all(puts);

  const stats: StatsResponse = { totalCount: newTotal, userCount: newUsers };
  return jsonResponse(stats);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (url.pathname === "/api/stats" && request.method === "GET") {
      return handleStats(env);
    }
    if (url.pathname === "/api/yada" && request.method === "POST") {
      return handleYada(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

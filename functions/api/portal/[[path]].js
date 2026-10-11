const ORIGEM = "https://app.fazendasup.com.br";

export async function onRequest(context) {
  const entrada = new URL(context.request.url);
  const destino = new URL(`${entrada.pathname}${entrada.search}`, ORIGEM);
  const headers = new Headers(context.request.headers);
  headers.delete("host");

  const method = context.request.method;
  const comCorpo = method !== "GET" && method !== "HEAD";
  const resposta = await fetch(destino, {
    method,
    headers,
    body: comCorpo ? context.request.body : undefined,
    redirect: "manual",
  });

  const saida = new Headers(resposta.headers);
  const cookies =
    typeof resposta.headers.getSetCookie === "function" ? resposta.headers.getSetCookie() : [];
  if (cookies.length > 0) {
    saida.delete("set-cookie");
    for (const cookie of cookies) saida.append("set-cookie", cookie);
  }

  return new Response(resposta.body, {
    status: resposta.status,
    statusText: resposta.statusText,
    headers: saida,
  });
}

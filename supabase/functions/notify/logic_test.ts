import { assertEquals } from "jsr:@std/assert@1";
import { buildMessages, deadTokens, parsePayload } from "./logic.ts";

Deno.test("un mensaje por token, con la url en data para abrir la pantalla", () => {
  assertEquals(
    buildMessages(["ExponentPushToken[a]", "ExponentPushToken[b]"], {
      title: "Tu semana está lista", body: "Semana 42", url: "tritrack://semana",
    }),
    [
      { to: "ExponentPushToken[a]", title: "Tu semana está lista", body: "Semana 42", sound: "default", data: { url: "tritrack://semana" } },
      { to: "ExponentPushToken[b]", title: "Tu semana está lista", body: "Semana 42", sound: "default", data: { url: "tritrack://semana" } },
    ],
  );
});

Deno.test("sin url, data va vacío", () => {
  assertEquals(buildMessages(["t"], { title: "x", body: "y" })[0].data, {});
});

Deno.test("DeviceNotRegistered → ese token se borra; otros errores no", () => {
  const tokens = ["t1", "t2", "t3"];
  const tickets = [
    { status: "ok", id: "abc" },
    { status: "error", message: "not registered", details: { error: "DeviceNotRegistered" } },
    { status: "error", message: "too big", details: { error: "MessageTooBig" } },
  ];
  assertEquals(deadTokens(tokens, tickets), ["t2"]);
});

Deno.test("respuesta rara de Expo → no borra nada", () => {
  assertEquals(deadTokens(["t1"], undefined), []);
  assertEquals(deadTokens(["t1"], []), []);
});

Deno.test("payload: title y body obligatorios, url opcional y solo tritrack://", () => {
  assertEquals(parsePayload({ title: "a", body: "b" }), { title: "a", body: "b" });
  assertEquals(parsePayload({ title: "a", body: "b", url: "tritrack://hoy" }), { title: "a", body: "b", url: "tritrack://hoy" });
  assertEquals(parsePayload({ title: "a", body: "b", url: "https://evil.example" }), { title: "a", body: "b" });
  assertEquals(parsePayload({ title: "a" }), null);
  assertEquals(parsePayload({ title: "", body: "b" }), null);
  assertEquals(parsePayload(null), null);
});

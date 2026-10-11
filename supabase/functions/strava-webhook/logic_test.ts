import { assertEquals } from "jsr:@std/assert@1";
import { checkinNotification, expectedVerifyToken, parseEvent, verifyChallenge } from "./logic.ts";

Deno.test("verify token: el secreto explícito manda; si no, se deriva de NOTIFY_SECRET", async () => {
  assertEquals(await expectedVerifyToken({ STRAVA_VERIFY_TOKEN: "abc", NOTIFY_SECRET: "x" }), "abc");
  const derived = await expectedVerifyToken({ NOTIFY_SECRET: "x" });
  assertEquals(derived?.length, 32);
  assertEquals(derived, await expectedVerifyToken({ NOTIFY_SECRET: "x" }));
  assertEquals(await expectedVerifyToken({}), null);
});

Deno.test("GET de verificación", () => {
  const ok = new URLSearchParams({ "hub.mode": "subscribe", "hub.verify_token": "t", "hub.challenge": "c1" });
  assertEquals(verifyChallenge(ok, "t"), "c1");
  assertEquals(verifyChallenge(ok, "otro"), null);
  assertEquals(verifyChallenge(ok, null), null);
  assertEquals(verifyChallenge(new URLSearchParams({ "hub.verify_token": "t", "hub.challenge": "c" }), "t"), null);
});

Deno.test("solo activity/create", () => {
  assertEquals(parseEvent({ object_type: "activity", aspect_type: "create", object_id: 99, owner_id: 7 }),
    { activityId: "99", athleteId: 7 });
  assertEquals(parseEvent({ object_type: "activity", aspect_type: "update", object_id: 99, owner_id: 7 }), null);
  assertEquals(parseEvent({ object_type: "athlete", aspect_type: "update", object_id: 7, owner_id: 7 }), null);
  assertEquals(parseEvent(null), null);
});

Deno.test("notificación con sesión, sin sesión y sin nombre", () => {
  assertEquals(checkinNotification({ id: "u-1", title: "Fondo Z2" }, { external_id: "5", name: "Morning Run" }),
    { title: "¿Cómo te fue en Fondo Z2?", body: "Contame en tres toques.", url: "tritrack://checkin?session=u-1" });
  assertEquals(checkinNotification(null, { external_id: "5", name: "Morning Run" }).url, "tritrack://checkin?activity=5");
  assertEquals(checkinNotification({ id: "u", title: null }, { external_id: "5", name: "Vuelta" }).title, "¿Cómo te fue en Vuelta?");
  assertEquals(checkinNotification(null, { external_id: "5", name: null }).title, "¿Cómo te fue en tu entrenamiento?");
});

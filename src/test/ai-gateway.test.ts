import { afterEach, describe, expect, it, vi } from "vitest";
import { streamResponse } from "@/lib/ai-gateway.server";

describe("Gemini model failover", () => {
  const originalKey = process.env["GEMINI_API_KEY"];
  const originalGoogleKey = process.env["GOOGLE_API_KEY"];
  const originalLovableKey = process.env["LOVABLE_API_KEY"];
  const originalModel = process.env["GEMINI_MODEL"];

  afterEach(() => {
    if (originalKey === undefined) delete process.env["GEMINI_API_KEY"];
    else process.env["GEMINI_API_KEY"] = originalKey;
    if (originalGoogleKey === undefined) delete process.env["GOOGLE_API_KEY"];
    else process.env["GOOGLE_API_KEY"] = originalGoogleKey;
    if (originalLovableKey === undefined) delete process.env["LOVABLE_API_KEY"];
    else process.env["LOVABLE_API_KEY"] = originalLovableKey;
    if (originalModel === undefined) delete process.env["GEMINI_MODEL"];
    else process.env["GEMINI_MODEL"] = originalModel;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("ignores a legacy model setting and starts with the current Flash-Lite model", async () => {
    process.env["GEMINI_API_KEY"] = "test-key-not-real";
    process.env["GEMINI_MODEL"] = "gemini-2.5-flash";
    delete process.env["GOOGLE_API_KEY"];
    delete process.env["LOVABLE_API_KEY"];

    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Ready." }] } }] }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await streamResponse({ input: [{ role: "user", content: "Hi" }] }, "test");

    expect(result).toEqual({ ok: true, answer: "Ready." });
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("gemini-3.5-flash-lite");
    expect(String(fetchMock.mock.calls[0]?.[0])).not.toContain("gemini-2.5-flash");
  });

  it("tries a fallback model after Gemini returns 503 and uses its answer", async () => {
    process.env["GEMINI_API_KEY"] = "test-key-not-real";
    process.env["GEMINI_MODEL"] = "gemini-3.5-flash-lite";
    delete process.env["GOOGLE_API_KEY"];
    delete process.env["LOVABLE_API_KEY"];

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { status: "UNAVAILABLE" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Hello from fallback." }] } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "info").mockImplementation(() => undefined);

    const result = await streamResponse({ input: [{ role: "user", content: "Hi" }] }, "test");

    expect(result).toEqual({ ok: true, answer: "Hello from fallback." });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("gemini-3.5-flash-lite");
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("gemini-3.8-flash");
  });
});

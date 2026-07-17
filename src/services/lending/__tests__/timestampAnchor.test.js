import { describe, it, expect, vi, afterEach } from "vitest";
import { submitTimestampAnchor } from "../timestampAnchor.js";

const VALID_HASH = "a".repeat(64);

describe("submitTimestampAnchor", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects a hash that isn't a 64-char hex digest", async () => {
    await expect(submitTimestampAnchor("not-a-hash")).rejects.toThrow(/SHA-256/);
    await expect(submitTimestampAnchor("")).rejects.toThrow(/SHA-256/);
    await expect(submitTimestampAnchor("a".repeat(63))).rejects.toThrow(/SHA-256/);
  });

  it("posts the raw 32-byte digest to the calendar server and base64-encodes the response", async () => {
    const responseBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => responseBytes.buffer,
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await submitTimestampAnchor(VALID_HASH);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/^https:\/\//);
    expect(options.method).toBe("POST");
    expect(new Uint8Array(options.body)).toEqual(new Uint8Array(32).fill(0xaa));
    expect(result.proof).toBe(btoa(String.fromCharCode(...responseBytes)));
    expect(result.calendarUrl).toMatch(/^https:\/\//);
    expect(typeof result.submittedAt).toBe("number");
  });

  it("throws when the calendar server responds with a non-OK status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, arrayBuffer: async () => new ArrayBuffer(0) }),
    );
    await expect(submitTimestampAnchor(VALID_HASH)).rejects.toThrow(/503/);
  });

  it("throws when the calendar server responds with an empty body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(0) }),
    );
    await expect(submitTimestampAnchor(VALID_HASH)).rejects.toThrow(/empty/);
  });
});

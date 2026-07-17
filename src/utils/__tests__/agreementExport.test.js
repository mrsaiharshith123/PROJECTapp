import { describe, it, expect } from "vitest";
import { hashText, sealAgreement, verifyAgreement, generateLegalAgreementHtml } from "../agreementExport.js";

describe("hashText", () => {
  it("produces a stable 64-char SHA-256 hex digest for the same text", async () => {
    const a = await hashText("hello agreement");
    const b = await hashText("hello agreement");
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces a different digest when the text changes by even one character", async () => {
    const a = await hashText("Principal: 50000");
    const b = await hashText("Principal: 50001");
    expect(a).not.toBe(b);
  });
});

describe("sealAgreement / verifyAgreement", () => {
  it("seals a lending's agreement text and verifies against the resulting hash", async () => {
    const lending = { agreementText: "PROMISSORY NOTE\nPrincipal: 100000" };
    const { text, hash, sealedAt } = await sealAgreement(lending);
    expect(text).toBe(lending.agreementText);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(sealedAt).toBeTruthy();
    await expect(verifyAgreement(text, hash)).resolves.toBe(true);
  });

  it("fails verification if the text is altered after sealing", async () => {
    const lending = { agreementText: "PROMISSORY NOTE\nPrincipal: 100000" };
    const { hash } = await sealAgreement(lending);
    const tampered = "PROMISSORY NOTE\nPrincipal: 900000";
    await expect(verifyAgreement(tampered, hash)).resolves.toBe(false);
  });

  it("falls back to building promissory note text when agreementText is empty", async () => {
    const lending = {
      type: "lent",
      personName: "Ravi",
      totalAmount: 20000,
      principalAmount: 20000,
    };
    const { text, hash } = await sealAgreement(lending, { displayName: "Me" });
    expect(text).toContain("PROMISSORY NOTE");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("generateLegalAgreementHtml", () => {
  const lending = {
    id: "lend_abc123",
    type: "lent",
    personName: "Ravi",
    totalAmount: 20000,
    principalAmount: 20000,
    agreementCity: "Hyderabad",
  };

  it("reserves a stamp-paper space and never claims to be real stamp paper", () => {
    const html = generateLegalAgreementHtml(lending, { displayName: "Me" });
    expect(html).toContain("Space reserved for stamp paper");
    expect(html).toContain("Do not substitute this box for real stamp paper");
  });

  it("numbers each clause via CSS counters on a stable document reference", () => {
    const html = generateLegalAgreementHtml(lending, { displayName: "Me" });
    expect(html).toContain("Ref: PEROVO-LENDABC1");
    expect(html).toContain("counter-increment: clause");
    expect((html.match(/class="clause"/g) || []).length).toBeGreaterThan(3);
  });

  it("shows the sealed hash banner once the agreement has been sealed", () => {
    const sealedHtml = generateLegalAgreementHtml(
      { ...lending, agreementHash: "a".repeat(64), agreementSealedAt: "2026-01-01T00:00:00.000Z" },
      { displayName: "Me" },
    );
    expect(sealedHtml).toContain("Integrity seal (SHA-256)");
    const unsealedHtml = generateLegalAgreementHtml(lending, { displayName: "Me" });
    expect(unsealedHtml).not.toContain("Integrity seal");
  });

  it("escapes untrusted fields so they can't break out of the HTML", () => {
    const html = generateLegalAgreementHtml(
      { ...lending, personName: "<script>alert(1)</script>" },
      { displayName: "Me" },
    );
    expect(html).not.toContain("<script>alert(1)</script>");
  });
});

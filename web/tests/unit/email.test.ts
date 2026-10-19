import { describe, expect, it } from "vitest";

import { type Digest, escape, renderHtml, renderText } from "@/lib/email/digest";

const digest: Digest = {
  subject: "Weekly · Crypto markets · week to 16 Oct 2026",
  preheader: "Bitcoin +3.0% and ether −1.2% over the week.",
  eyebrow: "Weekly update · Free plan",
  heading: "Crypto markets: the week to 16 Oct 2026",
  sections: [
    { title: "Long averages", lines: [{ label: "Price against the 200-week average", value: "+11.20%", note: "200-week average $63,800.00", tone: "up" }] },
    { title: "Furthest <from> the high", table: { head: ["Asset", "7 days"], rows: [{ cells: ["Ether", "−12.0%"], tone: "down" }] } },
    { title: "Unusual", locked: { text: "Part of Plus.", cta: "See the plans", href: "/plans", model: "crypto_cycle" } },
    { title: "Empty", table: { head: ["A"], rows: [] }, empty: "Nothing this week." },
  ],
  disclaimers: ["Information only."],
  footer: ["You asked for this."],
  unsubscribe: { label: "Stop these e-mails", href: "https://example.org/u?t=a&b" },
};

describe("weekly e-mail", () => {
  it("escapes everything it prints", () => {
    expect(escape(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
    const html = renderHtml(digest);
    expect(html).toContain("Furthest &lt;from&gt; the high");
    expect(html).not.toContain("<from>");
    expect(html).toContain('href="https://example.org/u?t=a&amp;b"');
    expect(html).toContain('data-locked="crypto_cycle"');
  });

  it("shows each kind of section, with no scripts or external styles", () => {
    const html = renderHtml(digest);
    for (const s of ["+11.20%", "200-week average $63,800.00", "Ether", "Part of Plus.", "Nothing this week.", "Information only.", "Stop these e-mails"]) {
      expect(html).toContain(s);
    }
    expect(html).not.toMatch(/<script|<link|<style/);
    expect(html).toContain("max-width:600px");
  });

  it("has a plain-text body with the same content", () => {
    const text = renderText(digest);
    expect(text).toContain("Price against the 200-week average: +11.20% (200-week average $63,800.00)");
    expect(text).toContain("Ether | −12.0%");
    expect(text).toContain("Part of Plus. See the plans: /plans");
    expect(text).toContain("Nothing this week.");
    expect(text).toContain("Stop these e-mails: https://example.org/u?t=a&b");
  });
});

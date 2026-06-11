import test from "node:test";
import assert from "node:assert/strict";

import {
  getStaticPageViewModel,
  listPublicFooterLinks,
  listStaticPages,
} from "./static-pages.mjs";

test("static legal page registry covers required routes", () => {
  assert.deepEqual(
    listStaticPages().map((page) => page.slug),
    ["privacy", "terms", "imprint", "contact", "data-access"],
  );

  for (const slug of ["privacy", "terms", "imprint", "contact"]) {
    const page = getStaticPageViewModel(slug);
    assert.ok(page, `missing ${slug}`);
    assert.equal(page.legalReviewRequired, true);
    assert.match(page.eyebrow, /Legal review required|pending|placeholder/i);
  }
});

test("public footer exposes all static page links without workflow dependencies", () => {
  assert.deepEqual(
    listPublicFooterLinks().map((link) => link.href),
    ["/privacy", "/terms", "/imprint", "/contact", "/data-access"],
  );
});

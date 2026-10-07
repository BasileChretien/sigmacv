import type { Metadata } from "next";
import NotFound from "@/components/NotFound";
import { NOT_FOUND_DOCUMENT_TITLE } from "@/lib/i18n/notFound";

/**
 * The 404 page: for an address no route answers, and for every `notFound()`.
 *
 * Next builds the `/_not-found` route from this file and answers most unknown
 * paths with it. Left to itself it prerenders that route. The proxy cannot know
 * that a path will be a 404, so it sends the nonce policy, and a file built once
 * carries no nonce: the browser refused every script of the page, analytics
 * included (`src/lib/security/csp.ts`). Hence `force-dynamic`: the 404 is
 * rendered per request, and its scripts get the nonce. This file is that
 * route's PAGE, which is the only place its route config is read.
 * `e2e/production/csp.spec.ts` fails if a build prerenders the 404 again.
 *
 * Two things this file must not do, because Next also renders it into the tree
 * of EVERY page, as the boundary shown when that page calls `notFound()`:
 *  - read the request (`headers()`, `cookies()`, `connection()`). Every
 *    prerendered page would become dynamic: all 460 of them did, when this was
 *    tried. The language is therefore chosen in the client component, from the
 *    address.
 *  - render much. Whatever it outputs travels with every page.
 */
export const dynamic = "force-dynamic";

// Next marks a 404 `noindex` itself.
export const metadata: Metadata = { title: { absolute: NOT_FOUND_DOCUMENT_TITLE } };

export default function NotFoundPage() {
  return <NotFound />;
}

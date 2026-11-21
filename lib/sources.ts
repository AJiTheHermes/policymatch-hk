/** Official sources. Nothing is bundled: every citation opens the government's
 *  own PDF at the cited page, so the page number can be checked by anyone.
 *  Override with NEXT_PUBLIC_POLICY_PDF_URL if the address changes. */
export const POLICY_PDF_URL =
  process.env.NEXT_PUBLIC_POLICY_PDF_URL ||
  "https://www.policyaddress.gov.hk/2026/public/pdf/supplement/supplement-full_tc.pdf";

export const POLICY_PORTAL_URL = "https://www.policyaddress.gov.hk/2026/tc/supplement.html";

/** Physical PDF page = printed page + this offset (verified against the file). */
export const PDF_PAGE_OFFSET = 12;

export function pdfPageUrl(printedPage: number): string {
  return `${POLICY_PDF_URL}#page=${printedPage + PDF_PAGE_OFFSET}`;
}

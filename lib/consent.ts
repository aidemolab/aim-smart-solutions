// Wording of the urgent-call consent checkbox. The submit-enquiry function keeps
// its own copy by version and stores that copy, so the two must match exactly
// (tests/static-export.test.mjs checks). To change the wording, add a new version
// in supabase/functions/submit-enquiry/index.ts and update both values here.
export const CALL_CONSENT_VERSION = "2026-10-22";
export const CALL_CONSENT_TEXT =
  "I agree to receive one automated phone call from the AIM Smart Solutions AI assistant to the mobile number above about this enquiry.";

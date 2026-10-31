import { withBase } from "@/lib/base-path";
import NewTabLink from "./NewTabLink";

// Short privacy line shown under every form. The link opens in a new tab so a visitor
// never loses what they have typed.
export default function PrivacyNote({ text = "We use your details only to respond to this request." }: { text?: string }) {
  return (
    <p className="privacy-note">
      {text} See our <NewTabLink href={withBase("/privacy/")} className="form-link">privacy policy</NewTabLink>.
    </p>
  );
}

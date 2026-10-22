import Link from "next/link";

// Short privacy line shown under every form.
export default function PrivacyNote({ text = "We use your details only to respond to this request." }: { text?: string }) {
  return (
    <p className="privacy-note">
      {text} See our <Link href="/privacy/">privacy policy</Link>.
    </p>
  );
}

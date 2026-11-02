import type { FieldErrors } from "@/lib/form-errors";

// The message under a field that needs fixing. Its id matches fieldProps() in lib/form-errors.ts.
export default function FieldError({ name, errors }: { name: string; errors: FieldErrors }) {
  if (!errors[name]) return null;
  return <p className="field-error" id={`${name}-error`}>{errors[name]}</p>;
}

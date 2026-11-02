// Field-by-field form checks with plain messages, used instead of the browser's
// "Please fill out this field." The forms set noValidate and call checkFields on submit.
import { toUkE164 } from "./supabase-functions";

export type FieldErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const EMAIL_INVALID = "Enter an email address like name@business.co.uk.";
export const MOBILE_INVALID = "Enter a UK mobile number beginning 07 or +44 7.";

type Rule = { name: string; empty: string; kind?: "email" | "mobile" };

// Returns a message for each field that is empty or in the wrong format.
export function checkFields(values: Record<string, unknown>, rules: Rule[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const rule of rules) {
    const value = String(values[rule.name] ?? "").trim();
    if (!value) errors[rule.name] = rule.empty;
    else if (rule.kind === "email" && !EMAIL.test(value)) errors[rule.name] = EMAIL_INVALID;
    else if (rule.kind === "mobile" && !toUkE164(value)) errors[rule.name] = MOBILE_INVALID;
  }
  return errors;
}

// Moves keyboard focus to the first field with a problem, in page order.
export function focusFirstError(form: HTMLFormElement | null, errors: FieldErrors) {
  if (!form) return;
  const first = Array.from(form.querySelectorAll<HTMLElement>("[data-field]")).find((el) => errors[el.dataset.field ?? ""]);
  first?.focus();
}

// Props for an input: marks it invalid and links it to its error message.
export function fieldProps(name: string, errors: FieldErrors, describedBy?: string) {
  const errorId = `${name}-error`;
  const ids = [errors[name] ? errorId : "", describedBy ?? ""].filter(Boolean).join(" ");
  return { "data-field": name, "aria-invalid": errors[name] ? true : undefined, "aria-describedby": ids || undefined };
}

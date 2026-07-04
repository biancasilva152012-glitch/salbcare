import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listPatients from "./tools/list-patients";
import listAppointments from "./tools/list-appointments";
import financialSummary from "./tools/financial-summary";

// The OAuth issuer MUST be the direct Supabase host (not the .lovable.cloud
// proxy). Build it from the project ref, which Vite inlines at build time so
// this module stays import-safe.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "salbcare-mcp",
  title: "SALBCARE",
  version: "0.1.0",
  instructions:
    "Tools for SALBCARE health professionals: read patients, appointments, and financial summaries scoped to the signed-in user via Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listPatients, listAppointments, financialSummary],
});

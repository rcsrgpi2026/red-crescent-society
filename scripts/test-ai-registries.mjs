/**
 * Automated Verification Script for Phase 1: RCY AI Assistant Registries
 */
import assert from "node:assert";
import {
  getAllRegisteredRoutes,
  findRouteByPath,
  isRegisteredRoute,
  matchRouteByQuery,
} from "../lib/ai/registries/route-registry.ts";
import {
  getAllRegisteredForms,
  findFormByRouteOrId,
  matchFormByQuery,
} from "../lib/ai/registries/form-registry.ts";

console.log("--- Starting AI Registries Verification ---");

// 1. Route Registry Tests
const routes = getAllRegisteredRoutes();
assert(routes.length >= 15, `Expected at least 15 registered routes, found ${routes.length}`);
console.log(`✓ Route Registry loaded ${routes.length} verified routes`);

// Exact path match
const bloodRequestRoute = findRouteByPath("/blood-support/request");
assert(bloodRequestRoute, "Should find /blood-support/request");
assert.strictEqual(bloodRequestRoute.id, "blood-request");
console.log("✓ findRouteByPath matched /blood-support/request successfully");

// Allowlist validation
assert(isRegisteredRoute("/"), "Home should be allowed");
assert(isRegisteredRoute("/blood-support"), "Blood support should be allowed");
assert(isRegisteredRoute("/blood-support/request"), "Blood request should be allowed");
assert(isRegisteredRoute("/blood-support/request/abc-123"), "Dynamic request ID should be allowed");
assert(isRegisteredRoute("/notices/annual-meetup-2026"), "Dynamic notice slug should be allowed");

// Security rejection tests (Anti-hallucination / injection)
assert(!isRegisteredRoute("https://malicious-site.example"), "External URL must be rejected");
assert(!isRegisteredRoute("/admin/secret-passwords"), "Non-public / admin path must be rejected");
assert(!isRegisteredRoute("/fake-route-from-ai"), "Hallucinated path must be rejected");
assert(!isRegisteredRoute("javascript:alert(1)"), "XSS URI must be rejected");
console.log("✓ Route allowlist validation passed all security & rejection tests");

// Natural language query matching
const q1 = matchRouteByQuery("রক্তের আবেদন কোথায় করব?");
assert(q1 && q1.path === "/blood-support/request", `Expected /blood-support/request, got ${q1?.path}`);
console.log("✓ matchRouteByQuery correctly routed 'রক্তের আবেদন কোথায় করব?' -> /blood-support/request");

const q2 = matchRouteByQuery("Volunteer হতে চাই, ফরম কোথায়?");
assert(q2 && q2.path === "/apply-volunteer", `Expected /apply-volunteer, got ${q2?.path}`);
console.log("✓ matchRouteByQuery correctly routed 'Volunteer হতে চাই' -> /apply-volunteer");

const q3 = matchRouteByQuery("জরুরি হটলাইন নম্বর কত?");
assert(q3 && q3.path === "/emergency", `Expected /emergency, got ${q3?.path}`);
console.log("✓ matchRouteByQuery correctly routed 'জরুরি হটলাইন' -> /emergency");

// 2. Form Registry Tests
const forms = getAllRegisteredForms();
assert(forms.length >= 3, `Expected at least 3 registered forms, found ${forms.length}`);
console.log(`✓ Form Registry loaded ${forms.length} verified forms`);

const bloodForm = findFormByRouteOrId("blood-request-form");
assert(bloodForm, "Should find blood-request-form");
assert(bloodForm.fields.some((f) => f.name === "patientName"), "Must have patientName");
assert(bloodForm.fields.some((f) => f.name === "bloodGroup"), "Must have bloodGroup");
assert(bloodForm.fields.some((f) => f.name === "contact"), "Must have contact");
console.log("✓ Blood Request Form field definitions verified");

const formMatch = matchFormByQuery("রক্তের আবেদন ফর্ম পূরণ করার নিয়ম কী?");
assert(formMatch && formMatch.id === "blood-request-form", "Should match blood-request-form");
console.log("✓ matchFormByQuery correctly resolved form for guidance query");

console.log("\n==========================================");
console.log("🎉 ALL PHASE 1 REGISTRY TESTS PASSED! 🎉");
console.log("==========================================");

import pkg from "mongoose";
const { Schema, models, model } = pkg;

// Platform-level Diner — NOT tenant-scoped. This inversion of the
// conventional restaurant-SaaS data model is what enables cross-restaurant
// taste portability (piller3.md §2.2). Orders reference the dinerId; raw
// order history stays per-restaurant (§2.3), but the derived taste vector
// here is platform-shared (read by Layer C's derivation pipeline only).
const DinerSchema = new Schema(
  {
    // localStorage UUID issued on first scan. Primary identity for an
    // anonymous diner. Never recycled — once issued, this UUID belongs to
    // that device/user forever.
    uuid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // SHA-256(E.164 phone). Sparse + unique so two distinct UUIDs can both
    // be present (anonymous diners), but the same phone can't bind to two
    // Diners. Populated opportunistically when Razorpay returns the phone
    // after payment. The raw phone is never stored on this record.
    //
    // No `default` — sparse index treats explicit null as a value, which
    // would collide across every anonymous diner. Letting the field stay
    // genuinely absent is what makes sparse-unique actually sparse.
    phoneHash: {
      type: String,
      sparse: true,
      unique: true,
    },

    // Identity state — controls UX (Graduated trust, §2.7) and downstream
    // ranking. Promotion: anonymous → opportunistic on first phone-bind;
    // → identified after explicit verification (out of scope for V1 demo).
    state: {
      type: String,
      enum: ["anonymous", "opportunistic", "identified"],
      default: "anonymous",
      index: true,
    },

    // 768-dim Gemini embedding space (matches lib/embeddings.ts). Heavy
    // payload — kept out of normal reads via `select: false`. Populated by
    // lib/taste.ts on order creation (Step 2).
    tasteVector: {
      type: [Number],
      default: null,
      select: false,
    },
    tasteVectorUpdatedAt: { type: Date, default: null },
    // 0..1 — gates Layer D's calibrated-abstention behavior (§2.6).
    tasteConfidence: { type: Number, default: 0 },

    // Diet preferences at the food-property level, NEVER the medical-
    // condition level (§5.2). Persistent prefs live here; transient prefs
    // stay session-scoped and are never written.
    dietaryPrefs: {
      persistent: {
        avoid: { type: [String], default: [] },
        prefer: { type: [String], default: [] },
        hardFilters: {
          isVeg: { type: Boolean, default: false },
          isVegan: { type: Boolean, default: false },
          allergens: { type: [String], default: [] },
        },
      },
    },

    // Consent flags. Append-only event-sourced consent log is a V1-
    // production concern; the current shape is the minimum that lets
    // Layer C and Layer D enforce consent at query time.
    consentState: {
      crossRestaurantRecommendations: { type: Boolean, default: false },
      tasteProfileStorage: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export default models?.Diner || model("Diner", DinerSchema);

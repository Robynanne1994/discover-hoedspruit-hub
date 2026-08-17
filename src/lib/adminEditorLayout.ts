/**
 * Shared layout for the admin editor dialogs.
 *
 * The app itself is mobile-only, but the backend is worked in from a desktop
 * browser — so these editors are the one place that has real width to spend.
 * Each string keeps the phone layout exactly as it was and only spreads out
 * from `lg` up, so switching a preview from mobile to desktop widens the
 * dialog and lays its content out in columns instead of one endless column.
 */

/** The editor dialog itself: phone-width on a phone, wide on a desktop. */
export const ADMIN_EDITOR_DIALOG =
  "max-w-[calc(100vw-1rem)] sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl max-h-[90vh] lg:max-h-[92vh] overflow-y-auto";

/** Two related fields side by side once there's room for them. */
export const ADMIN_FIELD_GRID = "grid gap-4 lg:grid-cols-2";

/** Same, for the dialogs whose fields sit on a 3-unit rhythm. */
export const ADMIN_FIELD_GRID_TIGHT = "grid gap-3 lg:grid-cols-2";

/**
 * A scrolling checkbox picker (categories, subcategories, …). On desktop it
 * gets taller and splits into columns, so a long list is read at a glance
 * instead of five rows at a time.
 */
export const ADMIN_PICKER_LIST =
  "space-y-2 lg:space-y-0 max-h-40 lg:max-h-72 overflow-y-auto border border-border rounded-lg p-3 border-gray-950 bg-slate-50 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-x-6 lg:gap-y-2";

/**
 * A run of Yes/No/N/A toggles. Stacked on a phone, then two and three up —
 * narrower columns keep each label next to its own buttons rather than
 * stranding them at opposite ends of the dialog.
 */
export const ADMIN_TOGGLE_GRID =
  "space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-x-8 lg:gap-y-3";

/** The image slots for a record: one column on a phone, a row of cards wide. */
export const ADMIN_IMAGE_GRID = "grid gap-4 lg:grid-cols-2 xl:grid-cols-3";

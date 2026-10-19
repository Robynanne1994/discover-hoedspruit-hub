# Project Architecture Rules

- Keep accommodation CSV value normalisation in a dedicated library module so imports, exports, and tests share one source of truth.
- Keep specials category collection, matching and per-special counting in the shared specialTags library so pills and drawer filters use identical rules.


## Plan: Remove "Social" section from Profile page

**What changes:**
- In `src/pages/MyAccount.tsx`, remove the `socialItems` array definition (~lines 438-440)
- Remove the "Social" section rendering block (~lines 539-545) which includes the "Social" heading and the "Find People" row

This is a straightforward deletion of ~10 lines. No other files affected.


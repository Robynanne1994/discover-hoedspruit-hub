# Send phone alerts in 2-hourly batches

## The approach
Check every 2 hours, on the hour (South African time), instead of alerting straight away. That beats "2 hours after the first item" because the timing is predictable for you: switch on events at 09:05 and 09:50 and both go out together at 10:00 as "Event & 1 Other".

- New items still show in the app's notifications list as soon as they go live. Only the phone alert waits.
- Until its alert is sent, a notification keeps collecting new items of the same kind, so "Farmers Market" becomes "Farmers Market & 3 Others" by the time it goes out. The old 30-minute window goes.
- Once an alert has gone out, the next new item starts a fresh group for the next batch.
- Quiet hours: no alerts overnight. Delivery times are 08:00, 10:00, 12:00, 14:00, 16:00, 18:00 and 20:00. Anything added after 20:00 goes out at 08:00 the next morning.

## Which notifications are batched
- Batched: new listings, new events, new specials, plus event and special updates (several edits to the same thing become one alert).
- Still instant: follow requests, new followers, replies to your feedback, moderation messages and App Updates you send yourself. These are personal or deliberate, so a 2-hour delay would feel broken.
- Event and special reminders keep their current daily morning times.

## Cost
The check runs 7 times a day. Each run is a small database job that sends nothing when there are no alerts waiting.

## Technical details
- Add `push_sent_at timestamptz` to `business_notifications`. For batched kinds, `dispatch_push_notification` skips the instant send; instant kinds behave as today.
- Grouping functions for listings, events and specials match the latest notification for that user and kind `WHERE push_sent_at IS NULL` instead of "unread within 30 minutes". Update notifications get the same merge per item.
- New SQL function `dispatch_pending_pushes()` picks rows with `push = true AND push_sent_at IS NULL` and a batched kind, stamps `push_sent_at = now()` and calls `send-push` per row through the existing vault-secret `net.http_post` path.
- Scheduled at `0 6,8,10,12,14,16,18 * * *` UTC (08:00–20:00 SAST).
- Existing unsent rows get backfilled as already sent, so nothing old suddenly goes out.
- Add tests for the batched and instant kind lists.

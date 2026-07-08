---
name: Resend connector validation
description: Why "healthy" Resend connection status cannot be trusted and how to actually verify it
---

# Resend connector validation

The Replit Resend connector reports `status: healthy` even when the stored API key is invalid (Resend returns 401/400 "API key is invalid"). Connection "set up successfully" events also fire when the user merely re-confirms the panel without changing any fields — the stored `api_key` / `from_email` can remain the old broken values across multiple "successful" reconnects.

**Why:** the connector only stores credentials; it does not validate them against Resend.

**How to apply:** after any Resend (re)connection, verify directly before trusting it:
1. `listConnections('resend')` → settings has `api_key` and `from_email` fields.
2. `GET https://api.resend.com/domains` with the key — 200 means the key is valid; also lists domain verification status.
3. Check `from_email` domain is a verified domain on the account (free-mail addresses like yahoo.com can never be verified; sending will fail even with a valid key).
4. If settings are unchanged after a reconnect, the user likely clicked confirm without editing — ask what they saw instead of re-proposing in a loop.

# UNI-TRACK — Product Vision

**Product direction:** A user-controlled productivity and tracking platform for habits, goals, tasks, activities and personal metrics.

## Founding problem

People's goals and recurring activities become scattered across notes, reminders and disconnected tools. UNI-TRACK should make it easier to record activity, understand progress and maintain useful routines in one coherent workspace.

## Core promise

Give each user a practical, reliable place to define what they are tracking, record progress, review patterns and retain control over their own data.

## Product principles

- **User-owned tracking:** trackers, targets, entries and exports belong to the authenticated user.
- **Useful structure:** support habits, goals, tasks, activity records and measurable metrics without forcing every use case into the same template.
- **Meaningful progress:** dashboards must be calculated from real user records and explain what each metric means.
- **Privacy by design:** minimize collected data, keep secrets server-side, scope every read/write to the authenticated account and explain which data is encrypted.
- **Accurate security claims:** distinguish transport security, server-side encryption at rest, client-side field encryption and end-to-end encryption. Never use these terms interchangeably.
- **Recoverability:** encryption must not silently turn device loss or cleared browser data into permanent data loss. Provide a user-understood recovery/export route and test it before claiming encrypted data is recoverable.
- **Portability:** users need a documented export and account/data deletion path.
- **Reliable operation:** authentication, email recovery, session expiry, notifications, offline behavior and database recovery must have clear failure paths.

## Current implementation baseline

The current frontend repository contains account registration, sign-in and password recovery, tracker creation/list/detail/filter/dashboard views, CSV export, push-notification support, a one-hour inactivity logout wrapper and browser-side encryption helpers. The frontend calls the separate `Ad3n1x/lv3node` backend.

The current `main` frontend stores non-extractable private CryptoKey material in IndexedDB. Its README notes that clearing browser data or losing the device may make encrypted records unreadable and that a user-facing recovery/export workflow is not yet implemented. The current `lv3node/main` auth routes provide public-key storage but do not expose the encrypted key-vault recovery endpoints expected by the newer `feat/unitrack-complete-experience` frontend branch.

A newer frontend branch and a newer backend branch contain candidate recovery-vault/session work, but both are diverged from their respective main branches. They must be reconciled and tested together; do not merge either branch wholesale or advertise recovery as live until the complete pair works.

## Acceptance criteria

- Users can create, view, edit, filter and delete their own trackers and entries.
- Server authorization prevents cross-account reads and writes even when IDs are substituted.
- Session verification is server-authoritative; logout and password-reset behavior are consistent across tabs/devices.
- New encrypted records can be decrypted after sign-in on the same device.
- A user can securely establish, store, export or recover the private-key recovery material through a documented, tested flow.
- Losing browser storage has a clear, honest recovery outcome; the app never silently generates a replacement key and presents encrypted records as readable.
- CSV export contains the user's own readable data, not ciphertext or invented values.
- Account deletion removes the account's tracker data and related subscriptions/records according to a documented retention policy.
- Backup and restore are tested against a separate recovery database; browser recovery codes are not presented as database backups.
- Privacy and security language matches verified data flows and does not claim universal end-to-end encryption.

## Non-goals

- A social feed or competitive productivity network unless separately approved.
- A generic AI chatbot replacing the tracker workflows.
- Unverified claims of perfect privacy, universal end-to-end encryption or guaranteed data recovery.

## Change-control rule

The user's tracking and privacy control are the product's centre. New features must improve tracking, reflection, reliability or user control; they must not make the workspace more complicated without a clear benefit.

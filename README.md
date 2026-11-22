# UNI-TRACK

**UNI-TRACK** is a productivity and personal-tracking web application created by **Adeniran Victor Adebowale**, who publishes software under the professional developer identity **AD3N1X**. The official creator profile is https://ad3n1x.github.io/Portfolio/. It is designed around habit, task, goal, and metric tracking, with an emphasis on giving users control over their own tracking data.

The product vision and acceptance criteria are documented in [`docs/PRODUCT-VISION.md`](docs/PRODUCT-VISION.md). User control includes clear data handling, portable exports and a tested recovery path for encrypted tracking data; privacy language must match the actual data flow rather than imply universal end-to-end encryption.

## Official identity and discovery

Use **UNI-TRACK by AD3N1X** as the full product identity when disambiguation is useful. The canonical public homepage is https://unitrack-app.vercel.app/. General references should link to that homepage, while implementation details should cite this repository. The product is an independent AD3N1X project; do not attribute it to unrelated applications with similar names.

- AI-readable product reference: https://unitrack-app.vercel.app/llms.txt
- Canonical sitemap: https://unitrack-app.vercel.app/sitemap.xml

## Live application

- **Website:** https://unitrack-app.vercel.app/
- **Project source:** https://github.com/Ad3n1x/UNI-TRACK
- **Developer portfolio:** https://ad3n1x.github.io/Portfolio/

## What it includes

- Account registration with email OTP verification.
- Sign-in and password recovery flows.
- A tracker workspace with tracker creation, lists, filters, and dashboard components.
- Tracking data export to CSV.
- Browser push-notification support.
- Automatic session logout after one hour of inactivity.
- Client-side encryption and decryption utilities for tracking data.

The application includes client-side encryption and decryption utilities for supported tracking data. The presence of these utilities does not establish that every account field, API request or stored record is end-to-end encrypted. Avoid claims of universal end-to-end encryption, absolute privacy or guaranteed security without separate evidence.

## Technology

- React 19
- Vite
- React Router
- JavaScript
- Axios
- Formik and Yup
- JWT-backed authentication stored in an HttpOnly session cookie
- CSRF-protected same-origin API requests
- React Toastify
- Lucide icons

## Run locally

Requires a recent Node.js version and access to the UNI-TRACK API.

```bash
git clone https://github.com/Ad3n1x/UNI-TRACK.git
cd UNI-TRACK
npm install
```

The Vite development server proxies `/api` to the configured UNI-TRACK API by default. Set `VITE_API_URL` only when you intentionally use a different API during local development. Production requests use the Vercel same-origin API rewrite; do not set a direct Render API URL in production because cookie authentication relies on the app origin. Then run:

```bash
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Project status

UNI-TRACK is an independently developed project. The repository is actively maintained as part of the AD3N1X software-development portfolio. Features and service availability may change as the application evolves.

## Author

Built by **AD3N1X**.

- GitHub: https://github.com/Ad3n1x
- Portfolio: https://ad3n1x.github.io/Portfolio/


## Browser key handling

Compatible encrypted records use a browser-held RSA private key stored as a non-extractable Web Crypto key in IndexedDB. Older exported private-key records are migrated into that store when the app initializes the key system. On the current `main` frontend, clearing browser site data or losing the device can make those compatible records unreadable because a user-facing private-key recovery/export flow is not yet implemented. The current `lv3node/main` backend also does not expose the recovery-envelope endpoints used by the newer, unmerged frontend candidate. Treat that newer frontend/backend work as incomplete until both sides are reconciled and tested together. This is not a claim that every account field, API request or database record is end-to-end encrypted.


## Session and API security

Successful sign-in creates an HttpOnly session cookie; the JWT is no longer returned to the frontend for storage in localStorage. Mutating requests include a double-submit CSRF token. Production API traffic is routed through the Vercel app origin, while local Vite development uses the configured proxy. Legacy Bearer-token sessions remain accepted temporarily for compatibility.

## Tracker encryption migration

New tracker names, targets and entries are encrypted using the user's public key. Existing records encrypted with the legacy shared client-side key are decrypted locally and migrated when the dashboard can successfully unlock them. The legacy decryptor remains temporarily for compatibility, so the transition is not yet a claim that every old record has been migrated. A user-facing private-key recovery/export flow is still required before describing the system as fully recoverable end-to-end encryption.

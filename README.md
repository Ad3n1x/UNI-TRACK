# UNI-TRACK

**UNI-TRACK** is a productivity and personal-tracking web application by **AD3N1X**. It is designed around habit, task, goal, and metric tracking, with an emphasis on giving users control over their own tracking data.

## Live application

- **Website:** https://unitrack-app.vercel.app/
- **Project source:** https://github.com/Ad3n1x/UNI-TRACK
- **Developer portfolio:** https://engnradeniran.com/

## What it includes

- Account registration with email OTP verification.
- Sign-in and password recovery flows.
- A tracker workspace with tracker creation, lists, filters, and dashboard components.
- Tracking data export to CSV.
- Browser push-notification support.
- Automatic session logout after one hour of inactivity.
- Client-side encryption and decryption utilities for tracking data.

The project landing page describes a client-side encryption approach. Security claims should be evaluated against the implementation and deployment configuration; this README does not claim that every part of the application or every stored field is end-to-end encrypted.

## Technology

- React 19
- Vite
- React Router
- JavaScript
- Axios
- Formik and Yup
- JWT-based authentication
- Browser cookies
- React Toastify
- Lucide icons

## Run locally

Requires a recent Node.js version and access to the UNI-TRACK API.

```bash
git clone https://github.com/Ad3n1x/UNI-TRACK.git
cd UNI-TRACK
npm install
```

Create a `.env` file in the project root and configure the API URL using the variable supported by the application (for example, `VITE_API_URL`). Then run:

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
- Portfolio: https://engnradeniran.com/

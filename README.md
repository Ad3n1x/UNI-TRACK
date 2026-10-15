# UNI-TRACK — Privacy-first productivity and tracking

UNI-TRACK is a React application built with Vite and React Router. The app includes a public landing experience, account registration and login, a homepage, password recovery, and the UNI-TRACK product page.

## Stack

- React 19 and Vite
- React Router for client-side routes
- Formik and Yup for form handling/validation where used
- Axios for HTTP requests
- React Toastify for feedback

## Local development

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm run lint
npm run build
npm run preview
```

Resolve lint/build failures before deployment. Also test the production build in a browser; successful compilation does not verify backend connectivity, authentication rules, or every route.

## Routes to smoke-test

- `/` and `/unitrack` — public product experience
- `/login` — sign-in
- `/register` — account creation
- `/homepage` — authenticated app experience
- `/forgot-password` — password recovery
- An unknown path — friendly not-found screen

Refresh each route directly on the deployed host to verify SPA fallback configuration. Check that logged-out users cannot access protected data simply by navigating directly to a URL.

## Security and privacy release gate

- Keep secrets on the server; never ship private API credentials in the Vite client bundle.
- Enforce authorization on the backend for every private read/write; hiding a React route is not authorization.
- Verify authentication expiry and logout behavior in multiple tabs and after a page refresh.
- Validate server inputs and return safe errors without exposing tokens or internal details.
- Review cookie/session settings for the actual deployment domain and HTTPS configuration.
- Test account deletion/data-retention behavior and explain what information is stored.
- Avoid claiming a feature is privacy-preserving until its data flows and third-party requests have been reviewed.

## Deployment checklist

- [ ] Configure production environment variables on the host.
- [ ] Verify API URLs, CORS and authentication callbacks use the correct production origins.
- [ ] Check browser console and network requests for failed assets/API calls.
- [ ] Test mobile layouts, keyboard navigation, loading, empty and error states.
- [ ] Verify the live URL and all public project links before sharing it.

This README describes the repository and the checks required for release. It does not claim that the production deployment has passed these tests.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Background tasks (Trigger.dev)

Tasks live in `trigger/`, with the project reference in `trigger.config.ts`.
The SDK, build package, and CLI commands use version 4.6.0; upgrade them together.

1. Run `npm run trigger:login` if the CLI is not already authenticated.
2. Copy the project's **DEV** API key from the Trigger.dev dashboard into
   `.env.local` as `TRIGGER_SECRET_KEY=tr_dev_...`. Keep it server-only.
   Next.js uses this key when backend code triggers tasks.
3. Run `npm run trigger:dev` in a separate terminal alongside `npm run dev`.
4. Open the project's development dashboard and test `hello-world` with `{}`.
   It returns `{ "message": "Ghost AI background tasks are ready." }`.

The starter task verifies worker setup; AI design and spec workflows are separate
features. Deploy tasks when ready using `npm run trigger:deploy`; configure task
secrets in the corresponding Trigger.dev environment before deploying workflows
that need external services.

See the [Trigger.dev setup guide](https://trigger.dev/docs/manual-setup).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

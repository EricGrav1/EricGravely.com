# Sales Manager Coaching Tool — Live Setup

The codebase is ready for a one-time **$39.99 USD** Stripe purchase with automatic email delivery of the private product bundle.

## 1. Apply the database schema

In the Replit Shell, run:

```bash
npm run db:push
```

This adds the paid-product fields, `orders`, and Stripe event records. Run this before taking a live payment.

## 2. Configure Stripe

In Stripe, create a product named **Sales Manager Coaching Tool** with a one-time **$39.99 USD** price. Copy its `price_...` ID.

Add these Replit Secrets:

```text
STRIPE_SECRET_KEY=sk_live_...
STRIPE_SALES_MANAGER_TOOL_PRICE_ID=price_...
SITE_BASE_URL=https://ericgravely.com
```

For test-mode checkout, use Stripe test keys and a test-mode Price ID first.

## 3. Add the Stripe webhook

Create a Stripe webhook endpoint at:

```text
https://ericgravely.com/api/stripe/webhook
```

Subscribe it to:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`

Copy the endpoint signing secret into Replit:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

The webhook verifies Stripe signatures, fulfills each paid order once, and revokes delivery after a refund event.

## 4. Confirm product delivery email

These existing secrets must also be set:

```text
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=Eric Gravely <eric@ericgravely.com>
```

Before launch, create a real receiving mailbox for `eric@ericgravely.com`. The app uses that address as the Reply-To address for purchase support.

## 5. Test before going live

1. Deploy with Stripe test keys.
2. Open `/products/sales-manager-coaching-tool`.
3. Complete a Stripe test purchase.
4. Confirm the success page provides a working ZIP download.
5. Confirm the delivery email arrives.
6. Open `/admin` → **Orders & delivery** and confirm the order appears.
7. Use **Reset & resend link** and confirm a new link arrives.
8. Replace test keys with live Stripe keys only after all checks pass.

## Product policy included in the files

- Single-user license: one purchaser may use the tool with the reps they directly coach.
- The reusable file may not be shared with other managers, resold, posted publicly, or used to create a competing product.
- Multi-manager use requires a separate license for each manager.
- All sales are final once the digital files are delivered, except where required by law.

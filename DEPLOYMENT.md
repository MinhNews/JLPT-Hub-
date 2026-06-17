# Deployment Notes

## Backend on Render

Required environment variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL=https://jlpt-hub.vercel.app`
- `GOOGLE_CLIENT_ID`
- `PAYMENT_WEBHOOK_SECRET`

Recommended:

- `NODE_ENV=production`
- Do not set `ENABLE_PAYMENT_SIMULATION` in production.
- Keep `ENABLE_DEFAULT_USER_SEED` unset in production.

SePay/Casso webhook URL:

```text
https://<your-render-backend-domain>/api/membership/payment-webhook?token=<PAYMENT_WEBHOOK_SECRET>
```

If your webhook provider supports custom headers, you can send the secret as one of:

- `x-webhook-secret`
- `x-payment-webhook-secret`
- `x-sepay-secret`
- `Authorization: Bearer <PAYMENT_WEBHOOK_SECRET>`

## Frontend on Vercel

Required environment variables:

- `NEXT_PUBLIC_API_URL=https://<your-render-backend-domain>/api`

After deploy, test payment with a small transaction and verify the matching transaction moves from `pending` to `completed`.

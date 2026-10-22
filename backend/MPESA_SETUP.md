# M-Pesa STK Push setup

The application uses Safaricom Daraja STK Push. Payment amounts are calculated by the API from the approved booking's saved KES menu-package total; values sent by the browser are not used to determine the amount.

Add the following variables to `backend/.env` (never commit credentials):

```env
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_sandbox_consumer_key
MPESA_CONSUMER_SECRET=your_sandbox_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_sandbox_passkey
MPESA_CALLBACK_URL=https://your-public-host.example/api/payments/mpesa/callback
MPESA_DEPOSIT_PERCENTAGE=30
```

- `MPESA_ENV` accepts `sandbox` or `production`; it defaults to `sandbox`.
- `MPESA_DEPOSIT_PERCENTAGE` accepts a value from 1 to 100 and defaults to `30`.
- Use the shortcode and passkey issued for the selected Daraja environment. `174379` is the common Daraja sandbox test shortcode.
- The callback URL must be reachable by Safaricom over HTTPS and end with `/api/payments/mpesa/callback`. Localhost URLs cannot receive provider callbacks.
- Payment requests are available only for admin-approved bookings with a KES menu package. Customers start a request from **My Bookings** and approve the STK prompt on their phone.
- A payment is displayed as completed only after the callback matches the stored checkout request, amount, Kenyan phone number, and M-Pesa receipt. Unverifiable success callbacks are marked for review.

After setting the environment variables, restart the backend. Test with Daraja sandbox credentials and a configured public HTTPS callback before switching `MPESA_ENV` to `production`.

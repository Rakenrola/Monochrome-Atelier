# Sheesh server and MySQL setup

The Express server is the only layer that connects to MySQL. The React app in
`frontend/` calls its `/api` endpoints; it must never connect to MySQL directly.

## 1. Create the database

Start a MySQL 8 server. In MySQL Workbench, open and run `schema.sql` from this
folder. It creates the `sheesh_inventory` database, the `users` and `products`
tables, a per-user cart (`carts` and `cart_items`), and seeds the seven products
currently shown in the store. Each user has at most one cart, and each product
can appear once per cart with its own quantity. Different users can have the
same product with independent quantities. Cart totals should be calculated
from each item's quantity and the current product price, rather than stored.
The script can be run again safely; it inserts any missing seed products and
leaves existing product data unchanged.

## 2. Configure and start the API

Copy `.env.example` to `.env` in this folder (for example,
`Copy-Item .env.example .env`) and set the MySQL username,
password, and a long random `JWT_SECRET`. `DB_NAME` must be `sheesh_inventory`
unless you also change the database name in `schema.sql`. Follow the Google
sign-in setup below to set `GOOGLE_CLIENT_ID`.

```powershell
npm install
npm run db:test
npm run dev
```

The API listens on port `5000` by default. `GET /api/test-db` checks that the
server can reach the configured database. For TiDB Cloud, set `DB_SSL=true`;
the server verifies TLS with `isrgrootx1.pem`. For local MySQL without TLS,
set `DB_SSL=false`.

## Production deployment

Deploy this Express API as a Node web service (for example, a Render web
service) with the repository root directory set to `server`, build command
`npm install`, and start command `npm start`. Add these values in the API
host's environment settings; do not commit production credentials:

```text
DB_HOST=<TiDB Cloud host>
DB_USER=<application database user>
DB_PASSWORD=<rotated database password>
DB_NAME=sheesh_inventory
DB_SSL=true
JWT_SECRET=<long randomly generated secret>
GOOGLE_CLIENT_ID=<Google OAuth client ID>
CORS_ORIGIN=<deployed Vercel site origin>
FRONTEND_URL=<deployed Vercel site URL>
GMAIL_USER=<Gmail sender address>
GMAIL_APP_PASSWORD=<Google app password>
```

Use a dedicated TiDB database user with only the permissions the application
needs, rather than a cluster root user. Keep `.env` files out of Git.
`FRONTEND_URL` is used to build password-reset links and must be the frontend's
HTTPS origin in production. `GMAIL_USER` and `GMAIL_APP_PASSWORD` are used only
by the backend to send reset emails.

Deploy the `frontend/` folder separately on Vercel. Set its `VITE_API_BASE_URL`
environment variable to the deployed API's origin (for example,
`https://your-api.example.com`) and set `VITE_GOOGLE_CLIENT_ID` to the same
Google OAuth client ID as the API. Vite embeds `VITE_` values at build time, so
redeploy the frontend after changing them. Add the deployed Vercel site origin
to the OAuth client's authorized JavaScript origins. Set `CORS_ORIGIN` on the
API to that exact origin. The frontend uses relative `/api` requests in local
development through Vite's proxy; the production API base URL is supplied by
`VITE_API_BASE_URL`.

Rotate any database password or JWT secret that has been shared publicly
before deploying. Changing `JWT_SECRET` invalidates existing login tokens, so
users will need to sign in again.

## Gmail password reset setup

The login page sends reset requests to the API. The API creates a random,
single-use token, stores only its SHA-256 hash in `password_reset_tokens`, and
sends a link that expires after 30 minutes. Run the updated `schema.sql` against
TiDB before deploying the backend; it creates this table if it does not exist.

For Gmail SMTP, enable 2-Step Verification on the sender Google account and
create an App Password in that account's security settings. Set these
environment variables on the **backend** deployment only:

```text
GMAIL_USER=<sender Gmail address>
GMAIL_APP_PASSWORD=<Google-generated app password>
FRONTEND_URL=https://monochrome-atelier.vercel.app
```

Use the actual frontend origin for `FRONTEND_URL`, with no trailing path. Keep
the app password out of GitHub and out of all `VITE_` frontend variables. The
reset link opens `/reset-password` on the frontend; users enter and confirm a
new password there. Unknown email addresses receive the same success message
as registered addresses.

## Cart and account behavior

Guests can add items to a browser-local cart. The `cart_items.id` column is the
auto-generated primary key for a cart row and is never `NULL`; guest items are
not inserted into MySQL before sign-in. After registration or login, the API
merges the browser cart with the user's database cart. A user's cart is linked
through `carts.user_id`, then `cart_items.cart_id`; cart endpoints require the
user's bearer token. Subsequent cart changes are saved through `PUT /api/cart`.
The merge keeps the greater quantity for a product already present in both
carts, which makes retrying a failed synchronization safe.

The frontend blocks checkout until the visitor signs in or registers. Checkout
currently generates a client-side receipt; it does not create a persisted order
or process a payment.

## 3. Start the store app

In a separate terminal:

```powershell
cd ..\frontend
npm install
npm run dev
```

The Vite development server proxies `/api` requests to Express. The Home page
catalog loads from `GET /api/products`; database or API errors are shown
instead of silently displaying stale mock data. While the page is open and
visible, it checks for product changes every two seconds, so committed MySQL
changes appear without reloading. Polling pauses while the tab is hidden and
refreshes when the tab becomes visible again. Changes made inside an uncommitted
MySQL transaction will not appear until that transaction is committed.

## Google sign-in setup

The app uses Google Identity Services to receive a Google ID token in the
browser. The server verifies that token before looking up or creating the user.
The verified Google `sub` and email are stored on the existing `users` row; no
separate Google-users table is used. `google_id` is unique so a Google identity
cannot be attached to multiple users.

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and
   select or create a project.
2. In **Google Auth Platform**, configure the branding and audience. Choose
   **External** if customers use personal Google accounts. While the app is in
   testing, add your Google account under **Test users**.
3. Create an **OAuth client ID** with application type **Web application**.
4. Under **Authorized JavaScript origins**, add the exact local frontend
   origin, normally `http://localhost:5173`. Add the production frontend origin
   when deployed, for example `https://shop.example.com`.
5. This implementation uses the Google Identity Services credential popup;
   it does not use an OAuth redirect callback, so no **Authorized redirect
   URIs** are needed.
6. Copy the OAuth **Client ID**. The client ID is public configuration, not a
   client secret. Do not put a client secret in the frontend or commit secrets.
7. Put the same client ID in both environment files:

   ```text
   server/.env:   GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   frontend/.env: VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com
   ```

   The server value is used to verify the token audience; the `VITE_` value
   enables the Google button in the browser. Create each file by copying its
   `.env.example` if it does not already exist. Restart both development
   servers after changing environment variables.

On first Google sign-in, the server first looks up the verified Google `sub`.
If it is not linked yet, a verified email that already exists in `users` is
linked to that row. A local account then has `auth_provider = 'both'`; an
existing Google-only account is marked `google`. A new verified email creates
a `users` row with an automatically generated
`customer_<email-name>_<random-suffix>` username, `auth_provider = 'google'`,
and the `customer` role. Google sign-in never accepts a role from the browser
and never creates an admin. An existing admin account cannot be linked to
Google automatically.

Google-only accounts have no local password, so the schema allows `password`
to be `NULL`. Run the updated `schema.sql` in Workbench to add `google_id`,
`auth_provider`, the unique Google ID index, and nullable passwords to an
existing `users` table. The migration is safe to run again and preserves
existing password hashes. Existing password-based users default to
`auth_provider = 'local'`; existing rows with a null password are marked
`google`. Password login rejects rows without a password hash; those users
must use Google sign-in. Accounts with `auth_provider = 'both'` can use either
Google sign-in or their existing password.

## Product endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/products` | Public | List products |
| `GET` | `/api/products/:id` | Public | Get one product |
| `POST` | `/api/products` | Admin bearer token | Create a product |
| `PUT` | `/api/products/:id` | Admin bearer token | Replace a product |
| `DELETE` | `/api/products/:id` | Admin bearer token | Delete a product |

## Customer management endpoints

All customer-management endpoints require an administrator bearer token.
Customer records are selected by `role = 'customer'`; these routes cannot list,
edit, or delete administrator accounts. Passwords are hashed on creation or
password change and are never included in API responses.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/customers` | List customers |
| `GET` | `/api/customers/:id` | Get one customer |
| `POST` | `/api/customers` | Create a customer |
| `PUT` | `/api/customers/:id` | Update provided `username`, `email`, and/or `password` fields |
| `DELETE` | `/api/customers/:id` | Permanently delete a customer and their cart |

Register an account with `POST /api/auth/register`, then promote that account
once using MySQL Workbench:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```

Log in again after changing the role so the new JWT carries the admin claim.
Send that JWT as `Authorization: Bearer <token>` for product mutations. Keep
admin tokens private. Customer tokens can browse products but cannot create,
update, or delete them. The current storefront is a public catalog; it does
not yet include an admin product-management interface. Until that interface is
built, admins can call the protected product endpoints using an HTTP client
with their admin bearer token.

Product JSON fields are `title`, `category`, `price`, `specs`, and `image`.
`price` must be a non-negative JSON number. For example:

```json
{
  "title": "Example graphics card",
  "category": "GPU",
  "price": 499.99,
  "specs": "16GB memory",
  "image": "https://example.com/product.jpg"
}
```

# Supabase setup for Shreenathji Imitation

This application treats Supabase as the only source of business data. It does
not store designs, lots, karigars, profiles, preferences, or auth sessions in
browser storage.

## 1. Create the Supabase project

1. Sign in at <https://supabase.com/dashboard>.
2. Create an organization if you do not already have one.
3. Select **New project**.
4. Enter a project name such as `shreenathji-production`.
5. Generate and securely save the database password. Do not put it in this app.
6. Choose the region nearest the workshop/users.
7. Create the project and wait until its services are healthy.

Use separate Supabase projects for development and production. Do not test
schema changes against the production database.

## 2. Create the database schema

For a first manual setup:

1. Open the project in the Supabase Dashboard.
2. Open **SQL Editor** and create a new query.
3. Run the SQL migration files in timestamp order:
   `202609250001_production_data.sql`, then
   `202609250002_make_design_sample_weights_optional.sql`, then
   `202609250003_design_photo_storage.sql`, then
   `202610030001_awaiting_wax_receipt.sql`, then
   `202610030003_user_access_control.sql`.
4. If the first migration is already applied to this project, run only the
   migrations that have not yet been applied. Existing sample values are
   preserved; new designs no longer need them. The final migration allows a
   lot to be saved before its Wax receipt weight and pieces are known.

The migrations create `designs`, `karigars`, and `lots`, their constraints and
indexes, enable Row Level Security, allow authenticated users, add the tables to
the `supabase_realtime` publication, and make design sample-weight fields
optional. Weight rulers are established later from actual production data.

For an ongoing team workflow, use the Supabase CLI instead of making later
schema edits directly in the Dashboard:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The project ref is visible in the Dashboard URL.

## 3. Verify the schema

Run these checks in SQL Editor:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('designs', 'karigars', 'lots')
order by table_name;

select tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('designs', 'karigars', 'lots')
order by tablename, policyname;

select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename in ('designs', 'karigars', 'lots')
order by tablename;
```

Each query should return all three tables.

## 4. Configure authentication

1. Open **Authentication > Providers > Email**.
2. Keep email/password authentication enabled.
3. For a staff-only application, disable public user signup.
4. Open **Authentication > URL Configuration**.
5. During development, set the site/redirect URL to `http://localhost:3000`.
6. Add the deployed HTTPS application URL before production launch.
7. Open **Authentication > Users > Add user**.
8. Create the initial administrator with an email and strong password. If the
   Dashboard offers both invitation and direct creation, direct creation is
   simplest for the first test because the current app has no invitation or
   password-reset screen yet.

The app currently keeps the Supabase session in memory only. Closing or
refreshing the page requires the user to sign in again.

## 5. Copy the browser-safe project credentials

1. Open the project's **Connect** dialog, or **Settings > API Keys**.
2. Copy the **Project URL**.
3. Copy the **publishable key** beginning with `sb_publishable_`.
4. Never copy a secret key or service-role key into a Vite environment file.

Create `.env` in the repository root:

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_YOUR_KEY"
```

The `.env` file is ignored by Git. Restart Vite after changing it because Vite
reads environment variables when the development server starts.

## 6. Run the application

```powershell
npm install
npm run dev
```

Open <http://localhost:3000>, sign in using the Supabase user, and confirm that
the dashboard loads without a database synchronization error.

## 7. Add real karigars

Select a stage card on the Dashboard, then choose **Add Karigar**. Enter the
worker's name and phone number, and select any additional stages they can work
in. The stage you opened stays selected. A worker who handles Wax, Casting, and
Dull should be created once with all three stages checked. The saved worker
appears in each applicable stage card and can be selected during lot dispatch.

Allowed stages are `Wax`, `Casting`, `Buff`, `Zabora`, `Dull`, `Chhol`, and
`Plating`. No demo designs, lots, or karigars are inserted into the database.

## 8. Test database synchronization

1. Sign in and create a design.
2. Confirm the row appears in **Table Editor > designs**.
3. Create a lot and confirm it appears in `lots`.
4. Open the app in a second browser, sign in as another Supabase user, and keep
   both windows visible.
5. Update a lot in one browser and verify the other refreshes automatically.
6. Refresh the page and sign in again; the same database data should return.
7. Confirm that clearing browser data does not delete database records.

If rows load but realtime changes do not arrive, check that the table appears
in `supabase_realtime` and that the signed-in user can select it through RLS.

## 9. Configure deployment

Add the same two `VITE_` variables to the hosting provider's environment
settings and rebuild the app. Add the deployed HTTPS URL to Supabase Auth URL
Configuration. Never expose the database password or a Supabase secret/service
role key in the browser build.

## 10. Required before real production use

The current migration is suitable for connecting and testing a single-factory
application, but its authenticated policies allow every signed-in user to read
and change every production record. Before live use, add:

- `facilities`, `profiles`, and `facility_memberships` tables;
- roles such as owner, manager, entry operator, scanner, stock, and auditor;
- facility-scoped RLS policies and role-specific write permissions;
- immutable audit events recording user, action, old/new values, and timestamp;
- transactional database functions for workflow transitions;
- optimistic concurrency/version checks for simultaneous operators;
- a Supabase Storage bucket and policies for design photos;
- invitation, password-reset, and account-management screens;
- backups, monitoring, error reporting, and separate dev/staging/prod projects.

Do not use the current broad authenticated-user policies for multiple unrelated
facilities or untrusted operators.

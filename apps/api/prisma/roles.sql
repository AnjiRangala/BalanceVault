-- Run once as a PostgreSQL administrator, outside Prisma migrations.
-- Supply credentials using your deployment's secret manager; no passwords belong here.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='balancevault_migration_owner') THEN
    CREATE ROLE balancevault_migration_owner LOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='balancevault_posting_owner') THEN
    CREATE ROLE balancevault_posting_owner NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='balancevault_runtime') THEN
    CREATE ROLE balancevault_runtime NOLOGIN;
  END IF;
END $$;

-- Correct existing installations too; the migration principal may explicitly
-- SET ROLE to the posting owner when transferring routine ownership, but does
-- not inherit application or posting privileges by default.
ALTER ROLE balancevault_migration_owner NOINHERIT;

-- The migration principal must own the target database and public schema (or be
-- granted equivalent CREATE/ALTER/REFERENCES/TRIGGER privileges). Membership in
-- the NOLOGIN posting owner role is needed only to transfer routine ownership.
GRANT balancevault_posting_owner TO balancevault_migration_owner;
DO $$ BEGIN
  IF pg_has_role('balancevault_migration_owner','balancevault_runtime','MEMBER') THEN
    EXECUTE 'REVOKE balancevault_runtime FROM balancevault_migration_owner';
  END IF;
END $$;

-- The service's login is provisioned separately and receives this group role:
-- GRANT balancevault_runtime TO balancevault_api_login;

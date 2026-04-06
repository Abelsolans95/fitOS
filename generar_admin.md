# Generar Admin — FitOS

## Registro de admin inicial (bootstrap)

Ejecutar en **Supabase SQL Editor** para crear el primer usuario admin:

```sql
-- 1. Crear usuario auth con rol admin
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
VALUES ('admin@fitos.com', crypt('password', gen_salt('bf')), now(), '{"role":"admin","onboarding_completed":true}'::jsonb);

-- 2. Crear perfil
INSERT INTO profiles (user_id, full_name, email, role)
VALUES ((SELECT id FROM auth.users WHERE email = 'admin@fitos.com'), 'Admin', 'admin@fitos.com', 'admin');
```

> **Importante:** Cambiar `admin@fitos.com` y `password` por valores reales antes de ejecutar.

## Crear admins adicionales

Una vez existe el primer admin, se pueden crear más desde el panel web:

`/app/admin/users/create` → seleccionar rol "Admin"

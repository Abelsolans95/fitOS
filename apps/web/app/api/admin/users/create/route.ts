import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { validateCsrf } from "@/lib/csrf";
import { sanitizeName, sanitizeEmail } from "@/lib/sanitize";

export async function POST(request: NextRequest) {
  try {
    // CSRF
    if (!validateCsrf(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { auth, errorResponse } = await verifyAdmin(request);
    if (!auth) return errorResponse!;

    const { supabaseAdmin } = auth;
    const body = await request.json();

    const { email, password, full_name, role, trainer_id, business_name, specialty } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "Campos obligatorios: email, password, full_name, role" }, { status: 400 });
    }

    if (!["trainer", "client", "admin"].includes(role)) {
      return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
    }

    if (role === "client" && !trainer_id) {
      return NextResponse.json({ error: "Los clientes requieren un entrenador asignado" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    // Sanitize inputs
    const cleanName = sanitizeName(full_name, 100);
    const cleanEmail = sanitizeEmail(email);
    const cleanBusiness = business_name ? sanitizeName(business_name, 100) : null;
    const cleanSpecialty = specialty ? sanitizeName(specialty, 100) : null;

    if (!cleanEmail) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    // If creating a client, verify the trainer exists
    if (role === "client") {
      const { data: trainer, error: trainerErr } = await supabaseAdmin
        .from("profiles")
        .select("user_id, role")
        .eq("user_id", trainer_id)
        .eq("role", "trainer")
        .single();

      if (trainerErr || !trainer) {
        return NextResponse.json({ error: "Entrenador no encontrado" }, { status: 400 });
      }
    }

    // 1. Create auth user with admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: cleanName,
        onboarding_completed: true, // Admin-created users skip onboarding
      },
    });

    if (authError) {
      if (authError.message?.includes("already")) {
        return NextResponse.json({ error: "Ya existe un usuario con este email" }, { status: 409 });
      }
      console.error("[admin/users/create] Error creando auth user");
      return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }

    const newUserId = authData.user.id;

    // 2. Create profile
    const profileData: Record<string, unknown> = {
      user_id: newUserId,
      full_name: cleanName,
      email: cleanEmail,
      role,
    };

    if (role === "trainer") {
      if (cleanBusiness) profileData.business_name = cleanBusiness;
      if (cleanSpecialty) profileData.specialty = cleanSpecialty;
    }

    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert(profileData, { onConflict: "user_id" });

    if (profileErr) {
      console.error("[admin/users/create] Error creando perfil");
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: "Error al crear perfil" }, { status: 500 });
    }

    // 3. Create user_roles entry
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: newUserId, role }, { onConflict: "user_id" });

    if (roleErr) {
      console.error("[admin/users/create] Error creando user_roles");
    }

    // 4. If client, create trainer_clients relationship
    if (role === "client" && trainer_id) {
      const { error: tcErr } = await supabaseAdmin
        .from("trainer_clients")
        .insert({
          trainer_id,
          client_id: newUserId,
          status: "active",
          joined_at: new Date().toISOString(),
        });

      if (tcErr) {
        console.error("[admin/users/create] Error creando trainer_clients");
        return NextResponse.json({ error: "Usuario creado pero error al asignar entrenador" }, { status: 207 });
      }
    }

    // 5. If trainer, create default promo code
    if (role === "trainer") {
      const code = `FIT-${cleanName.replace(/\s+/g, "").substring(0, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      await supabaseAdmin
        .from("trainer_promo_codes")
        .insert({
          trainer_id: newUserId,
          code,
          is_active: true,
          max_uses: 50,
          current_uses: 0,
        });
    }

    return NextResponse.json({
      success: true,
      user_id: newUserId,
      email: cleanEmail,
      role,
    }, { status: 201 });
  } catch {
    console.error("[admin/users/create] Error inesperado");
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}

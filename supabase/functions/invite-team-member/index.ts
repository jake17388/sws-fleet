import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) throw new Error("Authentication is required.");

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const adminClient = createClient(url, serviceRoleKey);
    const { data: userData, error: userError } = await callerClient.auth.getUser();
    if (userError || !userData.user) throw new Error("Authentication is required.");

    const { data: caller } = await adminClient
      .from("team_members")
      .select("role,status")
      .eq("user_id", userData.user.id)
      .single();
    if (caller?.role !== "administrator" || caller.status !== "active") {
      return new Response(JSON.stringify({ error: "Administrator access is required." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { memberId } = await request.json();
    const { data: member, error: memberError } = await adminClient
      .from("team_members")
      .select("id,full_name,email,role,status")
      .eq("id", memberId)
      .single();
    if (memberError || !member) throw new Error("Team member not found.");
    if (member.status !== "pending") throw new Error("This team member is already active.");

    const redirectTo = Deno.env.get("SITE_URL");
    const { data: invitation, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      member.email,
      {
        data: { full_name: member.full_name, workspace_role: member.role },
        ...(redirectTo ? { redirectTo } : {}),
      },
    );
    if (inviteError) throw inviteError;

    const invitedAt = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("team_members")
      .update({ user_id: invitation.user.id, invited_at: invitedAt, updated_at: invitedAt })
      .eq("id", member.id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ invitedAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Could not send invite." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

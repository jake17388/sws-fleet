import { supabase } from "./supabase";

export type TeamRole = "administrator" | "member";
export type TeamMember = {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  role: TeamRole;
  status: "active" | "pending";
  invitedAt: string | null;
};

type TeamMemberRow = {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  role: TeamRole;
  status: "active" | "pending";
  invited_at: string | null;
};

function fromRow(row: TeamMemberRow): TeamMember {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    invitedAt: row.invited_at,
  };
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("team_members").select("*").order("full_name");
  if (error) throw new Error(error.message);
  return ((data ?? []) as TeamMemberRow[]).map(fromRow);
}

export async function addTeamMember(input: {
  name: string;
  email: string;
  role: TeamRole;
}): Promise<TeamMember> {
  if (!supabase) throw new Error("Connect this workspace before adding users.");
  const { data, error } = await supabase
    .from("team_members")
    .insert({
      full_name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The user could not be confirmed. Reload before retrying.");
  return fromRow(data as TeamMemberRow);
}

export async function sendTeamMemberInvite(memberId: string): Promise<{ invitedAt: string }> {
  if (!supabase) throw new Error("Connect this workspace before sending invitations.");
  const { data, error } = await supabase.functions.invoke("invite-team-member", {
    body: { memberId },
  });
  if (error) throw new Error(error.message);
  if (!data?.invitedAt) throw new Error("The invitation could not be confirmed. Try again.");
  return { invitedAt: data.invitedAt as string };
}

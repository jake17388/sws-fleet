import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  from: vi.fn(),
  invoke: vi.fn(),
  order: vi.fn(),
  insert: vi.fn(),
  single: vi.fn(),
}));

vi.mock("./supabase", () => ({
  supabase: {
    from: database.from,
    functions: { invoke: database.invoke },
  },
}));

import { addTeamMember, fetchTeamMembers, sendTeamMemberInvite } from "./teamPersistence";

const memberRow = {
  id: "member-1",
  user_id: null,
  full_name: "Taylor Reed",
  email: "taylor@example.com",
  role: "member" as const,
  status: "pending" as const,
  invited_at: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  database.from.mockReturnValue({
    select: vi.fn(() => ({ order: database.order })),
    insert: database.insert,
  });
  database.insert.mockReturnValue({
    select: vi.fn(() => ({ single: database.single })),
  });
});

describe("team persistence", () => {
  it("loads and maps the team directory", async () => {
    database.order.mockResolvedValue({ data: [memberRow], error: null });

    await expect(fetchTeamMembers()).resolves.toEqual([
      {
        id: "member-1",
        userId: null,
        name: "Taylor Reed",
        email: "taylor@example.com",
        role: "member",
        status: "pending",
        invitedAt: null,
      },
    ]);
  });

  it("normalizes and saves a pending member without invoking email delivery", async () => {
    database.single.mockResolvedValue({ data: memberRow, error: null });

    await addTeamMember({
      name: " Taylor Reed ",
      email: " TAYLOR@example.com ",
      role: "member",
    });

    expect(database.insert).toHaveBeenCalledWith({
      full_name: "Taylor Reed",
      email: "taylor@example.com",
      role: "member",
      status: "pending",
    });
    expect(database.invoke).not.toHaveBeenCalled();
  });

  it("invokes email delivery only through the explicit invite function", async () => {
    database.invoke.mockResolvedValue({
      data: { invitedAt: "2026-09-15T12:00:00Z" },
      error: null,
    });

    await expect(sendTeamMemberInvite("member-1")).resolves.toEqual({
      invitedAt: "2026-09-15T12:00:00Z",
    });
    expect(database.invoke).toHaveBeenCalledWith("invite-team-member", {
      body: { memberId: "member-1" },
    });
  });

  it("surfaces unconfirmed saves and invitations as errors", async () => {
    database.single.mockResolvedValue({ data: null, error: null });
    await expect(
      addTeamMember({ name: "Taylor", email: "taylor@example.com", role: "member" }),
    ).rejects.toThrow("could not be confirmed");

    database.invoke.mockResolvedValue({ data: {}, error: null });
    await expect(sendTeamMemberInvite("member-1")).rejects.toThrow("could not be confirmed");
  });
});

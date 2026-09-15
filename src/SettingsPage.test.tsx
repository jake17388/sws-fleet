import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const auth = vi.hoisted(() => ({ getUser: vi.fn(), updateUser: vi.fn() }));
const team = vi.hoisted(() => ({
  fetchTeamMembers: vi.fn(),
  addTeamMember: vi.fn(),
  sendTeamMemberInvite: vi.fn(),
}));
vi.mock("./supabase", () => ({ supabase: { auth } }));
vi.mock("./teamPersistence", () => team);
import { SettingsPage, loadCompactTables } from "./SettingsPage";
beforeEach(() => {
  localStorage.clear();
  auth.getUser.mockResolvedValue({ data: { user: { email: "jake@example.com" } }, error: null });
  team.fetchTeamMembers.mockResolvedValue([
    {
      id: "member-1",
      userId: "user-1",
      name: "Jake Banks",
      email: "jake@example.com",
      role: "administrator",
      status: "active",
      invitedAt: null,
    },
  ]);
  team.addTeamMember.mockResolvedValue({
    id: "member-2",
    userId: null,
    name: "Taylor Reed",
    email: "taylor@example.com",
    role: "member",
    status: "pending",
    invitedAt: null,
  });
  team.sendTeamMemberInvite.mockResolvedValue({ invitedAt: "2026-09-15T12:00:00Z" });
});

it("adds a pending user without emailing and sends an invite only on request", async () => {
  render(<SettingsPage compact={false} onCompactChange={vi.fn()} />);
  await screen.findByText("jake@example.com");
  fireEvent.click(screen.getByRole("button", { name: /User management/ }));
  await screen.findByText("Jake Banks");

  fireEvent.click(screen.getByRole("button", { name: "Add user" }));
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Taylor Reed" } });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "taylor@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Role"), { target: { value: "member" } });
  fireEvent.click(screen.getByRole("button", { name: "Save user" }));

  await screen.findByText("Taylor Reed");
  expect(team.addTeamMember).toHaveBeenCalledWith({
    name: "Taylor Reed",
    email: "taylor@example.com",
    role: "member",
  });
  expect(team.sendTeamMemberInvite).not.toHaveBeenCalled();
  expect(screen.getByText("Pending invite")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Send invite to Taylor Reed" }));
  await waitFor(() => expect(team.sendTeamMemberInvite).toHaveBeenCalledWith("member-2"));
  expect(await screen.findByRole("status")).toHaveTextContent("Invite sent to Taylor Reed");
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("loads the account and saves a display preference across remounts", async () => {
  const changed = vi.fn();
  render(<SettingsPage compact={false} onCompactChange={changed} />);
  expect(await screen.findByText("jake@example.com")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Preferences/ }));
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
  expect(changed).toHaveBeenCalledWith(true);
  expect(loadCompactTables()).toBe(true);
});
it("reports storage failure without applying unsaved preferences", async () => {
  const changed = vi.fn();
  render(<SettingsPage compact={false} onCompactChange={changed} />);
  await screen.findByText("jake@example.com");
  fireEvent.click(screen.getByRole("button", { name: /Preferences/ }));
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Blocked");
  });
  fireEvent.click(screen.getByRole("button", { name: "Save preferences" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Could not save preferences");
  expect(changed).not.toHaveBeenCalled();
});
it("rejects mismatched passwords and surfaces remote update errors", async () => {
  auth.updateUser.mockResolvedValue({ error: new Error("Password update rejected") });
  render(<SettingsPage compact={false} onCompactChange={vi.fn()} />);
  await screen.findByText("jake@example.com");
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "long-new-password" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "other-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(auth.updateUser).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "long-new-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("Password update rejected"),
  );
  expect(screen.queryByText("Password updated.")).not.toBeInTheDocument();
});

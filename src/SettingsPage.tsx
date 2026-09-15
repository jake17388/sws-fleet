import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import {
  addTeamMember,
  fetchTeamMembers,
  sendTeamMemberInvite,
  type TeamMember,
  type TeamRole,
} from "./teamPersistence";

const preferencesKey = "sws-fleet.compact-tables.v1";
const themeKey = "sws-fleet.theme.v1";
export type Theme = "light" | "dark";
export function loadTheme(): Theme {
  try {
    return localStorage.getItem(themeKey) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}
export function loadCompactTables(): boolean {
  try {
    return localStorage.getItem(preferencesKey) === "true";
  } catch {
    return false;
  }
}

export function SettingsPage({
  compact,
  onCompactChange,
  theme = loadTheme(),
  onThemeChange = (next) => {
    document.documentElement.dataset.theme = next;
  },
}: {
  compact: boolean;
  onCompactChange: (compact: boolean) => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}) {
  const [section, setSection] = useState("Account");
  const [email, setEmail] = useState("");
  const [accountError, setAccountError] = useState("");
  const [loading, setLoading] = useState(!!supabase);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [draftCompact, setDraftCompact] = useState(compact);
  const [draftTheme, setDraftTheme] = useState<Theme>(theme);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(!!supabase);
  const [teamError, setTeamError] = useState("");
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<TeamRole>("member");
  const [teamSaving, setTeamSaving] = useState(false);
  const [invitingId, setInvitingId] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (error) throw error;
        if (active) setEmail(data.user?.email ?? "");
      })
      .catch((error) => {
        if (active)
          setAccountError(error instanceof Error ? error.message : "Could not load your account.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    fetchTeamMembers()
      .then((loaded) => {
        if (active) setMembers(loaded);
      })
      .catch((error) => {
        if (active)
          setTeamError(error instanceof Error ? error.message : "Could not load team members.");
      })
      .finally(() => {
        if (active) setTeamLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const displayedMembers =
    !supabase && members.length === 0
      ? [
          {
            id: "local-administrator",
            userId: null,
            name: "Jake Banks",
            email: "Local preview",
            role: "administrator" as const,
            status: "active" as const,
            invitedAt: null,
          },
        ]
      : members;
  const isAdministrator =
    !!supabase &&
    email !== "" &&
    displayedMembers.some(
      (member) => member.role === "administrator" && member.email === email,
    );

  return (
    <div className="content settings-content">
      <section className="welcome">
        <div>
          <p className="eyebrow">Workspace administration</p>
          <h2>Settings</h2>
          <p>Your account, team access, and workspace preferences.</p>
        </div>
      </section>
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          {["Account", "User management", "Preferences"].map((name) => (
            <button
              key={name}
              type="button"
              aria-current={section === name ? "page" : undefined}
              onClick={() => {
                setSection(name);
                setError("");
                setMessage("");
                setPassword("");
                setConfirmation("");
              }}
            >
              {name}
              <span>
                {name === "Account"
                  ? "Profile and security"
                  : name === "User management"
                    ? "People and access"
                    : "Display and appearance"}
              </span>
            </button>
          ))}
        </nav>
        <div>
          {section === "Account" && (
            <section className="panel settings-panel">
              <h3>Account details</h3>
              <p>Your SWS Fleet administrator profile.</p>
              <dl className="settings-details">
                <div>
                  <dt>Name</dt>
                  <dd>Jake Banks</dd>
                </div>
                <div>
                  <dt>Workspace role</dt>
                  <dd>Administrator</dd>
                </div>
                <div>
                  <dt>Sign-in email</dt>
                  <dd>
                    {loading
                      ? "Loading…"
                      : email ||
                        (supabase ? "Unavailable" : "Local preview — no signed-in account")}
                  </dd>
                </div>
              </dl>
              {accountError && (
                <p className="error" role="alert">
                  Could not load account: {accountError}
                </p>
              )}
              <hr />
              <h3>Security</h3>
              {supabase ? (
                <form
                  className="detail-form settings-form"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (saving || !supabase) return;
                    setError("");
                    setMessage("");
                    if (password !== confirmation) {
                      setError("Passwords do not match.");
                      return;
                    }
                    setSaving(true);
                    try {
                      const { error } = await supabase.auth.updateUser({ password });
                      if (error) throw error;
                      setPassword("");
                      setConfirmation("");
                      setMessage("Password updated.");
                    } catch (error) {
                      setError(
                        error instanceof Error ? error.message : "Could not update password.",
                      );
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  <p>Choose a new password with at least 12 characters.</p>
                  <label>
                    New password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      required
                      value={password}
                      disabled={saving}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <label>
                    Confirm new password
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={12}
                      required
                      value={confirmation}
                      disabled={saving}
                      onChange={(event) => setConfirmation(event.target.value)}
                    />
                  </label>
                  <button className="primary" disabled={saving || loading || !!accountError}>
                    {saving ? "Updating…" : "Update password"}
                  </button>
                </form>
              ) : (
                <p>Password changes are available when you sign in to a connected workspace.</p>
              )}
            </section>
          )}
          {section === "User management" && (
            <section className="panel settings-panel">
              <div className="settings-heading-row">
                <div>
                  <h3>User management</h3>
                  <p>Keep team membership and access settings together.</p>
                </div>
                {isAdministrator && (
                  <button className="primary" type="button" onClick={() => setShowAddUser(true)}>
                    Add user
                  </button>
                )}
              </div>
              {showAddUser && (
                <form
                  className="detail-form settings-form settings-add-user"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (teamSaving) return;
                    setTeamError("");
                    setMessage("");
                    setTeamSaving(true);
                    try {
                      const added = await addTeamMember({
                        name: newUserName,
                        email: newUserEmail,
                        role: newUserRole,
                      });
                      setMembers((current) =>
                        [...current, added].sort((a, b) => a.name.localeCompare(b.name)),
                      );
                      setNewUserName("");
                      setNewUserEmail("");
                      setNewUserRole("member");
                      setShowAddUser(false);
                      setMessage(`${added.name} added. No invitation has been sent.`);
                    } catch (error) {
                      setTeamError(error instanceof Error ? error.message : "Could not add user.");
                    } finally {
                      setTeamSaving(false);
                    }
                  }}
                >
                  <h4>Add user</h4>
                  <div className="settings-user-fields">
                    <label>
                      Name
                      <input
                        required
                        value={newUserName}
                        onChange={(event) => setNewUserName(event.target.value)}
                      />
                    </label>
                    <label>
                      Email
                      <input
                        required
                        type="email"
                        value={newUserEmail}
                        onChange={(event) => setNewUserEmail(event.target.value)}
                      />
                    </label>
                    <label>
                      Role
                      <select
                        value={newUserRole}
                        onChange={(event) => setNewUserRole(event.target.value as TeamRole)}
                      >
                        <option value="member">Member</option>
                        <option value="administrator">Administrator</option>
                      </select>
                    </label>
                  </div>
                  <p>
                    Saving creates the user record only. You choose when to send their email
                    invitation.
                  </p>
                  <div className="settings-form-actions">
                    <button className="primary" disabled={teamSaving}>
                      {teamSaving ? "Saving…" : "Save user"}
                    </button>
                    <button
                      type="button"
                      disabled={teamSaving}
                      onClick={() => setShowAddUser(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              {teamLoading ? (
                <p role="status">Loading team members…</p>
              ) : (
                <div className="settings-member-list">
                  {displayedMembers.map((member) => (
                    <div className="settings-person" key={member.id}>
                      <span className="avatar" aria-hidden="true">
                        {member.name
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div>
                        <strong>{member.name}</strong>
                        <p>{member.email}</p>
                      </div>
                      <span className="count-badge">
                        {member.role === "administrator" ? "Administrator" : "Member"}
                      </span>
                      {member.status === "pending" && (
                        <div className="settings-invite-actions">
                          <span>Pending invite</span>
                          {isAdministrator && (
                            <button
                              type="button"
                              disabled={invitingId === member.id}
                              aria-label={`Send invite to ${member.name}`}
                              onClick={async () => {
                                setTeamError("");
                                setMessage("");
                                setInvitingId(member.id);
                                try {
                                  const result = await sendTeamMemberInvite(member.id);
                                  setMembers((current) =>
                                    current.map((item) =>
                                      item.id === member.id
                                        ? { ...item, invitedAt: result.invitedAt }
                                        : item,
                                    ),
                                  );
                                  setMessage(`Invite sent to ${member.name}.`);
                                } catch (error) {
                                  setTeamError(
                                    error instanceof Error
                                      ? error.message
                                      : "Could not send invitation.",
                                  );
                                } finally {
                                  setInvitingId("");
                                }
                              }}
                            >
                              {invitingId === member.id
                                ? "Sending…"
                                : member.invitedAt
                                  ? "Resend invite"
                                  : "Send invite"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {teamError && (
                <p className="error settings-feedback" role="alert">
                  {teamError}
                </p>
              )}
            </section>
          )}
          {section === "Preferences" && (
            <form
              className="panel settings-panel"
              onSubmit={(event) => {
                event.preventDefault();
                setError("");
                setMessage("");
                try {
                  localStorage.setItem(preferencesKey, String(draftCompact));
                  localStorage.setItem(themeKey, draftTheme);
                  onCompactChange(draftCompact);
                  onThemeChange(draftTheme);
                  setMessage("Preferences saved for this browser.");
                } catch {
                  setError(
                    "Could not save preferences. Check that browser storage is available and try again.",
                  );
                }
              }}
            >
              <h3>Display preferences</h3>
              <p>Preferences are saved on this browser and apply to anyone using it.</p>
              <fieldset className="theme-picker">
                <legend>Appearance</legend>
                {(["light", "dark"] as const).map((value) => (
                  <label key={value}>
                    <input
                      aria-label={value === "light" ? "Light" : "Dark"}
                      type="radio"
                      name="theme"
                      value={value}
                      checked={draftTheme === value}
                      onChange={() => setDraftTheme(value)}
                    />
                    <span>
                      <strong>{value === "light" ? "Light" : "Dark"}</strong>
                      <small>
                        {value === "light"
                          ? "Bright surfaces for daylight and office use."
                          : "Lower-glare surfaces for evenings and dark environments."}
                      </small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={draftCompact}
                  onChange={(event) => setDraftCompact(event.target.checked)}
                />
                <span>
                  <strong>Compact vehicle table</strong>
                  <small>Reduce row spacing to show more vehicles at once.</small>
                </span>
              </label>
              <button className="primary">Save preferences</button>
            </form>
          )}
          {error && (
            <p className="error settings-feedback" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="success settings-feedback" role="status">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const preferencesKey = 'sws-fleet.compact-tables.v1'
const themeKey = 'sws-fleet.theme.v1'
export type Theme = 'light' | 'dark'
export function loadTheme(): Theme {
  try { return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light' }
  catch { return 'light' }
}
export function loadCompactTables(): boolean {
  try { return localStorage.getItem(preferencesKey) === 'true' }
  catch { return false }
}

export function SettingsPage({ compact, onCompactChange, theme = loadTheme(), onThemeChange = next => { document.documentElement.dataset.theme = next } }: {
  compact: boolean
  onCompactChange: (compact: boolean) => void
  theme?: Theme
  onThemeChange?: (theme: Theme) => void
}) {
  const [section, setSection] = useState('Account')
  const [email, setEmail] = useState('')
  const [accountError, setAccountError] = useState('')
  const [loading, setLoading] = useState(!!supabase)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [draftCompact, setDraftCompact] = useState(compact)
  const [draftTheme, setDraftTheme] = useState<Theme>(theme)

  useEffect(() => {
    if (!supabase) return
    let active = true
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) throw error
      if (active) setEmail(data.user?.email ?? '')
    }).catch(error => {
      if (active) setAccountError(error instanceof Error ? error.message : 'Could not load your account.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <div className="content settings-content">
    <section className="welcome"><div><p className="eyebrow">Workspace administration</p><h2>Settings</h2><p>Your account, team access, and workspace preferences.</p></div></section>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings sections">
        {['Account', 'User management', 'Preferences'].map(name => <button key={name} type="button" aria-current={section === name ? 'page' : undefined} onClick={() => {
          setSection(name); setError(''); setMessage(''); setPassword(''); setConfirmation('')
        }}>{name}<span>{name === 'Account' ? 'Profile and security' : name === 'User management' ? 'People and access' : 'Display and appearance'}</span></button>)}
      </nav>
      <div>
        {section === 'Account' && <section className="panel settings-panel">
          <h3>Account details</h3><p>Your SWS Fleet administrator profile.</p>
          <dl className="settings-details"><div><dt>Name</dt><dd>Jake Banks</dd></div><div><dt>Workspace role</dt><dd>Administrator</dd></div><div><dt>Sign-in email</dt><dd>{loading ? 'Loading…' : email || (supabase ? 'Unavailable' : 'Local preview — no signed-in account')}</dd></div></dl>
          {accountError && <p className="error" role="alert">Could not load account: {accountError}</p>}
          <hr/><h3>Security</h3>
          {supabase ? <form className="detail-form settings-form" onSubmit={async event => {
            event.preventDefault()
            if (saving || !supabase) return
            setError(''); setMessage('')
            if (password !== confirmation) { setError('Passwords do not match.'); return }
            setSaving(true)
            try {
              const { error } = await supabase.auth.updateUser({ password })
              if (error) throw error
              setPassword(''); setConfirmation(''); setMessage('Password updated.')
            } catch (error) { setError(error instanceof Error ? error.message : 'Could not update password.') }
            finally { setSaving(false) }
          }}>
            <p>Choose a new password with at least 12 characters.</p>
            <label>New password<input type="password" autoComplete="new-password" minLength={12} required value={password} disabled={saving} onChange={event => setPassword(event.target.value)}/></label>
            <label>Confirm new password<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} disabled={saving} onChange={event => setConfirmation(event.target.value)}/></label>
            <button className="primary" disabled={saving || loading || !!accountError}>{saving ? 'Updating…' : 'Update password'}</button>
          </form> : <p>Password changes are available when you sign in to a connected workspace.</p>}
        </section>}
        {section === 'User management' && <section className="panel settings-panel">
          <h3>User management</h3><p>Keep team membership and access settings together.</p>
          <div className="settings-person"><span className="avatar" aria-hidden="true">JB</span><div><strong>Jake Banks</strong><p>Configured workspace administrator</p></div><span className="count-badge">Administrator</span></div>
          <div className="settings-note"><h4>Team administration</h4><p>Invitations, a full member directory, and role changes are not available yet. This section will house those controls once team administration is connected.</p></div>
        </section>}
        {section === 'Preferences' && <form className="panel settings-panel" onSubmit={event => {
          event.preventDefault(); setError(''); setMessage('')
          try {
            localStorage.setItem(preferencesKey, String(draftCompact))
            localStorage.setItem(themeKey, draftTheme)
            onCompactChange(draftCompact); onThemeChange(draftTheme); setMessage('Preferences saved for this browser.')
          } catch { setError('Could not save preferences. Check that browser storage is available and try again.') }
        }}>
          <h3>Display preferences</h3><p>Preferences are saved on this browser and apply to anyone using it.</p>
          <fieldset className="theme-picker"><legend>Appearance</legend>{(['light', 'dark'] as const).map(value => <label key={value}><input aria-label={value === 'light' ? 'Light' : 'Dark'} type="radio" name="theme" value={value} checked={draftTheme === value} onChange={() => setDraftTheme(value)}/><span><strong>{value === 'light' ? 'Light' : 'Dark'}</strong><small>{value === 'light' ? 'Bright surfaces for daylight and office use.' : 'Lower-glare surfaces for evenings and dark environments.'}</small></span></label>)}</fieldset>
          <label className="settings-checkbox"><input type="checkbox" checked={draftCompact} onChange={event => setDraftCompact(event.target.checked)}/><span><strong>Compact vehicle table</strong><small>Reduce row spacing to show more vehicles at once.</small></span></label>
          <button className="primary">Save preferences</button>
        </form>}
        {error && <p className="error settings-feedback" role="alert">{error}</p>}
        {message && <p className="success settings-feedback" role="status">{message}</p>}
      </div>
    </div>
  </div>
}

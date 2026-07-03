'use client';

import { useEffect, useState } from 'react';
import { Save, Loader2, UserPlus, Trash2 } from 'lucide-react';

interface BookingConfig {
  slotDurationMinutes: number;
  bookingExpiryMinutes: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}

interface SettingsResponse {
  settings: BookingConfig;
}

interface AdminsResponse {
  admins: AdminUser[];
}

interface AddAdminForm {
  email: string;
  name: string;
  password: string;
  role: string;
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [config, setConfig] = useState<BookingConfig>({
    slotDurationMinutes: 30,
    bookingExpiryMinutes: 15,
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaveError, setConfigSaveError] = useState<string | null>(null);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  const [addAdminForm, setAddAdminForm] = useState<AddAdminForm>({
    email: '',
    name: '',
    password: '',
    role: 'admin',
  });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addAdminError, setAddAdminError] = useState<string | null>(null);

  const [admins, setAdmins] = useState<AdminUser[]>([]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        setError(null);

        // Fetch booking settings
        const settingsRes = await fetch('/api/admin/settings');
        if (!settingsRes.ok) {
          throw new Error(`Failed to load settings: ${settingsRes.statusText}`);
        }
        const settingsResponse: ApiResponse<SettingsResponse> = await settingsRes.json();
        if (settingsResponse.error) {
          throw new Error(settingsResponse.error.message);
        }
        if (!settingsResponse.data?.settings) {
          throw new Error('Invalid settings response from server');
        }
        setConfig(settingsResponse.data.settings);

        // Fetch admin users list
        const adminsRes = await fetch('/api/admin/settings/admins');
        if (!adminsRes.ok) {
          throw new Error(`Failed to load admin users: ${adminsRes.statusText}`);
        }
        const adminsResponse: ApiResponse<AdminsResponse> = await adminsRes.json();
        if (adminsResponse.error) {
          throw new Error(adminsResponse.error.message);
        }
        if (!adminsResponse.data?.admins) {
          throw new Error('Invalid admins response from server');
        }
        setAdmins(adminsResponse.data.admins);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  async function handleSaveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSavingConfig(true);
    setConfigSaveError(null);
    setConfigSaveSuccess(false);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Failed to save settings: ${res.statusText}`);
      }

      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3000);
    } catch (err) {
      setConfigSaveError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSavingConfig(false);
    }
  }

  async function handleAddAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAddingAdmin(true);
    setAddAdminError(null);

    try {
      const res = await fetch('/api/admin/settings/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addAdminForm),
      });

      const newAdminResponse: ApiResponse<{ admin: AdminUser }> = await res.json();

      if (!res.ok) {
        const errorMessage =
          newAdminResponse.error?.message ?? `Failed to add admin: ${res.statusText}`;
        throw new Error(errorMessage);
      }

      if (newAdminResponse.error) {
        throw new Error(newAdminResponse.error.message);
      }
      if (!newAdminResponse.data?.admin) {
        throw new Error('Invalid admin response from server');
      }
      const newAdmin: AdminUser = newAdminResponse.data.admin;
      setAdmins((prev) => [...prev, newAdmin]);
      setAddAdminForm({ email: '', name: '', password: '', role: 'admin' });
    } catch (err) {
      setAddAdminError(err instanceof Error ? err.message : 'Failed to add admin user');
    } finally {
      setAddingAdmin(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-4 text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Booking Settings */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Booking Settings</h2>
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="slotDuration" className="block text-sm font-medium">
              Slot Duration (minutes)
            </label>
            <select
              id="slotDuration"
              value={config.slotDurationMinutes}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  slotDurationMinutes: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="bookingExpiry" className="block text-sm font-medium">
              Booking Expiry (minutes)
            </label>
            <input
              id="bookingExpiry"
              type="number"
              min={5}
              max={60}
              value={config.bookingExpiryMinutes}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  bookingExpiryMinutes: Number(e.target.value),
                }))
              }
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Between 5 and 60 minutes</p>
          </div>

          {configSaveError && <p className="text-sm text-destructive">{configSaveError}</p>}
          {configSaveSuccess && (
            <p className="text-sm text-green-600">Settings saved successfully.</p>
          )}

          <button
            type="submit"
            disabled={savingConfig}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {savingConfig ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {savingConfig ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </section>

      {/* Admin Users */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Admin Users</h2>

        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-6">No admin users found.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border mb-6">
            {admins.map((admin) => (
              <li key={admin.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{admin.name}</p>
                  <p className="text-xs text-muted-foreground">{admin.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs rounded-full bg-muted px-2 py-0.5 capitalize">
                    {admin.role}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${admin.name}`}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => setAdmins((prev) => prev.filter((a) => a.id !== admin.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h3 className="text-sm font-semibold mb-3">Add Admin User</h3>
        <form onSubmit={handleAddAdmin} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="adminName" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="adminName"
                type="text"
                required
                value={addAdminForm.name}
                onChange={(e) => setAddAdminForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Jane Smith"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="adminEmail" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="adminEmail"
                type="email"
                required
                value={addAdminForm.email}
                onChange={(e) => setAddAdminForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="jane@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="adminPassword" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="adminPassword"
              type="password"
              required
              value={addAdminForm.password}
              onChange={(e) => setAddAdminForm((prev) => ({ ...prev, password: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Minimum 8 characters"
              minLength={8}
            />
          </div>

          <input type="hidden" value={addAdminForm.role} readOnly />

          {addAdminError && <p className="text-sm text-destructive">{addAdminError}</p>}

          <button
            type="submit"
            disabled={addingAdmin}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {addingAdmin ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {addingAdmin ? 'Adding...' : 'Add Admin'}
          </button>
        </form>
      </section>
    </div>
  );
}

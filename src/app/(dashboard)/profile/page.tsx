import { getCurrentUser } from '@/lib/auth/session';
import { getOwnProfile } from '@/server/services/profile';
import { ProfileForm } from '@/components/profile/profile-form';
import { PasswordForm } from '@/components/profile/password-form';

export default async function StaffProfilePage() {
  const session = await getCurrentUser();
  const profile = session ? await getOwnProfile(session.sub) : null;
  if (!profile) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink mb-1">My Profile</h1>
        <p className="text-ink/60 text-sm">Update your name, contact details, or password.</p>
      </div>
      <ProfileForm initial={{ fullName: profile.fullName, email: profile.email, phone: profile.phone }} />
      <div>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">Change password</h2>
        <PasswordForm />
      </div>
    </div>
  );
}

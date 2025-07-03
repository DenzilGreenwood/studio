// src/app/profile/page.tsx
import { ProfileForm } from "@/components/auth/profile-form";
import { EncryptionNotice } from "@/components/encryption/encryption-notice";

// This page should ideally be protected, requiring authentication.
// Next.js middleware or client-side checks with `useAuth` can handle this.
export default function ProfilePage() {
  return (
    <div className="container max-w-2xl mx-auto py-8 space-y-6">
      <EncryptionNotice variant="card" showDetails={true} />
      <ProfileForm />
    </div>
  );
}

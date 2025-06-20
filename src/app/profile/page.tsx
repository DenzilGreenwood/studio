// src/app/profile/page.tsx
import { ProfileForm } from "@/components/auth/profile-form";

// This page should ideally be protected, requiring authentication.
// Next.js middleware or client-side checks with `useAuth` can handle this.
export default function ProfilePage() {
  return <ProfileForm />;
}

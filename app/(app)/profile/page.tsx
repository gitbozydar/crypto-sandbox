import { Suspense } from "react";
import { SectionsSkeleton } from "@/components/states";
import { Section } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { AvatarForm, PasswordForm, ProfileForm } from "./profile-forms";

// Edycja profilu: zdjęcie, imię i e-mail, hasło. Sprawy bezpieczeństwa są w /settings.
const ProfilePage = () => (
  <>
    <div>
      <h1 className="text-2xl font-semibold">Profil</h1>
      <p className="text-sm text-muted">Twoje dane widoczne w aplikacji.</p>
    </div>
    {/* Sesję czytamy w czasie żądania, więc treść musi być w <Suspense>. */}
    <Suspense fallback={<SectionsSkeleton />}>
      <Profile />
    </Suspense>
  </>
);

export default ProfilePage;

const Profile = async () => {
  const user = await getCurrentUser();
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Section title="Zdjęcie profilowe">
          <AvatarForm name={user.name} image={user.image} />
        </Section>
        <Section title="Dane">
          <ProfileForm name={user.name} email={user.email} emailVerified={user.emailVerified} />
        </Section>
      </div>
      <Section title="Hasło" description="Po zmianie hasła inne urządzenia zostaną wylogowane.">
        <PasswordForm />
      </Section>
    </div>
  );
};

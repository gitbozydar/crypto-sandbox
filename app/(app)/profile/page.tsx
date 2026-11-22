import { Page } from "@/components/page";
import { SectionsSkeleton } from "@/components/states";
import { Section } from "@/components/ui";
import { getCurrentUser } from "@/lib/session";
import { AvatarForm, PasswordForm, ProfileForm } from "./profile-forms";

// Strona edycji profilu.
const ProfilePage = () => (
  <Page title="Profil" description="Twoje dane widoczne w aplikacji." fallback={<SectionsSkeleton />}>
    <Profile />
  </Page>
);

export default ProfilePage;

// Komponent formularzy zdjęcia, danych i hasła.
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

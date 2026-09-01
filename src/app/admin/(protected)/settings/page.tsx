import { prisma } from "@/lib/prisma";
import { SettingsEditor } from "@/components/admin/settings-editor";
import { PasswordChange } from "@/components/admin/password-change";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s) => {
    map[s.key] = s.value;
  });

  return (
    <div>
      <SettingsEditor settings={map} />
      <PasswordChange />
    </div>
  );
}
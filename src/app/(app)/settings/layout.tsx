import { SettingsTabs } from "@/components/settings-tabs";
import { PageHeader } from "@/components/ui";

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <>
      <PageHeader title="Настройки" subtitle="Проект, идея и подключённые сервисы" />
      <SettingsTabs />
      {children}
    </>
  );
}

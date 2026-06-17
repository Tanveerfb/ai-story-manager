import { PageWrapper } from "@/components/layout/PageWrapper";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata = {
  title: "Settings · AI Story Manager",
};

export default function SettingsPage() {
  return (
    <PageWrapper>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your local LLM provider. Settings are stored on this device.
        </p>
      </header>
      <SettingsForm />
    </PageWrapper>
  );
}

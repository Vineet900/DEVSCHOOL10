import ProfileSettingsModule from '../components/settings/ProfileSettingsModule'

export default function SettingsPage() {
  return (
    <ProfileSettingsModule
      defaultSectionId="account"
      pageTitle="Profile & Settings"
      pageIntro="Manage your learner profile, preferences, and account controls from one dashboard."
      showBackButton
      backFallbackPath="/home"
    />
  )
}

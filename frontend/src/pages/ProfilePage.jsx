import ProfileSettingsModule from '../components/settings/ProfileSettingsModule'

export default function ProfilePage() {
  return (
    <ProfileSettingsModule
      defaultSectionId="account"
      pageTitle="Profile & Settings"
      pageIntro=""
      showBackButton
      backFallbackPath="/home"
    />
  )
}

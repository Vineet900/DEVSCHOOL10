export const legalDocs = {
  privacy: {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    summary: 'How DevSchool Pro stores learning data, profile settings, and device-level preferences.',
    sections: [
      {
        heading: 'Information We Store',
        body:
          'DevSchool Pro stores your learning progress, preferences, profile details, and avatar preview on your device so your experience stays personalized between sessions.',
      },
      {
        heading: 'How We Use Data',
        body:
          'Stored data powers features like streak tracking, XP progress, profile customization, language preference, study reminders, and local settings recovery after refresh or restart.',
      },
      {
        heading: 'Notifications',
        body:
          'Study reminders are only sent when you explicitly enable browser notifications. You can disable them anytime from Preferences.',
      },
      {
        heading: 'Third-Party Services',
        body:
          'When authentication is connected, account actions may use your configured auth provider. This page does not transmit local-only profile edits to a backend unless that backend is available and wired for it.',
      },
      {
        heading: 'Your Controls',
        body:
          'You can update your profile, reset learning progress, turn off reminders, or remove local account data from Privacy and Danger Zone controls.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    title: 'Terms of Service',
    summary: 'Guidelines for using DevSchool Pro responsibly while tracking your learning journey.',
    sections: [
      {
        heading: 'Learning Use',
        body:
          'DevSchool Pro is provided to help learners practice web development, complete lessons, and monitor progress. Use the app in a lawful and educational manner.',
      },
      {
        heading: 'Account Responsibility',
        body:
          'You are responsible for any information you enter into your profile, password forms, and support requests. Keep your credentials secure when backend authentication is enabled.',
      },
      {
        heading: 'Progress and Rewards',
        body:
          'XP, points, streaks, and future redemption systems are learning incentives. They do not represent monetary value unless a future reward program explicitly states otherwise.',
      },
      {
        heading: 'Availability',
        body:
          'Some features, such as password changes or account sync, depend on a connected authentication backend. If a backend is unavailable, the app may provide local-only placeholders or disable the action.',
      },
      {
        heading: 'Changes to These Terms',
        body:
          'As the platform evolves, these terms and related policies may be updated to reflect new features, integrations, or compliance requirements.',
      },
    ],
  },
}

export function getLegalDocBySlug(slug) {
  return Object.values(legalDocs).find((doc) => doc.slug === slug) || legalDocs.privacy
}

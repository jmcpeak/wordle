import type { Metadata } from 'next';
import { Box, Container, Link, Typography } from '@mui/material';

export const metadata: Metadata = {
  title: 'Privacy Policy - Wordle Clone',
  description: 'Privacy policy for the Wordle Clone application.',
};

export default function PrivacyPage() {
  const lastUpdated = 'February 9, 2026';

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Privacy Policy
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Last updated: {lastUpdated}
      </Typography>

      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            1. Introduction
          </Typography>
          <Typography variant="body1">
            Welcome to Wordle Clone. We respect your privacy and are committed to
            protecting your personal data. This privacy policy explains how we
            collect, use, and safeguard your information when you use our
            application.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            2. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We may collect the following types of information:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body1">
                <strong>Account Information:</strong> When you sign in, we
                collect your username and authentication details provided by
                third-party sign-in providers (such as GitHub or Google).
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Game Data:</strong> We store your game statistics,
                including games played, win/loss records, and streak data.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Preferences:</strong> We store your theme preference
                (light, dark, or system) to personalize your experience.
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                <strong>Technical Data:</strong> We may collect browser language
                preferences to provide localized content.
              </Typography>
            </li>
          </Box>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            3. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect to:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body1">
                Provide and maintain the game experience
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Track and display your game statistics
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Remember your display preferences
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Deliver content in your preferred language
              </Typography>
            </li>
          </Box>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            4. Data Storage and Security
          </Typography>
          <Typography variant="body1">
            Your data is stored securely in our database. We implement
            appropriate technical and organizational measures to protect your
            personal information against unauthorized access, alteration,
            disclosure, or destruction.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            5. Third-Party Services
          </Typography>
          <Typography variant="body1">
            We use third-party authentication providers (GitHub, Google) to
            facilitate sign-in. When you choose to sign in with a third-party
            provider, their privacy policy governs the data they collect. We only
            receive the basic profile information necessary to create and manage
            your account.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            6. Cookies and Session Data
          </Typography>
          <Typography variant="body1">
            We use session cookies to keep you signed in and to remember your
            preferences. These cookies are essential for the application to
            function properly. We do not use tracking or advertising cookies.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            7. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the right to:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body1">
                Access the personal data we hold about you
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Request correction of inaccurate data
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Request deletion of your data
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Reset your game statistics at any time
              </Typography>
            </li>
          </Box>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            8. Children&apos;s Privacy
          </Typography>
          <Typography variant="body1">
            Our application is not directed at children under the age of 13. We
            do not knowingly collect personal information from children under 13.
            If you believe we have collected data from a child under 13, please
            contact us so we can take appropriate action.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            9. Changes to This Policy
          </Typography>
          <Typography variant="body1">
            We may update this privacy policy from time to time. We will notify
            you of any changes by updating the &quot;Last updated&quot; date at
            the top of this page. We encourage you to review this policy
            periodically.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            10. Contact Us
          </Typography>
          <Typography variant="body1">
            If you have any questions about this privacy policy or our data
            practices, please reach out to us at{' '}
            <Link href="mailto:privacy@example.com">privacy@example.com</Link>.
          </Typography>
        </section>
      </Box>
    </Container>
  );
}

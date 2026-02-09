import type { Metadata } from 'next';
import { Box, Container, Link, Typography } from '@mui/material';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Terms of Service - Wordle Clone',
  description: 'Terms of service for the Wordle Clone application.',
};

export default function TermsPage() {
  const lastUpdated = 'February 9, 2026';

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Terms of Service
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Last updated: {lastUpdated}
      </Typography>

      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1">
            By accessing or using Wordle Clone, you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not
            use the application. We reserve the right to update these terms at
            any time, and your continued use of the application constitutes
            acceptance of any changes.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            2. Description of Service
          </Typography>
          <Typography variant="body1">
            Wordle Clone is a word-guessing game where players attempt to
            identify a hidden five-letter word within a limited number of
            guesses. The application may include features such as user accounts,
            game statistics tracking, theme customization, and multilingual
            support.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            3. User Accounts
          </Typography>
          <Typography variant="body1" paragraph>
            To access certain features, you may create an account using
            third-party authentication providers (such as GitHub or Google) or
            with a username and password. You agree to:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body1">
                Provide accurate and complete information during registration
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Maintain the security of your account credentials
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Accept responsibility for all activity that occurs under your
                account
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Notify us immediately of any unauthorized use of your account
              </Typography>
            </li>
          </Box>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            4. Acceptable Use
          </Typography>
          <Typography variant="body1" paragraph>
            You agree not to:
          </Typography>
          <Box component="ul" sx={{ pl: 3 }}>
            <li>
              <Typography variant="body1">
                Use automated tools, bots, or scripts to interact with the
                application
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Attempt to gain unauthorized access to the application or its
                systems
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Interfere with or disrupt the application or servers
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Exploit bugs or vulnerabilities for unfair advantage
              </Typography>
            </li>
            <li>
              <Typography variant="body1">
                Use the application for any unlawful purpose
              </Typography>
            </li>
          </Box>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            5. Intellectual Property
          </Typography>
          <Typography variant="body1">
            The application, including its design, code, graphics, and content,
            is the property of the developers and is protected by applicable
            intellectual property laws. You may not copy, modify, distribute, or
            create derivative works based on the application without prior
            written consent.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            6. Game Data and Statistics
          </Typography>
          <Typography variant="body1">
            We store your game statistics (such as games played, win/loss
            records, and streaks) to enhance your experience. You may reset your
            statistics at any time through the application. We reserve the right
            to remove or reset data as necessary for maintenance or operational
            purposes.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            7. Availability and Modifications
          </Typography>
          <Typography variant="body1">
            We strive to keep the application available at all times but do not
            guarantee uninterrupted access. We reserve the right to modify,
            suspend, or discontinue the application (or any part of it) at any
            time, with or without notice. We are not liable for any modification,
            suspension, or discontinuation of the service.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            8. Disclaimer of Warranties
          </Typography>
          <Typography variant="body1">
            The application is provided on an &quot;as is&quot; and &quot;as
            available&quot; basis without warranties of any kind, either express
            or implied. We do not warrant that the application will be
            error-free, secure, or available at any particular time or location.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            9. Limitation of Liability
          </Typography>
          <Typography variant="body1">
            To the fullest extent permitted by law, the developers of Wordle
            Clone shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising out of or related to your
            use of the application, regardless of the cause of action or the
            theory of liability.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            10. Termination
          </Typography>
          <Typography variant="body1">
            We may terminate or suspend your access to the application at our
            sole discretion, without prior notice, for conduct that we believe
            violates these Terms of Service or is harmful to other users, us, or
            third parties, or for any other reason.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            11. Privacy
          </Typography>
          <Typography variant="body1">
            Your use of the application is also governed by our{' '}
            <Link href="/privacy">Privacy Policy</Link>, which describes how we
            collect, use, and protect your personal information.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            12. Governing Law
          </Typography>
          <Typography variant="body1">
            These terms shall be governed by and construed in accordance with the
            laws of the jurisdiction in which the developers operate, without
            regard to conflict of law principles.
          </Typography>
        </section>

        <section>
          <Typography variant="h5" component="h2" gutterBottom>
            13. Contact Us
          </Typography>
          <Typography variant="body1">
            If you have any questions about these Terms of Service, please
            contact us at{' '}
            <Link href="mailto:support@example.com">support@example.com</Link>.
          </Typography>
        </section>
      </Box>
    </Container>
  );
}

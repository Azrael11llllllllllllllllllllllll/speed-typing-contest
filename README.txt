SPEED TYPING CONTEST
Open index.html for normal use. Results save in the browser.
For PHP saving: put this folder inside XAMPP/htdocs, start Apache, then open:
http://localhost/speed_typing_contest/
PHP additionally stores entries in results.json.

Password-protected Clear Results:
- Never put the clear password in JavaScript or commit it to this repository.
- For XAMPP, add `SetEnv CLEAR_RESULTS_PASSWORD "your-strong-password"` to Apache's httpd.conf, then restart Apache.
- For GitHub Pages rankings backed by Supabase, set `CLEAR_RESULTS_PASSWORD` as a Supabase Function Secret, then deploy `supabase/functions/clear-results` with the Supabase CLI.
- Set the Supabase project URL and public anon/publishable key in supabase-config.js. Do not use the service-role key in the browser.
- GitHub Pages does not run PHP; live password-protected clearing requires the Supabase Edge Function.

Features:
- On each visit, requires participants to read and agree to the contest mechanics and rules before continuing
- Grade 10 Hard Mode passage with varied vocabulary and no numbers or special symbols
- Sam speaks a random encouraging message aloud when clicked
- Downloadable offline Android APK; app results stay on that device
- Participant name
- 1, 2, 3, or 5 minute timer
- WPM, accuracy and score
- Paste or dropped text during an active typing attempt automatically fails that attempt
- 95% accuracy qualification
- Browser data saving
- Optional PHP/JSON server saving
- Printable participant certificate

Android APK:
- The latest installable APK is published at the GitHub Releases download link on the website.
- GitHub Actions builds it from the current website files after relevant changes are pushed to `main`.
- The Android app works offline and stores results on the device; it does not sync rankings with the online site.
- APKs are debug-signed for direct installation and may require allowing installs from your browser or file manager.

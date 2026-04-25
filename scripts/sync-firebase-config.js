const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..', '..');
const projectRoot = path.resolve(__dirname, '..');
const candidateGoogleServicesPaths = [
  path.join(repoRoot, 'app', 'google-services.json'),
  path.join(projectRoot, 'google-services.json'),
  path.join(projectRoot, 'android', 'app', 'google-services.json'),
];
const outputDir = path.join(__dirname, '..', 'src', 'generated');
const outputPath = path.join(outputDir, 'firebase-config.ts');
const googleServicesPath = candidateGoogleServicesPaths.find((item) => fs.existsSync(item));

if (!googleServicesPath) {
  if (fs.existsSync(outputPath)) {
    console.warn(
      [
        'No google-services.json found. Keeping existing generated Firebase config.',
        `Searched: ${candidateGoogleServicesPaths.join(', ')}`,
      ].join('\n'),
    );
    process.exit(0);
  }

  throw new Error(
    [
      'Missing Firebase config. Add one of the following files or create src/generated/firebase-config.ts:',
      ...candidateGoogleServicesPaths,
    ].join('\n'),
  );
}

const googleServices = JSON.parse(fs.readFileSync(googleServicesPath, 'utf8'));
const projectInfo = googleServices.project_info ?? {};
const client = googleServices.client?.[0] ?? {};
const oauthClients = client.oauth_client ?? [];
const apiKey = client.api_key?.[0]?.current_key ?? '';

const webOauth = oauthClients.find((item) => item.client_type === 3)?.client_id ?? '';
const androidOauth = oauthClients.find((item) => item.client_type === 1)?.client_id ?? '';

const firebaseConfig = {
  apiKey,
  authDomain: `${projectInfo.project_id}.firebaseapp.com`,
  projectId: projectInfo.project_id ?? '',
  storageBucket: projectInfo.storage_bucket ?? '',
  messagingSenderId: projectInfo.project_number ?? '',
  appId: client.client_info?.mobilesdk_app_id ?? '',
};

const content = `export const syncedFirebaseConfig = ${JSON.stringify(firebaseConfig, null, 2)} as const;

export const syncedGoogleAuthConfig = ${JSON.stringify(
  {
    webClientId: webOauth,
    androidClientId: androidOauth,
  },
  null,
  2,
)} as const;
`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, content);

console.log(`Synced Firebase config from ${googleServicesPath}`);

const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'PORT',
];

const RECOMMENDED_VARS = [
  'PAYHERE_MERCHANT_ID',
  'PAYHERE_SECRET',
  'SENDGRID_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
];

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nCopy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }

  const notConfigured = RECOMMENDED_VARS.filter(v => !process.env[v]);
  if (notConfigured.length > 0) {
    console.warn('\n⚠️  Optional features not configured (platform will work without them):');
    notConfigured.forEach(v => console.warn(`   - ${v} (${getVarDescription(v)})`));
    console.warn('');
  }

  // Validate ENCRYPTION_KEY length (must be exactly 32 chars for AES-256)
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    console.error(`❌ ENCRYPTION_KEY must be exactly 32 characters (currently ${process.env.ENCRYPTION_KEY?.length || 0})`);
    process.exit(1);
  }

  console.log('✅ Environment validated');
}

function getVarDescription(v: string): string {
  const desc: Record<string, string> = {
    PAYHERE_MERCHANT_ID: 'PayHere payments',
    PAYHERE_SECRET: 'PayHere webhook verification',
    SENDGRID_API_KEY: 'email notifications',
    CLOUDINARY_CLOUD_NAME: 'image uploads',
    STRIPE_SECRET_KEY: 'Stripe payments',
    OPENAI_API_KEY: 'AI vendor recommendations',
  };
  return desc[v] ?? 'optional feature';
}

import dotenv from 'dotenv';
import path from 'path';

const result = dotenv.config({ path: path.join(__dirname, '../.env') });
console.log('Dotenv Result:', result.error ? 'ERROR' : 'SUCCESS');
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'MISSING');
console.log('Current WorkDir:', process.cwd());
console.log('__dirname:', __dirname);

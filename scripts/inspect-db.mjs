import { createClient } from '@libsql/client/web';
import fs from 'node:fs';

const envContent = fs.readFileSync('.dev.vars', 'utf-8');
let token = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('TURSO_AUTH_TOKEN=')) token = line.split('=')[1].trim().replace(/['"]/g, '');
}

const client = createClient({
  url: 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io',
  authToken: token
});

async function run() {
  console.log('=== COLLEGES ===');
  const cols = await client.execute('SELECT * FROM colleges;');
  console.log(cols.rows);

  console.log('\n=== INSTITUTIONS ===');
  const insts = await client.execute('SELECT * FROM institutions;');
  console.log(insts.rows);

  console.log('\n=== USERS ===');
  const users = await client.execute('SELECT id, name, email, role, college_id, institution_id, institution_name FROM users;');
  console.log(users.rows);

  console.log('\n=== COURSES ===');
  const courses = await client.execute('SELECT id, code, name, college_id, institution_name FROM courses;');
  console.log(courses.rows);

  console.log('\n=== FACULTIES ===');
  const faculties = await client.execute('SELECT id, code, name, college_id, institution_name FROM faculties;');
  console.log(faculties.rows);
}

run().catch(console.error);

async function checkRequests() {
  const reqs = await client.execute('SELECT * FROM college_requests;');
  console.log('\n=== COLLEGE REQUESTS ===');
  console.log(reqs.rows);
}
checkRequests().catch(console.error);

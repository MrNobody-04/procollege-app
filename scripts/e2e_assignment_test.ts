import { createClient } from '@libsql/client';

const DEFAULT_TURSO_URL = 'libsql://procollege-app-mrnobody-04.aws-ap-south-1.turso.io';
const DEFAULT_TURSO_AUTH_TOKEN =
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTQ1MDUyOTYsImlkIjoiMDFhMWQwZDktMzAwMS03OTk2LWI4ZjQtOGRmYTcxNzBkODM4Iiwia2lkIjoieTgwbkYzLU5YWlhpZENKRVgwdTVZbTNMZEhwSmZYUEJCYWkzNHRXY3A1OCIsInJpZCI6IjdhMzNmOWFlLWI3ZGEtNDM3Ni1hM2IwLTRkOTY4MDBkZDJkNCJ9.CLJY0HpjsEaSGVV3WejPoLCxiK0oxai8lZmlqPFHlVNDJzaZLh_Cmlv2JIYICZYMiaKgJfV7ylGrzAjcIUyQCg';

async function main() {
  const db = createClient({
    url: DEFAULT_TURSO_URL,
    authToken: DEFAULT_TURSO_AUTH_TOKEN,
  });

  console.log('=== E2E VERIFICATION TEST ===\n');

  // 1. Verify organization & users
  console.log('1. Checking organization & users...');
  const users = await db.execute("SELECT id, name, email, role, college_id, institution_name FROM users WHERE college_id LIKE '%public%';");
  console.log('Users in PUBLIC ENGLISH BOARDING SCHOOL:', users.rows);

  const lecturer = users.rows.find(u => u.role === 'lecturer');
  const student = users.rows.find(u => u.role === 'student');

  if (!lecturer || !student) {
    throw new Error('Lecturer or Student not found!');
  }
  console.log(`Lecturer: ${lecturer.name} (${lecturer.id})`);
  console.log(`Student: ${student.name} (${student.id})`);

  // 2. Check course & enrollment
  console.log('\n2. Checking courses & student enrollment...');
  const courses = await db.execute("SELECT id, code, name, member_count, enrolled_students FROM courses WHERE college_id LIKE '%public%';");
  for (const c of courses.rows) {
    const enrolled = JSON.parse(String(c.enrolled_students || '[]'));
    const isStudentEnrolled = enrolled.some((s: any) => s.id === student.id || s.email === student.email);
    console.log(`Course ${c.name} (${c.code}): ${enrolled.length} enrolled. Student enrolled: ${isStudentEnrolled}`);
  }

  // 3. Create Assignment as Lecturer
  console.log('\n3. Creating assignment as Lecturer...');
  const asgnId = `asgn_live_${Date.now()}`;
  const targetCourse = courses.rows[0];
  const refFile = {
    id: `ref_${Date.now()}`,
    name: 'Class10_English_Poetry_Analysis.pdf',
    size: '1.5 MB',
    type: 'pdf',
    url: 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0gL0NvbnRlbnRzIDQgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggMTIgPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKMDAwMDAwMDIxOSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDUgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjI4MQolJUVPRgo='
  };

  await db.execute({
    sql: `INSERT OR REPLACE INTO assignments (
            id, college_id, institution_name, faculty_id, course_id, course_code,
            section_id, channel_id, subject_name, title, description, instructions,
            due_at, due_timestamp, close_at, is_strict_no_late, max_points, rubric,
            created_by, created_by_email, reference_files
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    args: [
      asgnId,
      lecturer.college_id,
      lecturer.institution_name,
      'fac_school_10',
      targetCourse.id,
      targetCourse.code,
      null,
      'ch_course_1794716511247_sub_1',
      'English [ENG-101]',
      'English Unit 2: The Chimney Sweeper Analysis',
      'Detailed analytical essay on William Blake poems.',
      'Submit your analysis in PDF format with proper citations before deadline.',
      'Nov 30, 2026, 11:59 PM',
      Date.now() + 14 * 86400000,
      'Nov 30, 2026, 11:59 PM',
      1,
      100,
      JSON.stringify([
        { id: 'crit_1', criterion: 'Thematic Depth', maxPoints: 50 },
        { id: 'crit_2', criterion: 'Grammar and Structure', maxPoints: 50 }
      ]),
      lecturer.id,
      lecturer.email,
      JSON.stringify([refFile])
    ]
  });
  console.log(`Assignment created successfully: ${asgnId}`);

  // 4. Simulate Refresh (Bootstrap query)
  console.log('\n4. Simulating Site Refresh: Bootstrap query for assignments...');
  const bootstrapAsgns = await db.execute({
    sql: `SELECT * FROM assignments 
          WHERE institution_name = ? 
             OR college_id = ? 
             OR LOWER(institution_name) = LOWER(?)
             OR course_id IN (
                SELECT id FROM courses 
                WHERE institution_name = ? OR college_id = ? OR LOWER(institution_name) = LOWER(?)
             )
          ORDER BY created_at DESC;`,
    args: [lecturer.institution_name, lecturer.college_id, lecturer.institution_name, lecturer.institution_name, lecturer.college_id, lecturer.institution_name]
  });
  console.log(`Assignments retrieved after refresh: ${bootstrapAsgns.rows.length}`);
  const retrievedAsgn = bootstrapAsgns.rows.find(a => a.id === asgnId);
  if (!retrievedAsgn) {
    throw new Error('Assignment was lost after refresh!');
  }
  console.log('Assignment persisted on refresh! Title:', retrievedAsgn.title);
  const parsedRefs = JSON.parse(String(retrievedAsgn.reference_files || '[]'));
  console.log(`Reference files retained: ${parsedRefs.length} (${parsedRefs[0]?.name})`);

  // 5. Student Submission
  console.log('\n5. Simulating Student Submission...');
  const subId = `sub_${asgnId}_${student.id}`;
  const studentFile = {
    name: 'Shreejal_Chimney_Sweeper_Essay.docx',
    size: '1.9 MB',
    type: 'doc',
    isReadOnly: true,
    uploadedAt: 'Just now',
    url: 'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,UEsDBBQAAAAIA...'
  };

  await db.execute({
    sql: `INSERT OR REPLACE INTO assignment_submissions (
            id, assignment_id, student_id, student_name, status,
            submission_text, file_name, file_size, files, submitted_at
          ) VALUES (?, ?, ?, ?, 'turned-in', ?, ?, ?, ?, ?);`,
    args: [
      subId,
      asgnId,
      student.id,
      student.name,
      `Turned in by ${student.name}`,
      studentFile.name,
      studentFile.size,
      JSON.stringify([studentFile]),
      new Date().toISOString()
    ]
  });
  console.log(`Submission recorded: ${subId}`);

  // 6. Verify Submission Persisted on Refresh
  console.log('\n6. Checking submissions after refresh...');
  const subQuery = await db.execute({
    sql: 'SELECT * FROM assignment_submissions WHERE assignment_id = ?;',
    args: [asgnId]
  });
  console.log(`Submissions found: ${subQuery.rows.length}`);
  const s = subQuery.rows[0];
  console.log(`Status: ${s.status}, Student: ${s.student_name}, File: ${s.file_name}`);
  const sFiles = JSON.parse(String(s.files || '[]'));
  console.log(`Files count: ${sFiles.length}, Filename: ${sFiles[0]?.name}, URL preserved: ${Boolean(sFiles[0]?.url)}`);

  console.log('\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===');
}

main().catch(console.error);

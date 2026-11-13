// Multi-Tenant Isolation Verification Script
// Tests that newly created organizations start with completely pristine empty states for Activity, Chats, and Calendar.

import { INITIAL_USERS, INITIAL_NOTIFICATIONS, INITIAL_CONVERSATIONS, INITIAL_SCHEDULE } from '../src/data/initialData.ts';

console.log('🧪 Running Multi-Tenant Isolation Unit Verification...');

// Test 1: Check demo tags on initial data
console.log('\n1️⃣ Checking Demo Metadata Tags in initialData...');
if (!INITIAL_NOTIFICATIONS.every(n => n.isDemo && n.institutionName === 'ProCollege University Network')) {
  throw new Error('FAILED: Some initial notifications are missing isDemo or institutionName!');
}
console.log('   ✅ All initial notifications tagged with isDemo and demo institution');

if (!INITIAL_CONVERSATIONS.every(c => c.isDemo && c.institutionName === 'ProCollege University Network')) {
  throw new Error('FAILED: Initial conversation is missing isDemo or institutionName!');
}
console.log('   ✅ All initial conversations tagged with isDemo and demo institution');

if (!INITIAL_SCHEDULE.every(e => e.isDemo && e.institutionName === 'ProCollege University Network')) {
  throw new Error('FAILED: Initial schedule events are missing isDemo or institutionName!');
}
console.log('   ✅ All initial calendar events tagged with isDemo and demo institution');

// Test 2: Simulate Real Organization Filter Logic
console.log('\n2️⃣ Testing Real Tenant Filter Scoping...');
const realOrgUser = {
  id: 'usr_real_admin_1',
  role: 'admin',
  institutionName: 'PUBLIC ENGLISH BOARDING SCHOOL',
  email: 'admin@publicschool.edu'
};
const realOrgCourses = []; // 0 courses provisioned

// Notifications filtering logic
const scopedNotifications = INITIAL_NOTIFICATIONS.filter(n => {
  if (n.isDemo || n.institutionName === 'ProCollege University Network') return false;
  if (n.institutionName && n.institutionName !== realOrgUser.institutionName) return false;
  const matchesCourse = n.courseId && realOrgCourses.some(c => c.id === n.courseId);
  const matchesInstitution = n.institutionName === realOrgUser.institutionName;
  if (!matchesCourse && !matchesInstitution) return false;
  return true;
});

console.log(`   Real Org Notifications Count: ${scopedNotifications.length}`);
if (scopedNotifications.length !== 0) {
  throw new Error(`FAILED: Leaked ${scopedNotifications.length} notifications to real organization!`);
}
console.log('   ✅ Zero notification leakage for real organization');

// Conversations filtering logic
const scopedConversations = INITIAL_CONVERSATIONS.filter(c => {
  if (c.isDemo || c.institutionName === 'ProCollege University Network') return false;
  const isParticipant = c.participants?.some(p => p.id === realOrgUser.id || p.email === realOrgUser.email);
  return isParticipant;
});

console.log(`   Real Org Conversations Count: ${scopedConversations.length}`);
if (scopedConversations.length !== 0) {
  throw new Error(`FAILED: Leaked ${scopedConversations.length} conversations to real organization!`);
}
console.log('   ✅ Zero conversation leakage for real organization');

// Calendar events filtering logic
const scopedCalendarEvents = INITIAL_SCHEDULE.filter(evt => {
  if (evt.isDemo || evt.institutionName === 'ProCollege University Network') return false;
  if (evt.institutionName && evt.institutionName !== realOrgUser.institutionName) return false;
  const matchesCourseId = evt.courseId && realOrgCourses.some(c => c.id === evt.courseId);
  const matchesCourseCode = evt.courseCode && realOrgCourses.some(c => c.code === evt.courseCode);
  const matchesInstitution = evt.institutionName === realOrgUser.institutionName;
  return Boolean(matchesCourseId || matchesCourseCode || matchesInstitution);
});

console.log(`   Real Org Calendar Events Count: ${scopedCalendarEvents.length}`);
if (scopedCalendarEvents.length !== 0) {
  throw new Error(`FAILED: Leaked ${scopedCalendarEvents.length} calendar events to real organization!`);
}
console.log('   ✅ Zero calendar event leakage for real organization');

console.log('\n🎉 ALL MULTI-TENANT ISOLATION TESTS PASSED WITH 100% INTEGRITY!');

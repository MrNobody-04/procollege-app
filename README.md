# ProCollege | Campus Collaboration Platform (Teams for Education)

**ProCollege** is a high-performance web collaboration and classroom application modeled on the modern **Microsoft Teams 2.0 / Teams for Education** architecture, reverse-engineered using REA (Reverse Engineer Anything).

---

## 🏗️ Architecture & REA Reverse Engineering Analysis

Our analysis of the Microsoft Teams web client revealed a four-pillar modern architecture:

1. **User Interface Layer (Fluent UI & React)**:
   - Built on React 19 and Microsoft's Fluent UI design tokens.
   - Employs dark navigation rails (`#201f1e`), brand accents (`#5b5fc7`), responsive multi-pane layout, and WCAG-compliant accessible components.

2. **Client Data Layer & Off-Thread Caching**:
   - Isolates UI rendering from heavy chat payloads and state mutations using an Apollo GraphQL and background caching model.
   - Local state persists across sessions in `localStorage` / IndexedDB (`procollege_posts`, `procollege_dms`, `procollege_assignments`).

3. **Real-Time Signaling & Presence**:
   - Emulates persistent real-time event streaming for chat messages, channel posts, threaded replies, emoji reactions, and live presence status indicators (`Available`, `Busy in Lecture`, `Away`, `In Call`).

4. **WebRTC Media & Virtual Classrooms**:
   - Low-latency virtual classroom conferencing with WebRTC HD video streaming, screen sharing (presentations/code editor), mute/camera toggles, raised hand queue, animated floating emoji reactions, and in-meeting live chat.

---

## ✨ Features

- **Class & Channel Hierarchies**:
  - Organized by Course Code (`CS 301`, `DS 204`, `PHYS 210`, `ENGR 400`) with dedicated channels (`General`, `Announcements`, `Weekly Lectures`, `Final Project`, `Helpdesk`).
- **Threaded Channel Posts**:
  - Full Microsoft Teams discussion model with root post, announcement banners with colored headers, markdown formatting, attachment download cards, reaction pills (`👍`, `❤️`, `👏`, `🎉`, `💡`, `🚀`), and nested replies.
- **Direct & Group Chats**:
  - 1:1 and group chat streams with presence indicators, typing feedback, and direct call triggers.
- **Assignment & Gradebook Lifecycle**:
  - **Student View**: View assignment instructions, points, rubrics, and submit solutions with "Turn In" action.
  - **Instructor View**: Review submissions, assign grades, and provide feedback directly stored in the course ledger.
- **Academic Timetable & Calendar**:
  - Interactive 5-day week calendar with lecture rooms, office hours, and one-click "Join Class" buttons.
- **Course Files & Cloud Materials**:
  - Central repository for lecture slides, course syllabi, lab manuals, and readings.
- **Activity & Notification Feed**:
  - Direct alert center for `@mentions`, assignments due, class announcements, and meeting starts.
- **Perspective Switcher**:
  - Instant toggle between **Prof. Alan Turing** (Instructor) and **Alex Johnson** (Student) to experience both viewpoints.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `^22.x`, `^24.x`, or `>=26.x`
- npm `10+` or `11+`

### Installation & Run

```bash
cd procollege-app
npm install
npm run dev
```

The application will start locally at:
👉 **`http://localhost:5173`**

### Production Build

```bash
npm run build
npm run preview
```

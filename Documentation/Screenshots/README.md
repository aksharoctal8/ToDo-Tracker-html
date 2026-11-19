# TaskFlow Screenshot Collection

**Project Name:** TaskFlow - Smart Task Planning & Productivity Tracking  
**Project Type:** Web-based Task Management System  
**Backend:** Node.js + Express.js  
**Database:** MongoDB + Mongoose  
**Authentication:** JWT + bcrypt  
**Frontend:** EJS + HTML + CSS + JavaScript

Screenshots were captured from the running application using synthetic demo accounts and task/project/company data in a uniquely named temporary database. That database was isolated from the configured application database and removed after capture. No production or existing user data was used.

| No. | Screenshot | Feature | Purpose | Device | Status |
|-----|------------|---------|---------|--------|--------|
| 01 | 01_Home_Page.png | Home page | Landing page sections, navigation, features, services, themes, and call to action | Desktop | Done |
| 02 | 02_Login_Page.png | Login | Sign-in form | Desktop | Done |
| 03 | 03_Register_Page.png | Registration | New account form | Desktop | Done |
| 04 | 04_Dashboard.png | Dashboard | Live task/project statistics, productivity, recent work, and project progress | Desktop | Done |
| 05 | 05_My_Tasks.png | Task management | Task list with varied statuses, categories, priorities, and due dates | Desktop | Done |
| 06 | 06_Add_Task.png | Add task | Create-task modal with description, project, assignee, priority, category, date, and tags | Desktop | Done |
| 07 | 07_Task_Details.png | Task details | Status, priority, due date, project, assignee, category, and tags | Desktop | Done |
| 08 | 08_Edit_Task.png | Edit task | Existing task in the edit modal | Desktop | Done |
| 09 | 09_Task_Search_Filter.png | Search and filters | Search, status, priority, and due-date filters in use | Desktop | Done |
| 10 | 10_Task_Completed.png | Completed task | Completed task state and completion controls | Desktop | Done |
| 11 | 11_Task_Overdue.png | Overdue task | Overdue task state and due-date filter | Desktop | Done |
| 12 | 12_Projects.png | Projects | Project cards, status, progress, and task counts | Desktop | Done |
| 13 | 13_Add_Project.png | Add project | Project creation form with dates, status, and member selection | Desktop | Done |
| 14 | 14_Project_Details.png | Project details | Existing project fields in the edit/details modal | Desktop | Done |
| 15 | 15_Analytics.png | Analytics | Status, priority, weekly productivity, overdue, and project charts/statistics | Desktop | Done |
| 16 | 16_Notifications.png | Notifications | Current notifications page state | Desktop | Done |
| 17 | 17_Profile.png | Profile | Profile/account information and editable profile/password forms | Desktop | Done |
| 18 | 18_Settings.png | Settings | Theme and notification preference controls | Desktop | Done |
| 19 | 19_Validation_Error.png | Validation | Empty-title task preview validation message | Desktop | Done |
| 20 | 20_Mobile_Responsive.png | Mobile dashboard | Dashboard at 390 x 844 viewport | Mobile | Done |
| 21 | 21_Company_Registration.png | Company registration | Company setup form with synthetic sample details | Desktop | Done |
| 22 | 22_Company_Dashboard.png | Company dashboard | Company profile, teams, member count, and task statistics | Desktop | Done |
| 23 | 23_Teams.png | Teams | Company team list and team leaders | Desktop | Done |
| 24 | 24_Team_Creation.png | Team creation | New team form with sample development team details | Desktop | Done |
| 25 | 25_Team_Details.png | Team details/members | Team summary, successful member addition, and member role | Desktop | Done |
| 26 | 26_Company_Members.png | Company members | Company membership list and roles | Desktop | Done |
| 27 | 27_Dark_Mode.png | Dark mode | Workspace using the dark theme | Desktop | Done |
| 28 | 28_Profile_Update.png | Profile update | Successful profile update state | Desktop | Done |
| 29 | 29_Password_Change.png | Password change | Password-change form with all password fields left blank | Desktop | Done |
| 30 | 30_Mobile_Tasks.png | Mobile tasks | Task list and filters at a narrow mobile viewport | Mobile | Done |
| 31 | 31_Logout.png | Logout | Post-logout sign-in screen | Desktop | Done |
| 32 | 32_Invalid_Login.png | Invalid login | Safe invalid-credentials response | Desktop | Done |
| 33 | 33_Mobile_Navigation.png | Mobile navigation | Dashboard with the responsive navigation drawer open | Mobile | Done |
| 34 | 34_Password_Change_Success.png | Password change result | Successful password change with no password values displayed | Desktop | Done |

## Capture notes and current limitations

- Screenshots 01-20 cover the requested core collection. Screenshots 21-34 document additional company/team, theme, profile, mobile, logout, invalid-login, and password-change screens.
- The application has no standalone project details page; screenshot 14 therefore shows the existing project edit/details modal, not a separate detail route.
- Notifications currently have no persisted entries, so screenshot 16 shows the actual empty notifications page rather than fabricated notifications.
- Company/team pages currently do not link existing task CRUD records to a company or team. Accordingly, the company task statistics are zero, and the team details page has no team task dashboard or task list.
- Team membership is added directly for an existing user by email; no email delivery or accept-invitation workflow is configured.
- The team cards in screenshot 23 have a pre-existing layout overlap, and the mobile task list in screenshot 30 shows horizontal overflow. Application files were intentionally not changed for this documentation-only task.
- The unauthenticated landing route redirected to login during capture. Screenshot 01 was captured from the landing page while signed in; this route behavior was not changed.

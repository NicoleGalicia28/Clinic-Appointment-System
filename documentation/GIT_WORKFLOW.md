# Git Workflow — 3 Members

Repo: https://github.com/NicoleGalicia28/Clinic-Appointment-System.git

Rule the rubric checks for: "meaningful commit history from ALL members. A single
'final commit' dump is not acceptable." So each member commits their OWN work,
in SEVERAL small commits, under their OWN GitHub account/git identity.

---

## MEMBER 1 — pushes the initial project first

Member 1 sets the baseline everyone else builds on: folder structure, docker-compose,
root README, .gitignore, and the Booking Service.

```bash
# 1. Clone the empty repo
git clone https://github.com/NicoleGalicia28/Clinic-Appointment-System.git
cd Clinic-Appointment-System

# 2. Set your git identity (so commits are attributed to you, not the repo owner)
git config user.name "Your Full Name"
git config user.email "your.github.email@example.com"

# 3. Copy in the project files (from the zip Claude generated), replacing this
#    empty cloned folder's contents with the full project structure.

# 4. Commit in stages — NOT one giant dump. Example:
git add .gitignore docker-compose.yml README.md
git commit -m "Add project scaffolding: gitignore, docker-compose, README"

git add booking-service/package.json booking-service/.env.example
git commit -m "Add booking-service dependencies and env template"

git add booking-service/src/config booking-service/src/models
git commit -m "Add booking-service DB config and appointment model"

git add booking-service/src/controllers booking-service/src/routes booking-service/src/middleware booking-service/src/utils
git commit -m "Implement booking-service REST endpoints, JWT middleware, validation"

git add booking-service/src/index.js
git commit -m "Wire up booking-service Express app and RabbitMQ producer"

# 5. Push to main
git push -u origin main
```

---

## MEMBER 2 — Patient Service (branch + Pull Request)

```bash
# 1. Clone (or if already cloned, just pull latest)
git clone https://github.com/NicoleGalicia28/Clinic-Appointment-System.git
cd Clinic-Appointment-System
git config user.name "Your Full Name"
git config user.email "your.github.email@example.com"

# 2. Make sure you're up to date with Member 1's work
git checkout main
git pull origin main

# 3. Create your own branch — never commit directly to main after Member 1's baseline
git checkout -b feature/patient-service

# 4. Copy in the patient-service files, then commit in stages as you build:
git add patient-service/package.json patient-service/.env.example
git commit -m "Add patient-service dependencies and env template"

git add patient-service/src/config
git commit -m "Add patient-service MySQL and RabbitMQ config"

git add patient-service/src/models
git commit -m "Add patient model with bcrypt password hashing"

git add patient-service/src/controllers patient-service/src/routes patient-service/src/middleware patient-service/src/utils
git commit -m "Implement patient-service register/login/CRUD endpoints with JWT"

git add patient-service/src/index.js
git commit -m "Wire up patient-service Express app"

# 5. Push your branch
git push -u origin feature/patient-service

# 6. On GitHub: open a Pull Request from feature/patient-service into main,
#    then merge it (after teammates review, if your instructor requires review).

# 7. After merging, sync back to main locally
git checkout main
git pull origin main
```

---

## MEMBER 3 — Reminder Service (branch + Pull Request)

Same pattern as Member 2, on their own branch:

```bash
git clone https://github.com/NicoleGalicia28/Clinic-Appointment-System.git
cd Clinic-Appointment-System
git config user.name "Your Full Name"
git config user.email "your.github.email@example.com"

git checkout main
git pull origin main
git checkout -b feature/reminder-service

git add reminder-service/package.json reminder-service/.env.example
git commit -m "Add reminder-service dependencies and env template"

git add reminder-service/src/config reminder-service/src/models
git commit -m "Add MongoDB connection and Reminder schema"

git add reminder-service/src/utils
git commit -m "Add simulated SMS sending with failure rate"

git add reminder-service/src/consumers
git commit -m "Implement appointment.created and patient.updated consumers with conflict handling"

git add reminder-service/src/index.js
git commit -m "Wire up reminder-service Express app and start both consumers"

git push -u origin feature/reminder-service
# Then open a Pull Request into main on GitHub and merge.

git checkout main
git pull origin main
```

---

## Ongoing rules for all members

- **Never `git push --force` to main.**
- Pull before you start work each session: `git pull origin main`.
- Commit often, with messages that describe WHAT changed, not "update" or "fix".
- Frontend, documentation, diagrams, and the Postman collection can be split up the
  same way — each member creates a branch, commits their part, opens a PR.
- Before the deadline, everyone runs `git log --oneline --author="Your Name"` to
  confirm their own commits are actually in the repo — this is what the instructor
  checks for the "Documentation & Professionalism" and individual-accountability grading.

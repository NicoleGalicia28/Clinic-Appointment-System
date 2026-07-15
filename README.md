# Clinic Appointment System

Final Integration Project — System Integration and Architecture (PC 24)

A three-service system: **Booking Service**, **Patient Service**, and **Reminder Service**,
communicating via REST APIs (sync) and RabbitMQ (async), backed by MySQL and MongoDB.

## Architecture

```
[ frontend / Postman ]
        |
        |-- JWT login -----------------> Patient Service (MySQL: clinic_patients)
        |                                     |
        |                                     | publishes "patient.updated"
        |                                     v
        |-- book appointment (JWT) ---> Booking Service (MySQL: clinic_booking)
                                              |
                                              | publishes "appointment.created"
                                              v
                                        RabbitMQ
                                              |
                                              v
                                        Reminder Service (MongoDB: clinic_reminders)
                                        - consumes both queues
                                        - simulates SMS sending
                                        - caches patient contact, handles sync conflicts
```

## Services

| Service | Owner | Port | Store | Role |
|---|---|---|---|---|
| booking-service | Member 1 | 4001 | MySQL (clinic_booking) | Appointment CRUD, publishes appointment.created |
| patient-service | Member 2 | 4002 | MySQL (clinic_patients) | Patient CRUD, JWT login/issuing, publishes patient.updated |
| reminder-service | Member 3 | 4003 | MongoDB (clinic_reminders) | Consumes both queues, simulated SMS, contact-cache sync |

## Prerequisites

- Node.js 18+
- Docker (for MySQL, MongoDB, RabbitMQ) — or install those locally

## Quick start

```bash
# 1. start infrastructure
docker compose up -d

# 2. for EACH service (booking-service, patient-service, reminder-service):
cd booking-service
cp .env.example .env    # then edit values if needed
npm install
npm start
```

Repeat for `patient-service` and `reminder-service` in separate terminals.

Then open `frontend/index.html` in a browser (or use the Postman collection in
`documentation/`) to try the full flow: login -> book appointment -> check reminders.

**Important:** `JWT_SECRET` in `booking-service/.env` and `patient-service/.env` must be
the EXACT SAME value — Patient Service issues the token, Booking Service verifies it.

## Health checks

- http://localhost:4001/health
- http://localhost:4002/health
- http://localhost:4003/health
- RabbitMQ management UI: http://localhost:15672 (guest/guest)

## Integration Patterns

This system uses two formal integration patterns:

### 1. Publish-Subscribe (RabbitMQ)
Booking Service and Patient Service **publish** events to RabbitMQ queues (`appointment.created`, `patient.updated`). Reminder Service **subscribes** to both queues as an independent consumer.

**Why:** Decouples producers from consumers. If Reminder Service is down, messages persist in durable queues. New consumers can be added without modifying producers. Provides reliability and scalability.

### 2. Point-to-Point (REST APIs)
Clients communicate synchronously with each service via REST (e.g., `POST /api/appointments`, `GET /api/patients/:id`).

**Why:** Clients need immediate responses (201 Created, 400 Bad Request) to confirm success or failure. REST provides synchronous request-response for user-facing operations.

### Why not only one pattern?
- **REST alone** cannot handle background processing (SMS delivery, cache sync) without blocking the client.
- **Messaging alone** cannot provide immediate feedback to the client about operation success/failure.
- **Combined:** REST for synchronous user operations + Publish-Subscribe for asynchronous background workflows.

## Data Synchronization

Patient contact data is synchronized from MySQL (Patient Service) to MongoDB (Reminder Service) via the `patient.updated` queue:
- **Stale event detection:** If a reminder's `lastSyncedAt` is newer than the incoming event's `updatedAt`, the event is skipped.
- **Post-send conflict:** If contact info changed after an SMS was already sent, the reminder is flagged `contactStale = true`.
- **Graceful degradation:** If RabbitMQ is unavailable, both Booking and Patient services continue operating normally — only background sync/reminder is temporarily unavailable.

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture Diagrams](documentation/ARCHITECTURE.md) | System integration diagram, message-flow diagram, integration pattern justification |
| [API Documentation](documentation/API_DOCUMENTATION.md) | Every endpoint: method, URI, request body, sample response, status codes, auth |
| [Postman Collection](documentation/Clinic-Appointment-System.postman_collection.json) | Complete test collection with success and failure cases |
| [Member Assignments](documentation/MEMBER_ASSIGNMENTS.md) | Team member roles and folder ownership |
| [Git Workflow](documentation/GIT_WORKFLOW.md) | Branching strategy and commit conventions |

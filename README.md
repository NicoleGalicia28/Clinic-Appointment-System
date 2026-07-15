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

## Documentation

See `/documentation` for API docs, architecture diagrams, security design,
data-sync design, Postman collection, and the Member Contribution Matrix.

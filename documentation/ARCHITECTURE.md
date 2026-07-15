# Architecture & System Integration Diagrams

## 1. System Integration Diagram

This diagram shows how all components connect at the infrastructure level.

```mermaid
graph TB
    subgraph Clients
        FE[Frontend HTML]
        PM[Postman Collection]
    end

    subgraph "Microservices"
        PS[Patient Service<br/>Port 4002<br/>MySQL: clinic_patients]
        BS[Booking Service<br/>Port 4001<br/>MySQL: clinic_booking]
        RS[Reminder Service<br/>Port 4003<br/>MongoDB: clinic_reminders]
    end

    subgraph "Message Broker"
        RMQ[(RabbitMQ<br/>Port 5672<br/>Management: 15672)]
    end

    subgraph "Data Stores"
        MYSQL1[(MySQL<br/>clinic_patients)]
        MYSQL2[(MySQL<br/>clinic_booking)]
        MONGO[(MongoDB<br/>clinic_reminders)]
    end

    FE -->|REST: login, register, profile CRUD| PS
    FE -->|REST: book, view, cancel appointment| BS
    FE -->|REST: view reminders| RS
    PM -->|REST: all endpoints| PS
    PM -->|REST: all endpoints| BS
    PM -->|REST: all endpoints| RS

    PS --- MYSQL1
    BS --- MYSQL2
    RS --- MONGO

    PS -->|publish: patient.updated| RMQ
    BS -->|publish: appointment.created| RMQ
    RMQ -->|consume: patient.updated| RS
    RMQ -->|consume: appointment.created| RS
```

## 2. Architecture + Message-Flow Diagram

This diagram traces the two key asynchronous workflows and identifies the integration patterns used.

```mermaid
sequenceDiagram
    autonumber
    participant Client as Client (Postman / Frontend)
    participant PS as Patient Service
    participant BS as Booking Service
    participant RMQ as RabbitMQ
    participant RS as Reminder Service

    Note over Client,RS: Workflow 1 — Patient Update → Cache Sync

    Client->>PS: PUT /api/patients/:id (JWT)
    PS->>PS: Validate JWT + authorize owner
    PS->>PS: UPDATE patients SET ...
    PS-->>RMQ: publish("patient.updated", {patientId, name, phone})
    RMQ-->>RS: deliver message
    RS->>RS: validate payload
    RS->>RS: find all reminders for patientId
    RS->>RS: skip stale events (updatedAt <= lastSyncedAt)
    RS->>RS: update patientName, patientContactCache
    RS->>RS: flag contactStale if contact changed after SMS sent
    RS-->>RS: ack message

    Note over Client,RS: Workflow 2 — Book Appointment → SMS Reminder

    Client->>BS: POST /api/appointments (JWT)
    BS->>BS: Validate JWT + input
    BS->>BS: INSERT INTO appointments ...
    BS-->>RMQ: publish("appointment.created", {appointmentId, patient...})
    RMQ-->>RS: deliver message
    RS->>RS: validate payload
    RS->>RS: upsert Reminder in MongoDB
    loop Retry up to 3 times
        RS->>RS: sendSms() — simulated (85% success rate)
    end
    alt SMS succeeded
        RS->>RS: status = "sent"
    else SMS failed after retries
        RS->>RS: status = "failed"
    end
    RS-->>RS: ack message
```

## 3. Integration Patterns Used

### Pattern 1: Publish-Subscribe (via RabbitMQ)

**Where:** Both `booking-service` and `patient-service` publish events to RabbitMQ queues (`appointment.created` and `patient.updated`). `reminder-service` subscribes to both queues as a consumer.

**Why this pattern:** Publish-Subscribe decouples the producers from the consumer. The booking and patient services do not know (or need to know) that the reminder service exists. If the reminder service is down, messages are persisted in the durable queue and delivered when it comes back online. This also allows adding new consumers (e.g., an analytics service) without modifying the producers.

**Defense:** A Point-to-Point pattern (direct REST call from booking-service to reminder-service) would create tight coupling — if reminder-service is down, the appointment creation would fail or require complex retry logic in the booking service. Publish-Subscribe via a durable message broker provides reliability, scalability, and loose coupling.

### Pattern 2: Point-to-Point (via REST APIs)

**Where:** Clients (frontend/Postman) communicate directly with each service via synchronous REST calls. For example, `POST /api/appointments` calls booking-service directly, and `GET /api/patients/:id` calls patient-service directly.

**Why this pattern:** REST is the standard for synchronous request-response communication. The client needs immediate confirmation that an operation succeeded (e.g., "appointment booked"), which requires a synchronous response. REST with JSON is simple, well-understood, and works across all languages and frameworks.

**Defense:** Using Publish-Subscribe for all communication would be inappropriate because the client needs a synchronous response (HTTP 201 Created, 400 Bad Request, etc.) to know whether the operation succeeded. REST provides this immediate feedback while the async messaging handles the background synchronization work.

## 4. Data Synchronization & Conflict Handling

The system synchronizes patient contact data from MySQL (patient-service) to MongoDB (reminder-service):

1. **Trigger:** When a patient updates their profile via `PUT /api/patients/:id`, patient-service publishes a `patient.updated` event to RabbitMQ.
2. **Consumer:** reminder-service receives the event and finds all reminders belonging to that patient.
3. **Conflict handling (stale events):** If the incoming `updatedAt` timestamp is older than a reminder's `lastSyncedAt`, the event is stale (a newer update was already processed) and is skipped.
4. **Post-send conflict:** If the patient's contact information changed AFTER an SMS was already sent, the reminder is flagged with `contactStale = true` to indicate the sent message may have used outdated contact information.
5. **Graceful degradation:** If RabbitMQ is unavailable, both booking-service and patient-service continue operating normally. Appointments are still saved and profiles are still updated — only the background sync/reminder functionality is temporarily unavailable.

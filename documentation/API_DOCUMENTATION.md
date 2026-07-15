# API Documentation

All endpoints return JSON. Base URLs are per-service.

| Service | Base URL |
|---------|----------|
| Patient Service | `http://localhost:4002` |
| Booking Service | `http://localhost:4001` |
| Reminder Service | `http://localhost:4003` |

---

## Patient Service (Port 4002)

### `POST /api/patients/register` — Register a new patient

**Auth:** None (public)

**Request body:**
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "555-0200",
  "password": "secret123"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fullName | string | Yes | |
| email | string | Yes | Must be valid email format |
| phone | string | Yes | |
| password | string | Yes | Minimum 6 characters |

**Responses:**

| Status | Body | When |
|--------|------|------|
| `201` | `{ "message": "Patient registered", "patient": { id, full_name, email, phone, created_at } }` | Success |
| `400` | `{ "error": "Missing required field(s): ..." }` | Missing fields |
| `400` | `{ "error": "Invalid email format" }` | Bad email |
| `400` | `{ "error": "Password must be at least 6 characters" }` | Short password |
| `400` | `{ "error": "Email already registered" }` | Duplicate email |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `POST /api/patients/login` — Login and receive JWT

**Auth:** None (public)

**Request body:**
```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ "message": "Login successful", "token": "<jwt>" }` | Success |
| `400` | `{ "error": "email and password are required" }` | Missing fields |
| `401` | `{ "error": "Invalid email or password" }` | Wrong credentials |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

**Note:** The returned JWT token expires in 2 hours (configurable via `JWT_EXPIRES_IN`). Include it as `Authorization: Bearer <token>` in subsequent requests.

---

### `GET /api/patients/:id` — Get patient profile

**Auth:** JWT required (`Authorization: Bearer <token>`)

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ id, full_name, email, phone, created_at, updated_at }` | Success |
| `401` | `{ "error": "Missing or malformed Authorization header" }` | No token |
| `403` | `{ "error": "Invalid or expired token" }` | Bad token |
| `403` | `{ "error": "You may only view your own profile" }` | ID mismatch |
| `404` | `{ "error": "Patient not found" }` | ID doesn't exist |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `PUT /api/patients/:id` — Update patient profile

**Auth:** JWT required

**Request body (all fields optional):**
```json
{
  "fullName": "Jane M. Doe",
  "phone": "555-0300"
}
```

**Side effect:** Publishes `patient.updated` message to RabbitMQ queue for reminder-service cache sync.

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ "message": "Profile updated", "patient": { ... } }` | Success |
| `401` | `{ "error": "Missing or malformed Authorization header" }` | No token |
| `403` | `{ "error": "Invalid or expired token" }` | Bad token |
| `403` | `{ "error": "You may only update your own profile" }` | ID mismatch |
| `404` | `{ "error": "Patient not found" }` | ID doesn't exist |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `DELETE /api/patients/:id` — Delete patient profile

**Auth:** JWT required

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ "message": "Patient deleted", "patient": { ... } }` | Success |
| `401` | `{ "error": "Missing or malformed Authorization header" }` | No token |
| `403` | `{ "error": "Invalid or expired token" }` | Bad token |
| `403` | `{ "error": "You may only delete your own profile" }` | ID mismatch |
| `404` | `{ "error": "Patient not found" }` | ID doesn't exist |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

## Booking Service (Port 4001)

### `GET /api/appointments` — List all appointments

**Auth:** None (public)

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `[ { id, patient_id, patient_name, ... } ]` | Success |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `GET /api/appointments/:id` — Get appointment by ID

**Auth:** None (public)

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ id, patient_id, patient_name, ... }` | Success |
| `404` | `{ "error": "Appointment not found" }` | ID doesn't exist |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `POST /api/appointments` — Book a new appointment

**Auth:** JWT required

**Request body:**
```json
{
  "patientId": 1,
  "patientName": "Jane Doe",
  "patientContact": "555-0200",
  "doctorName": "Dr. Smith",
  "appointmentDate": "2026-08-15",
  "appointmentTime": "10:00"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| patientId | number | Yes | |
| patientName | string | Yes | |
| patientContact | string | Yes | Phone number for SMS |
| doctorName | string | Yes | |
| appointmentDate | string | Yes | Format: YYYY-MM-DD |
| appointmentTime | string | Yes | e.g. "10:00" |

**Side effect:** Publishes `appointment.created` message to RabbitMQ queue, which triggers reminder-service to create a reminder and attempt SMS delivery.

**Responses:**

| Status | Body | When |
|--------|------|------|
| `201` | `{ "message": "Appointment booked successfully", "reminderQueued": true, "appointment": { ... } }` | Success |
| `400` | `{ "error": "Missing required field(s): ..." }` | Missing fields |
| `400` | `{ "error": "appointmentDate must be a valid date (YYYY-MM-DD)" }` | Bad date |
| `401` | `{ "error": "Missing or malformed Authorization header" }` | No token |
| `403` | `{ "error": "Invalid or expired token" }` | Bad token |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

**Note:** If RabbitMQ is unavailable, the appointment is still saved (`reminderQueued: false`). This is a graceful degradation — the reminder will not fire, but the booking is not lost.

---

### `PUT /api/appointments/:id` — Update an appointment

**Auth:** JWT required

**Request body (all fields optional):**
```json
{
  "doctorName": "Dr. Jones",
  "appointmentTime": "11:00"
}
```

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ "message": "Appointment updated", "appointment": { ... } }` | Success |
| `401` | `{ "error": "Missing or malformed Authorization header" }` | No token |
| `403` | `{ "error": "Invalid or expired token" }` | Bad token |
| `404` | `{ "error": "Appointment not found" }` | ID doesn't exist |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `DELETE /api/appointments/:id` — Cancel an appointment

**Auth:** JWT required

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ "message": "Appointment cancelled", "appointment": { ... } }` | Success |
| `401` | `{ "error": "Missing or malformed Authorization header" }` | No token |
| `403` | `{ "error": "Invalid or expired token" }` | Bad token |
| `404` | `{ "error": "Appointment not found" }` | ID doesn't exist |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

## Reminder Service (Port 4003)

### `GET /api/reminders` — List all reminders

**Auth:** None (public)

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `[ { _id, appointmentId, patientId, patientName, status, ... } ]` | Success |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `GET /api/reminders/:id` — Get reminder by MongoDB ID

**Auth:** None (public)

**Responses:**

| Status | Body | When |
|--------|------|------|
| `200` | `{ _id, appointmentId, patientId, patientName, status, ... }` | Success |
| `404` | `{ "error": "Reminder not found" }` | ID doesn't exist |
| `500` | `{ "error": "Internal server error" }` | Unexpected failure |

---

### `GET /health` — Health check (all services)

**Auth:** None

**Response:** `{ "service": "<service-name>", "status": "ok" }` with status `200`.

---

## Error Handling Summary

| Code | Meaning | When it occurs |
|------|---------|----------------|
| `200` | OK | Successful read/update/delete |
| `201` | Created | Successful resource creation |
| `400` | Bad Request | Invalid or missing input fields |
| `401` | Unauthorized | Missing or malformed Authorization header |
| `403` | Forbidden | Invalid/expired JWT, or accessing another user's resource |
| `404` | Not Found | Resource ID does not exist, or unknown route |
| `500` | Internal Server Error | Unexpected server-side failure |

## Authentication

- **Patient Service** is the JWT issuer. `POST /api/patients/login` returns a signed JWT.
- **Booking Service** verifies the same JWT (shared `JWT_SECRET` env var).
- **Reminder Service** has no auth — its endpoints are read-only and public.
- State-changing endpoints (`POST` creating a resource, `PUT`, `DELETE`) require `Authorization: Bearer <token>`.
- Read-only endpoints (`GET`) are public for easy testing and demo.

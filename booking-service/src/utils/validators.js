// Simple, dependency-free input validation.
function validateAppointmentInput(body) {
  const required = [
    'patientId', 'patientName', 'patientContact',
    'doctorName', 'appointmentDate', 'appointmentTime'
  ];
  const missing = required.filter((field) => !body[field]);
  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(', ')}`;
  }
  if (isNaN(Date.parse(body.appointmentDate))) {
    return 'appointmentDate must be a valid date (YYYY-MM-DD)';
  }
  return null; // no error
}

module.exports = { validateAppointmentInput };

interface AppointmentBody {
  patientId?: number;
  patientName?: string;
  patientContact?: string;
  doctorName?: string;
  appointmentDate?: string;
  appointmentTime?: string;
}

export function validateAppointmentInput(body: AppointmentBody): string | null {
  const required: (keyof AppointmentBody)[] = [
    'patientId', 'patientName', 'patientContact',
    'doctorName', 'appointmentDate', 'appointmentTime',
  ];
  const missing = required.filter((field) => !body[field]);
  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(', ')}`;
  }
  if (isNaN(Date.parse(body.appointmentDate!))) {
    return 'appointmentDate must be a valid date (YYYY-MM-DD)';
  }
  return null;
}

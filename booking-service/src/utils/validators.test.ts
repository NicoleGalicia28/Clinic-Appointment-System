import { validateAppointmentInput } from './validators';

describe('validateAppointmentInput', () => {
  const validBody = {
    patientId: 1,
    patientName: 'John Doe',
    patientContact: '555-0100',
    doctorName: 'Dr. Smith',
    appointmentDate: '2026-08-01',
    appointmentTime: '10:00',
  };

  it('returns null for valid input', () => {
    expect(validateAppointmentInput(validBody)).toBeNull();
  });

  it('returns error when patientId is missing', () => {
    const { patientId, ...rest } = validBody;
    expect(validateAppointmentInput(rest)).toContain('patientId');
  });

  it('returns error when patientName is missing', () => {
    const { patientName, ...rest } = validBody;
    expect(validateAppointmentInput(rest)).toContain('patientName');
  });

  it('returns error when doctorName is missing', () => {
    const { doctorName, ...rest } = validBody;
    expect(validateAppointmentInput(rest)).toContain('doctorName');
  });

  it('returns error when appointmentDate is missing', () => {
    const { appointmentDate, ...rest } = validBody;
    expect(validateAppointmentInput(rest)).toContain('appointmentDate');
  });

  it('returns error when appointmentTime is missing', () => {
    const { appointmentTime, ...rest } = validBody;
    expect(validateAppointmentInput(rest)).toContain('appointmentTime');
  });

  it('returns error for invalid date format', () => {
    expect(validateAppointmentInput({ ...validBody, appointmentDate: 'not-a-date' })).toContain('valid date');
  });

  it('reports all missing fields at once', () => {
    const result = validateAppointmentInput({});
    expect(result).toContain('patientId');
    expect(result).toContain('patientName');
    expect(result).toContain('patientContact');
    expect(result).toContain('doctorName');
    expect(result).toContain('appointmentDate');
    expect(result).toContain('appointmentTime');
  });
});

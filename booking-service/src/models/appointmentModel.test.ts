import * as appointmentModel from './appointmentModel';

jest.mock('../config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

const mockPool = require('../config/db').pool;

describe('appointmentModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllAppointments', () => {
    it('returns all appointments', async () => {
      const mockAppointments = [
        { id: 1, patient_name: 'John', doctor_name: 'Dr. Smith', appointment_date: '2026-08-01' },
      ];
      mockPool.query.mockResolvedValue([mockAppointments]);

      const result = await appointmentModel.getAllAppointments();
      expect(result).toEqual(mockAppointments);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM appointments')
      );
    });
  });

  describe('getAppointmentById', () => {
    it('returns an appointment when found', async () => {
      const mockAppointment = { id: 1, patient_name: 'John' };
      mockPool.query.mockResolvedValue([[mockAppointment]]);

      const result = await appointmentModel.getAppointmentById(1);
      expect(result).toEqual(mockAppointment);
    });

    it('returns null when not found', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const result = await appointmentModel.getAppointmentById(999);
      expect(result).toBeNull();
    });
  });

  describe('createAppointment', () => {
    it('creates and returns a new appointment', async () => {
      mockPool.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([[{ id: 1, patient_name: 'John' }]]);

      const result = await appointmentModel.createAppointment({
        patientId: 1,
        patientName: 'John',
        patientContact: '555-0100',
        doctorName: 'Dr. Smith',
        appointmentDate: '2026-08-01',
        appointmentTime: '10:00',
        reminderQueued: false,
      });

      expect(result.id).toBe(1);
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteAppointment', () => {
    it('deletes and returns the appointment', async () => {
      const mockAppointment = { id: 1, patient_name: 'John' };
      mockPool.query
        .mockResolvedValueOnce([[mockAppointment]])
        .mockResolvedValueOnce([{}]);

      const result = await appointmentModel.deleteAppointment(1);
      expect(result).toEqual(mockAppointment);
    });

    it('returns null when appointment does not exist', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const result = await appointmentModel.deleteAppointment(999);
      expect(result).toBeNull();
    });
  });
});

import * as patientModel from './patientModel';

jest.mock('../config/db', () => ({
  pool: {
    query: jest.fn(),
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

const mockPool = require('../config/db').pool;

describe('patientModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPatient', () => {
    it('creates and returns a new patient', async () => {
      mockPool.query
        .mockResolvedValueOnce([{ insertId: 1 }])
        .mockResolvedValueOnce([[{ id: 1, full_name: 'Jane', email: 'jane@test.com', phone: '555-0200', updated_at: '2026-01-01', created_at: '2026-01-01' }]]);

      const result = await patientModel.createPatient({
        fullName: 'Jane',
        email: 'jane@test.com',
        phone: '555-0200',
        password: 'secret123',
      });

      expect(result.id).toBe(1);
      expect(result.full_name).toBe('Jane');
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('findByEmail', () => {
    it('returns patient with password_hash when found', async () => {
      const mockPatient = { id: 1, email: 'jane@test.com', password_hash: 'hashed_password' };
      mockPool.query.mockResolvedValue([[mockPatient]]);

      const result = await patientModel.findByEmail('jane@test.com');
      expect(result).toEqual(mockPatient);
      expect(result?.password_hash).toBe('hashed_password');
    });

    it('returns null when not found', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const result = await patientModel.findByEmail('nobody@test.com');
      expect(result).toBeNull();
    });
  });

  describe('getPatientById', () => {
    it('returns patient without password_hash', async () => {
      const mockPatient = { id: 1, full_name: 'Jane', email: 'jane@test.com', phone: '555-0200', updated_at: '2026-01-01', created_at: '2026-01-01' };
      mockPool.query.mockResolvedValue([[mockPatient]]);

      const result = await patientModel.getPatientById(1);
      expect(result).toEqual(mockPatient);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, full_name'),
        [1]
      );
    });

    it('returns null when not found', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const result = await patientModel.getPatientById(999);
      expect(result).toBeNull();
    });
  });

  describe('updatePatient', () => {
    it('updates and returns the patient', async () => {
      const existing = { id: 1, full_name: 'Jane', phone: '555-0200' };
      const updated = { id: 1, full_name: 'Jane M.', phone: '555-0300' };
      mockPool.query
        .mockResolvedValueOnce([[existing]])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([[updated]]);

      const result = await patientModel.updatePatient(1, { fullName: 'Jane M.', phone: '555-0300' });
      expect(result?.full_name).toBe('Jane M.');
      expect(result?.phone).toBe('555-0300');
    });

    it('returns null when patient does not exist', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const result = await patientModel.updatePatient(999, { fullName: 'Nobody' });
      expect(result).toBeNull();
    });
  });

  describe('deletePatient', () => {
    it('deletes and returns the patient', async () => {
      const mockPatient = { id: 1, full_name: 'Jane' };
      mockPool.query
        .mockResolvedValueOnce([[mockPatient]])
        .mockResolvedValueOnce([{}]);

      const result = await patientModel.deletePatient(1);
      expect(result).toEqual(mockPatient);
    });

    it('returns null when patient does not exist', async () => {
      mockPool.query.mockResolvedValue([[]]);

      const result = await patientModel.deletePatient(999);
      expect(result).toBeNull();
    });
  });
});

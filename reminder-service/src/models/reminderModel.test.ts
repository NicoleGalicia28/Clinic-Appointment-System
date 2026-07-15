import mongoose from 'mongoose';
import Reminder from './reminderModel';

describe('Reminder Model', () => {
  it('has the correct schema fields', () => {
    const paths = Object.keys(Reminder.schema.paths);
    expect(paths).toContain('appointmentId');
    expect(paths).toContain('patientId');
    expect(paths).toContain('patientName');
    expect(paths).toContain('patientContactCache');
    expect(paths).toContain('doctorName');
    expect(paths).toContain('appointmentDate');
    expect(paths).toContain('appointmentTime');
    expect(paths).toContain('status');
    expect(paths).toContain('smsAttempts');
    expect(paths).toContain('lastSyncedAt');
    expect(paths).toContain('contactStale');
    expect(paths).toContain('createdAt');
  });

  it('defaults status to pending', () => {
    const doc = new Reminder({ appointmentId: 1, patientId: 1 });
    expect(doc.status).toBe('pending');
  });

  it('defaults smsAttempts to 0', () => {
    const doc = new Reminder({ appointmentId: 1, patientId: 1 });
    expect(doc.smsAttempts).toBe(0);
  });

  it('defaults contactStale to false', () => {
    const doc = new Reminder({ appointmentId: 1, patientId: 1 });
    expect(doc.contactStale).toBe(false);
  });

  it('requires appointmentId', async () => {
    const doc = new Reminder({ patientId: 1 });
    const validationError = doc.validateSync();
    expect(validationError?.errors?.appointmentId).toBeDefined();
  });

  it('requires patientId', async () => {
    const doc = new Reminder({ appointmentId: 1 });
    const validationError = doc.validateSync();
    expect(validationError?.errors?.patientId).toBeDefined();
  });

  it('requires patientName', async () => {
    const doc = new Reminder({ appointmentId: 1, patientId: 1 });
    const validationError = doc.validateSync();
    expect(validationError?.errors?.patientName).toBeDefined();
  });

  it('requires patientContactCache', async () => {
    const doc = new Reminder({ appointmentId: 1, patientId: 1 });
    const validationError = doc.validateSync();
    expect(validationError?.errors?.patientContactCache).toBeDefined();
  });

  it('accepts a fully valid reminder', () => {
    const doc = new Reminder({
      appointmentId: 1,
      patientId: 1,
      patientName: 'Jane',
      patientContactCache: '555-0100',
      doctorName: 'Dr. Smith',
      appointmentDate: '2026-08-01',
      appointmentTime: '10:00',
    });
    const validationError = doc.validateSync();
    expect(validationError).toBeUndefined();
  });
});

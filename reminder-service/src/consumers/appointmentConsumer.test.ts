import { Channel, ConsumeMessage } from 'amqplib';
import { startAppointmentConsumer } from './appointmentConsumer';
import { QUEUE_APPOINTMENT_CREATED } from './queueNames';

jest.mock('../models/reminderModel', () => ({
  findOneAndUpdate: jest.fn(),
}));

jest.mock('../utils/smsSimulator', () => ({
  sendSms: jest.fn(),
}));

const Reminder = require('../models/reminderModel');
const { sendSms } = require('../utils/smsSimulator');

function createMockMsg(data: object): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(data)),
    fields: {} as any,
    properties: {} as any,
  } as ConsumeMessage;
}

describe('appointmentConsumer', () => {
  let channel: jest.Mocked<Channel>;
  let consumeCb: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    channel = {
      assertQueue: jest.fn().mockResolvedValue({}),
      consume: jest.fn().mockImplementation((_q: string, cb: Function) => { consumeCb = cb; }),
      ack: jest.fn(),
      nack: jest.fn(),
      prefetch: jest.fn().mockResolvedValue({}),
    } as any;
    Reminder.findOneAndUpdate.mockReset();
    sendSms.mockReset();
  });

  it('asserts the queue and starts consuming', async () => {
    await startAppointmentConsumer(channel);
    expect(channel.assertQueue).toHaveBeenCalledWith(QUEUE_APPOINTMENT_CREATED, { durable: true });
    expect(channel.consume).toHaveBeenCalled();
  });

  it('creates a reminder and sends SMS on valid message', async () => {
    const mockReminder = {
      patientContactCache: '555-0100',
      doctorName: 'Dr. Smith',
      appointmentDate: '2026-08-01',
      appointmentTime: '10:00',
      status: 'pending',
      smsAttempts: 0,
      save: jest.fn().mockResolvedValue({}),
    };
    Reminder.findOneAndUpdate.mockResolvedValue(mockReminder);
    sendSms.mockReturnValue(true);

    await startAppointmentConsumer(channel);
    const msg = createMockMsg({
      appointmentId: 1,
      patientId: 1,
      patientName: 'Jane',
      patientContact: '555-0100',
      doctorName: 'Dr. Smith',
      appointmentDate: '2026-08-01',
      appointmentTime: '10:00',
    });
    await consumeCb(msg);

    expect(Reminder.findOneAndUpdate).toHaveBeenCalledWith(
      { appointmentId: 1 },
      expect.objectContaining({ appointmentId: 1 }),
      { upsert: true, new: true }
    );
    expect(sendSms).toHaveBeenCalled();
    expect(mockReminder.status).toBe('sent');
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  it('retries up to 3 times when SMS fails', async () => {
    const mockReminder = {
      patientContactCache: '555-0100',
      doctorName: 'Dr. Smith',
      appointmentDate: '2026-08-01',
      appointmentTime: '10:00',
      status: 'pending',
      smsAttempts: 0,
      save: jest.fn().mockResolvedValue({}),
    };
    Reminder.findOneAndUpdate.mockResolvedValue(mockReminder);
    sendSms.mockReturnValue(false);

    await startAppointmentConsumer(channel);
    const msg = createMockMsg({
      appointmentId: 2,
      patientId: 1,
      patientName: 'Jane',
      patientContact: '555-0100',
      doctorName: 'Dr. Smith',
      appointmentDate: '2026-08-01',
      appointmentTime: '10:00',
    });
    await consumeCb(msg);

    expect(sendSms).toHaveBeenCalledTimes(3);
    expect(mockReminder.status).toBe('failed');
    expect(mockReminder.smsAttempts).toBe(3);
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  it('nacks on processing error', async () => {
    Reminder.findOneAndUpdate.mockRejectedValue(new Error('DB error'));

    await startAppointmentConsumer(channel);
    const msg = createMockMsg({ appointmentId: 3 });
    await consumeCb(msg);

    expect(channel.nack).toHaveBeenCalledWith(msg, false, false);
  });

  it('ignores null messages', async () => {
    await startAppointmentConsumer(channel);
    await consumeCb(null);

    expect(Reminder.findOneAndUpdate).not.toHaveBeenCalled();
    expect(channel.ack).not.toHaveBeenCalled();
  });
});

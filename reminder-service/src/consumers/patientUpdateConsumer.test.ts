import { Channel, ConsumeMessage } from 'amqplib';
import { startPatientUpdateConsumer } from './patientUpdateConsumer';
import { QUEUE_PATIENT_UPDATED } from './queueNames';

jest.mock('../models/reminderModel', () => ({
  find: jest.fn(),
}));

const Reminder = require('../models/reminderModel');

function createMockMsg(data: object): ConsumeMessage {
  return {
    content: Buffer.from(JSON.stringify(data)),
    fields: {} as any,
    properties: {} as any,
  } as ConsumeMessage;
}

describe('patientUpdateConsumer', () => {
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
    Reminder.find.mockReset();
  });

  it('asserts the queue and starts consuming', async () => {
    await startPatientUpdateConsumer(channel);
    expect(channel.assertQueue).toHaveBeenCalledWith(QUEUE_PATIENT_UPDATED, { durable: true });
    expect(channel.consume).toHaveBeenCalled();
  });

  it('updates patient contact cache on reminders', async () => {
    const mockReminder = {
      appointmentId: 1,
      lastSyncedAt: new Date('2026-01-01'),
      status: 'pending',
      patientName: 'Jane',
      patientContactCache: '555-0100',
      save: jest.fn().mockResolvedValue({}),
    };
    Reminder.find.mockResolvedValue([mockReminder]);

    await startPatientUpdateConsumer(channel);
    const msg = createMockMsg({
      patientId: 1,
      patientName: 'Jane M.',
      patientContact: '555-0300',
      updatedAt: '2026-07-15T10:00:00Z',
    });
    await consumeCb(msg);

    expect(mockReminder.patientName).toBe('Jane M.');
    expect(mockReminder.patientContactCache).toBe('555-0300');
    expect(mockReminder.save).toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  it('ignores stale events', async () => {
    const mockReminder = {
      appointmentId: 1,
      lastSyncedAt: new Date('2026-07-20'),
      status: 'pending',
      save: jest.fn(),
    };
    Reminder.find.mockResolvedValue([mockReminder]);

    await startPatientUpdateConsumer(channel);
    const msg = createMockMsg({
      patientId: 1,
      patientName: 'Jane',
      patientContact: '555-0100',
      updatedAt: '2026-07-15T10:00:00Z',
    });
    await consumeCb(msg);

    expect(mockReminder.save).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  it('flags contactStale when contact changed after SMS sent', async () => {
    const mockReminder: any = {
      appointmentId: 1,
      lastSyncedAt: new Date('2026-01-01'),
      status: 'sent',
      patientName: 'Jane',
      patientContactCache: '555-0100',
      contactStale: false,
      save: jest.fn().mockResolvedValue({}),
    };
    Reminder.find.mockResolvedValue([mockReminder]);

    await startPatientUpdateConsumer(channel);
    const msg = createMockMsg({
      patientId: 1,
      patientName: 'Jane M.',
      patientContact: '555-0300',
      updatedAt: '2026-07-15T10:00:00Z',
    });
    await consumeCb(msg);

    expect(mockReminder.contactStale).toBe(true);
    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  it('handles patient with no existing reminders', async () => {
    Reminder.find.mockResolvedValue([]);

    await startPatientUpdateConsumer(channel);
    const msg = createMockMsg({
      patientId: 999,
      patientName: 'Ghost',
      patientContact: '000-0000',
      updatedAt: '2026-07-15T10:00:00Z',
    });
    await consumeCb(msg);

    expect(channel.ack).toHaveBeenCalledWith(msg);
  });

  it('nacks on processing error', async () => {
    Reminder.find.mockRejectedValue(new Error('DB error'));

    await startPatientUpdateConsumer(channel);
    const msg = createMockMsg({ patientId: 1 });
    await consumeCb(msg);

    expect(channel.nack).toHaveBeenCalledWith(msg, false, false);
  });

  it('ignores null messages', async () => {
    await startPatientUpdateConsumer(channel);
    await consumeCb(null);

    expect(Reminder.find).not.toHaveBeenCalled();
  });
});

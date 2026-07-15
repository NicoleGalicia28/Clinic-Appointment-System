import { sendSms } from './smsSimulator';

describe('smsSimulator', () => {
  it('returns a boolean', () => {
    const result = sendSms('555-0100', 'Test message');
    expect(typeof result).toBe('boolean');
  });

  it('logs success message when SMS succeeds', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(Math, 'random').mockReturnValue(0.9);

    sendSms('555-0100', 'Reminder');
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SMS sent to 555-0100')
    );

    consoleSpy.mockRestore();
    (Math.random as jest.Mock).mockRestore();
  });

  it('logs failure message when SMS fails', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(Math, 'random').mockReturnValue(0.05);

    const result = sendSms('555-0100', 'Reminder');
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('SMS FAILED')
    );

    consoleSpy.mockRestore();
    (Math.random as jest.Mock).mockRestore();
  });
});

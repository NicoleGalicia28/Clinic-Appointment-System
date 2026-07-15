export function sendSms(contact: string, message: string): boolean {
  const succeeded = Math.random() > 0.15;
  if (succeeded) {
    console.log(`[reminder-service] SMS sent to ${contact}: "${message}"`);
  } else {
    console.warn(`[reminder-service] SMS FAILED to send to ${contact}`);
  }
  return succeeded;
}

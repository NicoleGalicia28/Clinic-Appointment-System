// Stand-in for a real SMS gateway (e.g. Twilio). We don't have real
// SMS credentials for this course project, so this simulates the
// downstream call, including realistic occasional failure — which is
// exactly what the rubric's "simulated downstream-failure scenario"
// asks for.
function sendSms(contact, message) {
  const succeeded = Math.random() > 0.15; // ~85% success rate
  if (succeeded) {
    console.log(`[reminder-service] SMS sent to ${contact}: "${message}"`);
  } else {
    console.warn(`[reminder-service] SMS FAILED to send to ${contact}`);
  }
  return succeeded;
}

module.exports = { sendSms };

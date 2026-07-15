function validateRegisterInput(body) {
  const required = ['fullName', 'email', 'phone', 'password'];
  const missing = required.filter((f) => !body[f]);
  if (missing.length > 0) return `Missing required field(s): ${missing.join(', ')}`;
  if (!/^\S+@\S+\.\S+$/.test(body.email)) return 'Invalid email format';
  if (body.password.length < 6) return 'Password must be at least 6 characters';
  return null;
}

function validateLoginInput(body) {
  if (!body.email || !body.password) return 'email and password are required';
  return null;
}

module.exports = { validateRegisterInput, validateLoginInput };

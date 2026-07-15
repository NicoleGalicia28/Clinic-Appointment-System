interface RegisterBody {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

interface LoginBody {
  email?: string;
  password?: string;
}

export function validateRegisterInput(body: RegisterBody): string | null {
  const required: (keyof RegisterBody)[] = ['fullName', 'email', 'phone', 'password'];
  const missing = required.filter((f) => !body[f]);
  if (missing.length > 0) return `Missing required field(s): ${missing.join(', ')}`;
  if (!/^\S+@\S+\.\S+$/.test(body.email!)) return 'Invalid email format';
  if (body.password!.length < 6) return 'Password must be at least 6 characters';
  return null;
}

export function validateLoginInput(body: LoginBody): string | null {
  if (!body.email || !body.password) return 'email and password are required';
  return null;
}

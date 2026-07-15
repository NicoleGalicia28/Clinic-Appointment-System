import { validateRegisterInput, validateLoginInput } from './validators';

describe('validateRegisterInput', () => {
  const validBody = {
    fullName: 'Jane Doe',
    email: 'jane@test.com',
    phone: '555-0200',
    password: 'secret123',
  };

  it('returns null for valid input', () => {
    expect(validateRegisterInput(validBody)).toBeNull();
  });

  it('returns error when fullName is missing', () => {
    const { fullName, ...rest } = validBody;
    expect(validateRegisterInput(rest)).toContain('fullName');
  });

  it('returns error for invalid email', () => {
    expect(validateRegisterInput({ ...validBody, email: 'notanemail' })).toContain('email');
  });

  it('returns error for short password', () => {
    expect(validateRegisterInput({ ...validBody, password: '123' })).toContain('at least 6');
  });

  it('accepts a valid email with subdomain', () => {
    expect(validateRegisterInput({ ...validBody, email: 'user@mail.test.com' })).toBeNull();
  });
});

describe('validateLoginInput', () => {
  it('returns null when email and password provided', () => {
    expect(validateLoginInput({ email: 'a@b.com', password: 'pass' })).toBeNull();
  });

  it('returns error when email is missing', () => {
    expect(validateLoginInput({ password: 'pass' })).toContain('required');
  });

  it('returns error when password is missing', () => {
    expect(validateLoginInput({ email: 'a@b.com' })).toContain('required');
  });

  it('returns error when both are missing', () => {
    expect(validateLoginInput({})).toContain('required');
  });
});

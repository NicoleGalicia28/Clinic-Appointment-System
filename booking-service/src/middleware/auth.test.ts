import { Request, Response } from 'express';
import { verifyToken } from './auth';

const mockReq = (authHeader?: string) => ({
  headers: { authorization: authHeader },
} as Request);

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const next = jest.fn();

describe('verifyToken middleware', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, JWT_SECRET: 'test-secret' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns 401 when no Authorization header', () => {
    verifyToken(mockReq(), mockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', () => {
    verifyToken(mockReq('Token abc123'), mockRes(), next);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for invalid token', () => {
    const res = mockRes();
    verifyToken(mockReq('Bearer invalid.token.here'), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a valid token', () => {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ patientId: 1, email: 'test@test.com' }, 'test-secret', { expiresIn: '1h' });
    const res = mockRes();
    verifyToken(mockReq(`Bearer ${token}`), res, next);
    expect(next).toHaveBeenCalled();
  });
});

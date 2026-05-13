import { signupUser, loginUser, getUserById } from './auth.service.js';

export const signup = async (req, res) => {
  const result = await signupUser(req.body);
  res.status(201).json({ success: true, data: result });
};

export const login = async (req, res) => {
  const result = await loginUser(req.body);
  res.json({ success: true, data: result });
};

export const getMe = async (req, res) => {
  const user = await getUserById(req.user.id);
  res.json({ success: true, data: { user } });
};

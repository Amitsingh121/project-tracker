import { getDashboard } from './dashboard.service.js';

export const dashboard = async (req, res) => {
  const data = await getDashboard(req.user.id);
  res.json({ success: true, data });
};

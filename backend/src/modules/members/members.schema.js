import { z } from 'zod';

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const changeMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER'], { message: 'Role must be ADMIN or MEMBER' }),
});

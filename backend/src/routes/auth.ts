import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { config } from '../config';
import { findAdmin, findUser, createUser } from '../services/storage';

const router = Router();

const schema = z.object({
  username: z.string(),
  password: z.string()
});

router.post('/login', async (req, res) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  try {
    const admin = await findAdmin(parsed.data.username);
    const valid = admin?.password_hash
      ? bcrypt.compareSync(parsed.data.password, admin.password_hash)
      : false;
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ role: 'admin', sub: admin.id }, config.jwtSecret, { expiresIn: '12h' });
    return res.status(200).json({ token });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Login failed' });
  }
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
});

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload', errors: parsed.error });

  try {
    const existing = await findUser(parsed.data.email);
    if (existing) return res.status(409).json({ message: 'User already exists' });

    const hashed = bcrypt.hashSync(parsed.data.password, 10);
    const user = await createUser(parsed.data.email, hashed, parsed.data.name);

    const token = jwt.sign({ role: 'user', sub: user.id }, config.jwtSecret, { expiresIn: '24h' });
    return res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Signup failed' });
  }
});

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/login/user', async (req, res) => {
  const parsed = userLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  try {
    const user = await findUser(parsed.data.email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = user.password_hash
      ? bcrypt.compareSync(parsed.data.password, user.password_hash)
      : false;
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ role: 'user', sub: user.id }, config.jwtSecret, { expiresIn: '24h' });
    return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err: any) {
    return res.status(500).json({ message: err?.message || 'Login failed' });
  }
});


router.post('/exchange', async (req, res) => {
  const { supabaseToken } = req.body;
  if (!supabaseToken) return res.status(400).json({ message: 'Missing token' });

  try {
    const sbUser = await import('../services/storage').then(m => m.verifySupabaseToken(supabaseToken));

    if (!sbUser || !sbUser.email) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Safety: Ensure email verified if using email provider
    const provider = sbUser.app_metadata.provider || 'email';
    if (provider === 'email' && !sbUser.email_confirmed_at) {
      return res.status(403).json({ message: 'Email not verified' });
    }

    // Sync to internal DB
    let user = await findUser(sbUser.email);
    if (!user) {
      // Create new user with OAuth marker
      const marker = `OAUTH_${provider.toUpperCase()}`;
      // Use user metadata name or fallback
      const name = sbUser.user_metadata.full_name || sbUser.user_metadata.name || 'Creator';
      user = await createUser(sbUser.email, marker, name);
    }

    // Issue internal JWT
    const token = jwt.sign({ role: 'user', sub: user.id }, config.jwtSecret, { expiresIn: '24h' });
    return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email } });

  } catch (err: any) {
    console.error('Exchange error:', err);
    return res.status(500).json({ message: 'Authentication exchange failed' });
  }
});

export default router;


const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database');

const router = express.Router();

// POST /auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, birthDate } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Senha deve ter pelo menos 6 caracteres' });
  }

  try {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await pool.execute(
      'INSERT INTO users (id, email, password, birth_date) VALUES (?, ?, ?, ?)',
      [id, email, hashedPassword, birthDate || null]
    );

    const token = jwt.sign({ userId: id, email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { uid: id, email, isPro: false, birthDate: birthDate || null, createdAt: new Date() }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /auth/signin
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        uid: user.id,
        email: user.email,
        isPro: user.is_pro,
        birthDate: user.birth_date || null,
        createdAt: user.created_at,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.execute(
      'SELECT id, email, is_pro, birth_date, created_at FROM users WHERE id = ?',
      [decoded.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });

    const user = rows[0];
    res.json({
      uid: user.id,
      email: user.email,
      isPro: user.is_pro,
      birthDate: user.birth_date || null,
      createdAt: user.created_at,
    });
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

module.exports = router;

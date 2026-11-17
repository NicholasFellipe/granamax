const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database');

const router = express.Router();

// Middleware de autenticação
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// GET /transactions — listar transações do usuário
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
      [req.userId]
    );
    res.json(rows.map(t => ({
      id: t.id,
      userId: t.user_id,
      description: t.description,
      amount: parseFloat(t.amount),
      type: t.type,
      category: t.category,
      date: t.date,
      createdAt: t.created_at,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// POST /transactions — criar transação
router.post('/', auth, async (req, res) => {
  const { description, amount, type, category } = req.body;

  if (!description || !amount || !type || !category) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const id = uuidv4();
    const date = new Date();

    await pool.execute(
      'INSERT INTO transactions (id, user_id, description, amount, type, category, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.userId, description, amount, type, category, date]
    );

    res.status(201).json({
      id,
      userId: req.userId,
      description,
      amount: parseFloat(amount),
      type,
      category,
      date,
      createdAt: date,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// DELETE /transactions/:id — excluir transação
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

module.exports = router;

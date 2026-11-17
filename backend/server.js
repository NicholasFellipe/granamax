const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/transactions', transactionRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', message: 'GranaMax API rodando!' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 GranaMax API rodando em http://localhost:${PORT}`);
});

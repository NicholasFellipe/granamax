# 🗄️ ALTERNATIVA LOCALSTORAGE - GRANAMAX

## 🎯 USE ESTA OPÇÃO SE:

- ✅ Quer testar o app **IMEDIATAMENTE** (zero configuração)
- ✅ Não quer configurar Firebase agora
- ✅ Vai usar apenas localmente (no seu navegador)
- ✅ Quer experimentar antes de decidir lançar

---

## ⚡ INSTALAÇÃO EM 5 MINUTOS

### PASSO 1: Substituir os 3 Hooks

Copie e cole os códigos abaixo **substituindo completamente** os arquivos existentes:

---

### 📄 `src/hooks/useAuth.ts`

```typescript
// 🔐 HOOK DE AUTENTICAÇÃO - LOCALSTORAGE VERSION

import { useState, useEffect } from 'react';
import { User } from '../types';

const STORAGE_KEY = 'granamax_users';
const CURRENT_USER_KEY = 'granamax_current_user';

interface StoredUser {
  uid: string;
  email: string;
  password: string; // Armazenado apenas para demo local
  isPro: boolean;
  createdAt: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar usuário atual ao iniciar
  useEffect(() => {
    const currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    if (currentUserId) {
      const users = getUsers();
      const storedUser = users.find(u => u.uid === currentUserId);
      if (storedUser) {
        setUser({
          uid: storedUser.uid,
          email: storedUser.email,
          isPro: storedUser.isPro,
          createdAt: new Date(storedUser.createdAt),
        });
      }
    }
    setLoading(false);
  }, []);

  // Helpers para localStorage
  const getUsers = (): StoredUser[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  };

  const saveUsers = (users: StoredUser[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      
      const users = getUsers();
      
      // Verificar se email já existe
      if (users.find(u => u.email === email)) {
        throw new Error('Email já cadastrado');
      }

      const newUser: StoredUser = {
        uid: crypto.randomUUID(),
        email,
        password, // Em produção, NUNCA armazene senhas em texto puro!
        isPro: false,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      // Fazer login automático
      localStorage.setItem(CURRENT_USER_KEY, newUser.uid);
      setUser({
        uid: newUser.uid,
        email: newUser.email,
        isPro: newUser.isPro,
        createdAt: new Date(newUser.createdAt),
      });

      return newUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      
      const users = getUsers();
      const storedUser = users.find(
        u => u.email === email && u.password === password
      );

      if (!storedUser) {
        throw new Error('Email ou senha incorretos');
      }

      localStorage.setItem(CURRENT_USER_KEY, storedUser.uid);
      setUser({
        uid: storedUser.uid,
        email: storedUser.email,
        isPro: storedUser.isPro,
        createdAt: new Date(storedUser.createdAt),
      });

      return storedUser;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
  };
}
```

---

### 📄 `src/hooks/useTransactions.ts`

```typescript
// 💰 HOOK DE TRANSAÇÕES - LOCALSTORAGE VERSION

import { useState, useEffect } from 'react';
import { Transaction } from '../types';

const STORAGE_KEY = 'granamax_transactions';

export function useTransactions(userId: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar transações do localStorage
  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const loadTransactions = () => {
      const data = localStorage.getItem(STORAGE_KEY);
      const allTransactions: Transaction[] = data ? JSON.parse(data) : [];
      
      // Filtrar apenas transações do usuário atual
      const userTransactions = allTransactions
        .filter(t => t.userId === userId)
        .map(t => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt),
        }))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      setTransactions(userTransactions);
      setLoading(false);
    };

    loadTransactions();
  }, [userId]);

  const saveToStorage = (newTransactions: Transaction[]) => {
    const data = localStorage.getItem(STORAGE_KEY);
    const allTransactions: Transaction[] = data ? JSON.parse(data) : [];
    
    // Remover transações antigas do usuário e adicionar as novas
    const otherUsersTransactions = allTransactions.filter(t => t.userId !== userId);
    const updated = [...otherUsersTransactions, ...newTransactions];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addTransaction = async (
    description: string,
    amount: number,
    type: 'income' | 'expense',
    category: string
  ) => {
    if (!userId) throw new Error('User not authenticated');

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      userId,
      description,
      amount,
      type,
      category,
      date: new Date(),
      createdAt: new Date(),
    };

    const updated = [newTransaction, ...transactions];
    setTransactions(updated);
    saveToStorage(updated);
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    saveToStorage(updated);
  };

  // Cálculos
  const balance = transactions.reduce((acc, t) => {
    return t.type === 'income' ? acc + t.amount : acc - t.amount;
  }, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  return {
    transactions,
    loading,
    addTransaction,
    deleteTransaction,
    balance,
    totalIncome,
    totalExpenses,
  };
}
```

---

### 📄 `src/hooks/useInvestments.ts`

```typescript
// 📈 HOOK DE INVESTIMENTOS (PRO) - LOCALSTORAGE VERSION

import { useState, useEffect } from 'react';
import { Investment } from '../types';

const STORAGE_KEY = 'granamax_investments';

export function useInvestments(userId: string | undefined, isPro: boolean) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar investimentos do localStorage
  useEffect(() => {
    if (!userId || !isPro) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    const loadInvestments = () => {
      const data = localStorage.getItem(STORAGE_KEY);
      const allInvestments: Investment[] = data ? JSON.parse(data) : [];
      
      // Filtrar apenas investimentos do usuário atual
      const userInvestments = allInvestments
        .filter(inv => inv.userId === userId)
        .map(inv => ({
          ...inv,
          boughtAt: new Date(inv.boughtAt),
          updatedAt: new Date(inv.updatedAt),
        }));

      setInvestments(userInvestments);
      setLoading(false);
    };

    loadInvestments();
  }, [userId, isPro]);

  const saveToStorage = (newInvestments: Investment[]) => {
    const data = localStorage.getItem(STORAGE_KEY);
    const allInvestments: Investment[] = data ? JSON.parse(data) : [];
    
    // Remover investimentos antigos do usuário e adicionar os novos
    const otherUsersInvestments = allInvestments.filter(inv => inv.userId !== userId);
    const updated = [...otherUsersInvestments, ...newInvestments];
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addInvestment = async (
    name: string,
    amount: number,
    type: Investment['type']
  ) => {
    if (!userId) throw new Error('User not authenticated');
    if (!isPro) throw new Error('PRO subscription required');

    const newInvestment: Investment = {
      id: crypto.randomUUID(),
      userId,
      name,
      amount,
      currentValue: amount, // Valor inicial = valor investido
      type,
      boughtAt: new Date(),
      updatedAt: new Date(),
    };

    const updated = [...investments, newInvestment];
    setInvestments(updated);
    saveToStorage(updated);
  };

  const updateInvestmentValue = async (id: string, newValue: number) => {
    const updated = investments.map(inv =>
      inv.id === id
        ? { ...inv, currentValue: newValue, updatedAt: new Date() }
        : inv
    );
    setInvestments(updated);
    saveToStorage(updated);
  };

  const deleteInvestment = async (id: string) => {
    const updated = investments.filter(inv => inv.id !== id);
    setInvestments(updated);
    saveToStorage(updated);
  };

  // Cálculos
  const totalInvested = investments.reduce((acc, inv) => acc + inv.amount, 0);
  const totalValue = investments.reduce((acc, inv) => acc + inv.currentValue, 0);
  const totalProfit = totalValue - totalInvested;
  const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  return {
    investments,
    loading,
    addInvestment,
    updateInvestmentValue,
    deleteInvestment,
    totalInvested,
    totalValue,
    totalProfit,
    profitPercentage,
  };
}
```

---

### PASSO 2: Rodar o App

```bash
npm run dev
```

Abra http://localhost:5173

---

## ✅ PRONTO! O APP JÁ FUNCIONA

Agora você pode:
- ✅ Criar conta
- ✅ Fazer login
- ✅ Adicionar transações
- ✅ Ver gráficos e análises
- ✅ Testar todos os recursos

---

## 🔍 COMO FUNCIONA

### LocalStorage = Banco de Dados do Navegador

Seus dados ficam salvos em:
- **Navegador:** localStorage do seu browser
- **Localização:** Somente no seu computador
- **Persistência:** Permanece mesmo após fechar o navegador
- **Limite:** ~5-10MB (mais que suficiente)

### 3 Chaves de Armazenamento

```javascript
granamax_users         // Lista de usuários
granamax_current_user  // ID do usuário logado
granamax_transactions  // Todas as transações
granamax_investments   // Todos os investimentos
```

---

## 🛡️ SEGURANÇA

### ⚠️ IMPORTANTE - Apenas para Testes Locais

**Este código NÃO deve ser usado em produção porque:**
- ❌ Senhas armazenadas em texto puro
- ❌ Sem criptografia
- ❌ Dados visíveis no DevTools

**Para produção, use Firebase** (seguindo o `COMECE_AQUI.md`)

### ✅ Mas É Seguro para Testar Localmente

- ✅ Dados só no SEU computador
- ✅ Nenhuma rede envolvida
- ✅ Perfeito para aprender/testar

---

## 📊 TESTANDO OS DADOS

### Ver Dados Salvos (Console do Navegador)

```javascript
// Abra DevTools (F12) e cole no Console:

// Ver usuários
JSON.parse(localStorage.getItem('granamax_users'))

// Ver transações
JSON.parse(localStorage.getItem('granamax_transactions'))

// Ver investimentos
JSON.parse(localStorage.getItem('granamax_investments'))

// Limpar tudo (reset)
localStorage.clear()
```

---

## 🔄 MIGRAR PARA FIREBASE DEPOIS

### Quando Decidir Lançar Oficialmente:

1. **Reverta os hooks** para a versão Firebase original
2. Configure o Firebase (veja `COMECE_AQUI.md`)
3. Seus usuários começarão com dados limpos

**Não há migração automática de dados do LocalStorage para Firebase.**

Se precisar migrar dados:
1. Exporte do LocalStorage (copie o JSON)
2. Importe manualmente no Firestore

---

## 🆘 PROBLEMAS COMUNS

### "Erro ao fazer login"
- Certifique-se de criar uma conta primeiro
- Email/senha devem ser exatamente os mesmos

### "Dados sumiram"
- Limpou o cache do navegador?
- Está no mesmo navegador/computador?
- Use `localStorage.getItem('granamax_users')` para verificar

### "Funcionalidade PRO não funciona"
Edite manualmente no Console:

```javascript
// Tornar usuário PRO
let users = JSON.parse(localStorage.getItem('granamax_users'));
users[0].isPro = true;
localStorage.setItem('granamax_users', JSON.stringify(users));
// Recarregue a página
```

---

## 💡 DICAS DE USO

### 1. Múltiplas Contas
Você pode criar várias contas e testar diferentes cenários:
- Conta 1: Usuário free
- Conta 2: Usuário PRO
- Conta 3: Testes de investimentos

### 2. Dados de Exemplo
Adicione 10-15 transações variadas para ver os gráficos funcionando melhor.

### 3. Testar Módulo PRO
Para testar investimentos sem pagar:
```javascript
// Console do navegador (F12)
let users = JSON.parse(localStorage.getItem('granamax_users'));
users[0].isPro = true;
localStorage.setItem('granamax_users', JSON.stringify(users));
location.reload();
```

---

## 🎯 PRÓXIMOS PASSOS

### Depois de Testar Tudo:

1. **Gostou e quer só usar localmente?**
   - Continue assim! Funciona perfeitamente.

2. **Quer lançar oficialmente?**
   - Veja o `GUIA_LANCAMENTO.md`
   - Configure Firebase (seguro para produção)
   - Siga a estratégia de marketing

3. **Quer personalizar?**
   - Explore o código em `src/`
   - Mude cores, textos, funcionalidades
   - Adicione suas próprias features

---

## 📚 ARQUIVOS RELACIONADOS

- `COMECE_AQUI.md` - Guia principal
- `GUIA_LANCAMENTO.md` - Estratégia de lançamento
- `ROTEIROS_TIKTOK.md` - Marketing no TikTok
- `README.md` - Documentação técnica completa

---

## 🎉 COMECE A TESTAR!

Você tem **ZERO dependências externas** agora.

**Cole os 3 códigos acima, rode `npm run dev`, e explore!** 🚀

*Qualquer dúvida, veja os outros arquivos .md na raiz do projeto.*

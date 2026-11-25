// 📊 LIMITES DOS PLANOS GRANAMAX (GRÁTIS vs. PRO)

export const FREE_EXPENSE_LIMIT = 50;
export const FREE_INCOME_LIMIT = 10;
export const FREE_ALERT_LIMIT = 2;

export function getTransactionLimitError(type: 'income' | 'expense'): string {
  if (type === 'expense') {
    return `Limite do plano Grátis atingido (${FREE_EXPENSE_LIMIT} despesas). Exclua um lançamento ou ative o GranaMax PRO para registros ilimitados.`;
  }
  return `Limite do plano Grátis atingido (${FREE_INCOME_LIMIT} receitas). Exclua um lançamento ou ative o GranaMax PRO para registros ilimitados.`;
}

// 💳 HOOK DE IN-APP PURCHASES

import { useState, useEffect } from 'react';
import { iapService, PurchaseProduct, Purchase } from '../services/iap';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export function useIAP(userId: string | undefined) {
  const [products, setProducts] = useState<PurchaseProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Carregar produtos disponíveis
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      const availableProducts = await iapService.getProducts();
      setProducts(availableProducts);
      setLoading(false);
    };

    loadProducts();

    return () => {
      iapService.disconnect();
    };
  }, []);

  // Comprar produto
  const purchaseProduct = async (productId: string): Promise<boolean> => {
    if (!userId) {
      alert('Você precisa estar logado para assinar');
      return false;
    }

    setPurchasing(true);
    try {
      // Iniciar compra
      const purchase = await iapService.purchaseProduct(productId);
      
      if (purchase) {
        // Finalizar transação
        await iapService.finishTransaction(purchase);

        // Atualizar status PRO no Firestore
        await updateDoc(doc(db, 'users', userId), {
          isPro: true,
          proActivatedAt: new Date(),
          proProductId: productId,
          proTransactionId: purchase.transactionId,
        });

        alert('🎉 Parabéns! Você agora é PRO!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro na compra:', error);
      alert('Erro ao processar a compra. Tente novamente.');
      return false;
    } finally {
      setPurchasing(false);
    }
  };

  // Restaurar compras
  const restorePurchases = async (): Promise<boolean> => {
    if (!userId) {
      alert('Você precisa estar logado');
      return false;
    }

    setLoading(true);
    try {
      const purchases = await iapService.restorePurchases();
      
      if (purchases.length > 0) {
        // Usuário tem compras ativas
        await updateDoc(doc(db, 'users', userId), {
          isPro: true,
        });

        alert('✅ Compras restauradas com sucesso!');
        return true;
      } else {
        alert('ℹ️ Nenhuma compra encontrada');
        return false;
      }
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      alert('Erro ao restaurar compras');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    purchasing,
    purchaseProduct,
    restorePurchases,
  };
}

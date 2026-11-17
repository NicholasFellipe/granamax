// 💳 GOOGLE PLAY IN-APP PURCHASES SERVICE

/**
 * Este serviço gerencia as compras dentro do app via Google Play
 * 
 * IMPORTANTE: Para React Native, você precisa instalar:
 * npm install react-native-iap
 * 
 * Como este é um projeto React Web (Vite), a integração completa
 * só funcionará quando convertido para React Native ou usando Capacitor/Cordova
 */

export interface PurchaseProduct {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

export interface Purchase {
  productId: string;
  transactionId: string;
  transactionDate: number;
  purchaseToken: string;
}

// ID do produto de assinatura PRO no Google Play Console
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'granamax_pro_monthly', // R$ 9,90/mês
  PRO_YEARLY: 'granamax_pro_yearly',   // R$ 99,00/ano (economia de 17%)
};

/**
 * SIMULAÇÃO de In-App Purchase para ambiente web
 * No app real (React Native), isso seria substituído por react-native-iap
 */
class InAppPurchaseService {
  private isInitialized = false;

  /**
   * Inicializa a conexão com o Google Play Billing
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🔌 Inicializando Google Play Billing...');
      
      // Em React Native, usar:
      // import * as RNIap from 'react-native-iap';
      // await RNIap.initConnection();
      
      this.isInitialized = true;
      console.log('✅ Google Play Billing conectado');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar IAP:', error);
      return false;
    }
  }

  /**
   * Busca produtos disponíveis no Google Play
   */
  async getProducts(): Promise<PurchaseProduct[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Em React Native, usar:
      // const products = await RNIap.getSubscriptions([
      //   PRODUCT_IDS.PRO_MONTHLY,
      //   PRODUCT_IDS.PRO_YEARLY
      // ]);

      // Simulação para ambiente web
      return [
        {
          productId: PRODUCT_IDS.PRO_MONTHLY,
          title: 'GranaMax PRO - Mensal',
          description: 'Acesso completo aos recursos PRO por 1 mês',
          price: 'R$ 9,90',
          currency: 'BRL',
        },
        {
          productId: PRODUCT_IDS.PRO_YEARLY,
          title: 'GranaMax PRO - Anual',
          description: 'Acesso completo aos recursos PRO por 1 ano',
          price: 'R$ 99,00',
          currency: 'BRL',
        },
      ];
    } catch (error) {
      console.error('❌ Erro ao buscar produtos:', error);
      return [];
    }
  }

  /**
   * Inicia o fluxo de compra
   */
  async purchaseProduct(productId: string): Promise<Purchase | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🛒 Iniciando compra:', productId);

      // Em React Native, usar:
      // const purchase = await RNIap.requestSubscription(productId);
      
      // Simulação para ambiente web
      await new Promise(resolve => setTimeout(resolve, 1000));

      const simulatedPurchase: Purchase = {
        productId,
        transactionId: `txn_${Date.now()}`,
        transactionDate: Date.now(),
        purchaseToken: `token_${Math.random().toString(36).substring(7)}`,
      };

      console.log('✅ Compra realizada:', simulatedPurchase);
      return simulatedPurchase;
    } catch (error: any) {
      console.error('❌ Erro na compra:', error);
      
      // Tratamento de erros específicos
      if (error.code === 'E_USER_CANCELLED') {
        console.log('ℹ️ Usuário cancelou a compra');
      } else if (error.code === 'E_ALREADY_OWNED') {
        console.log('ℹ️ Usuário já possui este produto');
      }
      
      return null;
    }
  }

  /**
   * Restaura compras anteriores
   */
  async restorePurchases(): Promise<Purchase[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('🔄 Restaurando compras...');

      // Em React Native, usar:
      // const purchases = await RNIap.getAvailablePurchases();

      // Simulação para ambiente web
      return [];
    } catch (error) {
      console.error('❌ Erro ao restaurar compras:', error);
      return [];
    }
  }

  /**
   * Finaliza a compra (acknowledge)
   * IMPORTANTE: Sempre finalizar compras no Google Play para evitar reembolso automático
   */
  async finishTransaction(purchase: Purchase): Promise<boolean> {
    try {
      console.log('✅ Finalizando transação:', purchase.transactionId);

      // Em React Native, usar:
      // await RNIap.finishTransaction(purchase, false);

      return true;
    } catch (error) {
      console.error('❌ Erro ao finalizar transação:', error);
      return false;
    }
  }

  /**
   * Desconecta do Google Play Billing
   */
  async disconnect(): Promise<void> {
    if (this.isInitialized) {
      // Em React Native, usar:
      // await RNIap.endConnection();
      
      this.isInitialized = false;
      console.log('🔌 Desconectado do Google Play Billing');
    }
  }
}

export const iapService = new InAppPurchaseService();

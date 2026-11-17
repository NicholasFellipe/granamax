# 🚀 GUIA DE LANÇAMENTO - GRANAMAX

## 📋 CHECKLIST PRÉ-LANÇAMENTO

### 1. Configuração Firebase (OBRIGATÓRIO)
- [ ] Criar projeto no [Firebase Console](https://console.firebase.google.com/)
- [ ] Ativar Authentication (Email/Password)
- [ ] Criar banco Firestore
- [ ] Copiar credenciais para `src/config/firebase.ts`
- [ ] Configurar regras de segurança do Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem ler/escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    match /investments/{investmentId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 2. Instalação de Dependências
```bash
npm install
```

### 3. Testar Localmente
```bash
npm run dev
```

Abra http://localhost:5173 e teste:
- [ ] Landing page carrega
- [ ] Cadastro funciona
- [ ] Login funciona
- [ ] Adicionar transação
- [ ] Visualizar gráficos
- [ ] Modal de upgrade PRO

---

## 📱 PUBLICAR NA GOOGLE PLAY STORE

### Opção 1: Converter para React Native (RECOMENDADO)

O projeto atual é React Web. Para publicar na Play Store, você precisa:

1. **Instalar React Native CLI**
```bash
npx react-native init GranaMaxNative
```

2. **Migrar componentes** (estrutura já está pronta!)
   - Copiar components, hooks, services
   - Substituir divs por View, Text, etc.
   - Trocar CSS por StyleSheet

3. **Instalar dependências nativas**
```bash
npm install react-native-iap
npm install @react-native-firebase/app
npm install @react-native-firebase/auth
npm install @react-native-firebase/firestore
npm install react-native-charts-wrapper
```

4. **Configurar Google Play In-App Purchases**
   - No [Google Play Console](https://play.google.com/console)
   - Criar produtos: `granamax_pro_monthly` e `granamax_pro_yearly`
   - Configurar preços: R$ 9,90/mês e R$ 99,00/ano

5. **Gerar APK/AAB**
```bash
cd android
./gradlew bundleRelease
```

### Opção 2: Usar Capacitor (MAIS RÁPIDO)

Converter seu app React atual para Android:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init GranaMax com.granamax.app
npm install @capacitor/android
npx cap add android
npm run build
npx cap sync
npx cap open android
```

---

## 🎬 ESTRATÉGIA TIKTOK (VIRALIZAÇÃO)

### 📊 ESTATÍSTICAS QUE FUNCIONAM

**Melhor horário para postar:**
- Segunda a Sexta: 18h - 22h
- Sábado/Domingo: 10h - 14h e 19h - 23h

**Duração ideal:**
- 15-30 segundos (máximo engajamento)
- Até 60 segundos para tutoriais

### 🎯 ROTEIROS PRONTOS (COPIAR E COLAR)

#### ROTEIRO 1: "Problema → Solução" (30 seg)
```
[0-5s] GANCHO FORTE
"Se você ganha dinheiro mas nunca sobra, assiste isso..."

[5-15s] DOR
"Todo mês o mesmo ciclo:
• Recebe salário
• Paga contas
• Sobra ZERO
• Repete..."

[15-25s] SOLUÇÃO
"Eu criei esse app que mostra EXATAMENTE:
• Pra onde seu dinheiro vai
• Quanto você TEM QUE economizar
• Quando vai ACABAR se continuar assim"

[25-30s] CTA
"Link na bio pra testar GRÁTIS"
```

**Como gravar:**
- Você falando direto pra câmera
- Tela do app mostrando os recursos
- Cortes rápidos a cada 3-5 segundos

#### ROTEIRO 2: "Antes/Depois" (25 seg)
```
[0-5s] GANCHO
"Assim eu saí de R$ 0 no banco pra R$ 5.000 em 6 meses"

[5-15s] ANTES
"Antes: gastava tudo, não sabia onde
[mostra prints de conta zerada]"

[15-25s] DEPOIS
"Depois: usei esse app pra rastrear TUDO
[mostra gráfico crescendo no app]
Resultado: R$ 5k guardados"

[25s] CTA
"Baixa grátis, link na bio"
```

#### ROTEIRO 3: "3 Erros" (35 seg)
```
[0-5s] GANCHO
"3 coisas que te deixam pobre sem você perceber"

[5-15s] ERRO 1
"1. Não saber pra onde vai seu dinheiro
[mostra gastos pequenos somando]"

[15-25s] ERRO 2
"2. Não ter meta diária
[mostra meta no app]"

[25-30s] ERRO 3
"3. Não investir o que sobra
[mostra simulador]"

[30-35s] SOLUÇÃO + CTA
"Esse app resolve os 3. Link na bio"
```

#### ROTEIRO 4: "Tutorial Rápido" (45 seg)
```
[0-5s] GANCHO
"Como eu controlo meu dinheiro em menos de 2 min por dia"

[5-45s] TUTORIAL
[Screenrecord do app]
1. Abro o app
2. Adiciono o que gastei
3. Vejo quanto posso gastar HOJE
4. Pronto. Simples assim.

[45s] CTA
"Baixa grátis na bio"
```

#### ROTEIRO 5: "Estatística Chocante" (20 seg)
```
[0-5s] GANCHO
"Você perde R$ 1.200 por mês sem perceber"

[5-15s] EXPLICAÇÃO
"Pequenos gastos:
• Café: R$ 10/dia = R$ 300/mês
• Uber desnecessário: R$ 400
• Delivery: R$ 500
= R$ 1.200 perdidos"

[15-20s] SOLUÇÃO + CTA
"Esse app mostra isso. Link na bio"
```

### 📝 LEGENDAS QUE CONVERTEM

**Estrutura:**
```
[Emoji] [Gancho forte]
[Espaço]
[2-3 linhas de valor]
[Espaço]
[CTA clara]
[Hashtags]
```

**Exemplo:**
```
💰 Se você sempre fica sem dinheiro no fim do mês, isso vai mudar sua vida

App que mostra EXATAMENTE onde seu dinheiro está indo e quanto você precisa economizar TODO DIA

Link na bio pra baixar grátis 👆

#financas #dinheiro #investimentos #economia #brasil #renda #poupar
```

### 🏷️ HASHTAGS QUE FUNCIONAM

**Sempre usar (10-15 tags):**

**Alta Performance:**
- #financas
- #dinheiro
- #investimentos
- #economia
- #rendaextra

**Médio Alcance:**
- #poupar
- #economizar
- #controleFinanceiro
- #dinheiroNoCaixa
- #gestaoDeDinheiro

**Nicho Específico:**
- #investidor
- #investidorIniciante
- #bolsaDeValores
- #criptomoedas
- #educacaoFinanceira

### 📈 ESTRATÉGIA DE CRESCIMENTO (7 DIAS)

#### DIA 1-2: PREPARAÇÃO
- Criar conta TikTok profissional
- Bio: "💰 Aprenda a sobrar dinheiro todo mês | App grátis 👇"
- Link: seu site/app
- Gravar 10 vídeos (roteiros acima)

#### DIA 3-7: LANÇAMENTO AGRESSIVO
- **Postar 2x por dia** (10h e 20h)
- Responder TODOS os comentários
- Fazer duetos com vídeos sobre finanças
- Comentar em vídeos grandes do nicho

#### DIA 8-14: OTIMIZAÇÃO
- Analisar qual vídeo bombou
- Fazer 5 variações dele
- Testar horários diferentes
- Criar trends com seu app

### 🎯 OBJETIVOS REALISTAS

**Semana 1:**
- 1.000 - 5.000 visualizações/vídeo
- 50-200 seguidores
- 10-50 downloads

**Semana 2-4:**
- 10.000 - 50.000 visualizações/vídeo
- 500-2.000 seguidores
- 100-500 downloads

**Mês 2-3:**
- 100.000+ visualizações (1 vídeo viral)
- 5.000+ seguidores
- 1.000+ downloads

### 💰 QUANDO VIRALIZAR

**Sinais de viralização:**
- Vídeo passa de 10k views em 2h
- Comentários chegam a 100+
- Compartilhamentos sobem rápido

**O QUE FAZER:**
1. Poste uma variação do vídeo viral IMEDIATAMENTE
2. Fixe comentário com link
3. Faça live mostrando o app
4. Aproveite pra vender PRO com desconto

---

## 💵 COMO MONETIZAR RÁPIDO

### MÊS 1-2: VALIDAÇÃO
- **Meta:** 1.000 downloads
- **Foco:** Testar se as pessoas usam
- **Receita esperada:** R$ 0 - R$ 500 (primeiras assinaturas PRO)

### MÊS 3-6: CRESCIMENTO
- **Meta:** 10.000 downloads
- **Foco:** Otimizar retenção (alertas, conquistas)
- **Receita esperada:** R$ 5.000 - R$ 15.000/mês
- **Cálculo:** 10k users × 5% conversão PRO × R$ 9,90 = R$ 4.950

### MÊS 6-12: ESCALA
- **Meta:** 100.000 downloads
- **Foco:** Parcerias, afiliados, features premium
- **Receita esperada:** R$ 50.000 - R$ 150.000/mês
- **Cálculo:** 100k users × 5% × R$ 9,90 = R$ 49.500

---

## 🎬 EQUIPAMENTOS NECESSÁRIOS

**MÍNIMO (R$ 0):**
- Celular com câmera decente
- Luz natural (janela)
- App nativo do TikTok

**IDEAL (R$ 300-500):**
- Ring light pequena: R$ 150
- Microfone de lapela: R$ 150
- Tripé celular: R$ 50
- App CapCut (grátis) pra editar

---

## ⚠️ ERROS QUE VÃO TE FAZER PERDER TEMPO

❌ **Não faça:**
- Postar sem estratégia
- Copiar vídeos de outros apps
- Comprar seguidores
- Desistir antes de 30 dias
- Falar só de features (FALE DE BENEFÍCIOS)

✅ **Faça:**
- Ser consistente (2x/dia por 30 dias)
- Testar vários formatos
- Responder comentários
- Analisar métricas
- Focar em RESULTADO pro usuário

---

## 📊 MÉTRICAS PRA ACOMPANHAR

**TikTok:**
- Taxa de conclusão (>70% = bom)
- Comentários por view (>1% = viral)
- Compartilhamentos (quanto mais, melhor)

**App:**
- DAU (Daily Active Users)
- Taxa de conversão pra PRO
- Churn rate (quantos cancelam)
- LTV (Lifetime Value)

---

## 🎯 PRÓXIMOS PASSOS (ORDEM)

1. ✅ **Configurar Firebase** (1h)
2. ✅ **Testar app localmente** (30min)
3. ✅ **Gravar 10 vídeos** (2h)
4. ✅ **Criar conta TikTok** (10min)
5. ✅ **Postar primeiro vídeo** (5min)
6. ✅ **Repetir por 30 dias** (2h/dia)

---

## 💡 DICA FINAL (IMPORTANTE)

**Não espere perfeição.**

Seu primeiro vídeo vai ser ruim. Normal.
Seus primeiros 100 users vão achar bugs. Normal.
Você vai querer desistir na semana 2. Normal.

**A diferença entre quem fatura e quem não fatura:**
👉 Quem fatura CONTINUA postando mesmo sem resultado imediato.

**Lembre-se:**
- Todo app grande começou pequeno
- Todo creator começou com 0 views
- Você já tem o produto pronto (90% do trabalho)
- Agora é só DIVULGAR

---

## 🆘 PRECISA DE AJUDA?

**Problemas técnicos:**
- Firebase: [Documentação](https://firebase.google.com/docs)
- React: [Documentação](https://react.dev)

**Crescimento:**
- Analise creators de finanças no TikTok
- Veja o que funciona e adapte pro seu app

---

Você tem tudo pronto. Agora é EXECUTAR! 🚀

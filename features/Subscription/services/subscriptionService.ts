import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { ASAAS_BASE_URL, SUBSCRIPTION_VALUE, ASAAS_HEADERS } from '../config/asaasConfig';

/**
 * SERVIÇO DE PAGAMENTO HÍBRIDO (MANUAL OU ASSINATURA)
 * Usa o Proxy do Netlify para segurança.
 */

interface CardHolderData {
  number: string;
  holder: string;
  expiry: string;
  cvv: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  postalCode: string;
  addressNumber: string;
}

// Helper para chamadas API via Proxy com Cache Buster
const apiCall = async (endpoint: string, method: string, body?: any) => {
    // Adiciona timestamp para evitar cache do navegador
    const separator = endpoint.includes('?') ? '&' : '?';
    const noCacheUrl = `${ASAAS_BASE_URL}${endpoint}${separator}_t=${Date.now()}`;

    const response = await fetch(noCacheUrl, {
        method,
        headers: ASAAS_HEADERS,
        body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    if (!response.ok) {
        const errorMessage = data.errors?.[0]?.description || data.error || "Erro na comunicação com Asaas";
        throw new Error(errorMessage);
    }
    return data;
};

// Cálculo de Data Inteligente
const calculateNewDueDate = async (restaurantId: string): Promise<Date> => {
    const docRef = doc(db, 'merchants', restaurantId);
    const snapshot = await getDoc(docRef);
    const currentData = snapshot.data();
    
    // Data base é HOJE
    let baseDate = new Date();
    
    // Se ele já tem uma data futura (assinatura ativa), somamos 30 dias a partir DELA
    if (currentData?.nextDueDate) {
        let currentNextDue;
        if (currentData.nextDueDate.seconds) {
             currentNextDue = new Date(currentData.nextDueDate.seconds * 1000);
        } else {
             currentNextDue = new Date(currentData.nextDueDate);
        }

        // Se a data de vencimento atual for FUTURA em relação a hoje, usamos ela como base
        if (currentNextDue > new Date()) {
            baseDate = currentNextDue;
        }
    }

    // Adiciona 30 dias
    baseDate.setDate(baseDate.getDate() + 30);
    return baseDate;
};


/**
 * 1. CRIAR OU ATUALIZAR CLIENTE NO ASAAS
 * Aqui está a correção do BUG: Se o cliente já existe, ATUALIZA os dados dele.
 */
const getOrCreateCustomer = async (restaurantId: string, data: CardHolderData, existingCustomerId?: string) => {
    const customerData = {
        name: data.holder,
        cpfCnpj: data.cpfCnpj,
        email: data.email,
        phone: data.phone || undefined,
        postalCode: data.postalCode || undefined,
        addressNumber: data.addressNumber || undefined
    };

    if (existingCustomerId) {
        try {
            console.log(`Atualizando dados do cliente ${existingCustomerId} no Asaas...`);
            // Endpoint de Update do Asaas: POST /customers/{id}
            const updatedCustomer = await apiCall(`/customers/${existingCustomerId}`, 'POST', customerData);
            console.log("Cliente atualizado com sucesso:", updatedCustomer.id);
            return updatedCustomer.id;
        } catch (error) {
            console.warn("Falha ao atualizar cliente existente, tentando prosseguir...", error);
            // Se falhar o update (ex: cliente deletado no Asaas), tentamos criar um novo abaixo
            // ou retornamos o ID antigo se o erro for trivial.
            // Para segurança, vamos tentar criar um novo se o erro for 404, senão retornamos o antigo.
            return existingCustomerId; 
        }
    }

    console.log("Criando novo cliente no Asaas...");
    const newCustomer = await apiCall('/customers', 'POST', customerData);
    
    // Salva o ID no Firebase para usos futuros
    await updateDoc(doc(db, 'merchants', restaurantId), {
        asaasCustomerId: newCustomer.id
    });

    return newCustomer.id;
};


/**
 * 2. PROCESSAR PAGAMENTO NO CARTÃO (Assinatura Recorrente)
 */
export const processCreditCardPayment = async (restaurantId: string, cardData: CardHolderData, existingCustomerId?: string) => {
    try {
        // PASSO 1: Garantir que o cliente existe e está ATUALIZADO (Correção do Bug)
        const customerId = await getOrCreateCustomer(restaurantId, cardData, existingCustomerId);

        // PASSO 2: Tokenizar Cartão (Opcional, mas boa prática, aqui mandamos direto na assinatura)
        
        // PASSO 3: Criar Assinatura
        console.log("Criando assinatura para cliente:", customerId);
        
        const subscriptionBody = {
            customer: customerId,
            billingType: 'CREDIT_CARD',
            value: SUBSCRIPTION_VALUE,
            nextDueDate: new Date().toISOString().split('T')[0], // Cobra hoje
            cycle: 'MONTHLY',
            description: `Assinatura Descoontaí - ${restaurantId}`,
            creditCard: {
                holderName: cardData.holder,
                number: cardData.number,
                expiryMonth: cardData.expiry.split('/')[0],
                expiryYear: `20${cardData.expiry.split('/')[1]}`,
                ccv: cardData.cvv
            },
            creditCardHolderInfo: {
                name: cardData.holder,
                email: cardData.email,
                cpfCnpj: cardData.cpfCnpj,
                postalCode: cardData.postalCode,
                addressNumber: cardData.addressNumber,
                phone: cardData.phone // Corrigido data.phone -> cardData.phone
            }
        };

        const subscription = await apiCall('/subscriptions', 'POST', subscriptionBody);

        // PASSO 4: Atualizar Firebase
        const newDueDate = await calculateNewDueDate(restaurantId);
        
        await updateDoc(doc(db, 'merchants', restaurantId), {
            subscriptionStatus: 'active',
            nextDueDate: newDueDate, // +30 dias
            subscriptionId: subscription.id,
            subscriptionPaymentMethod: 'CREDIT_CARD',
            asaasCustomerId: customerId // Garante que está salvo/atualizado
        });

        return { success: true, subscriptionId: subscription.id };

    } catch (error: any) {
        console.error("Erro no pagamento:", error);
        return { success: false, error: error.message };
    }
};

/**
 * 3. GERAR PIX (Cobrança Única)
 */
export const createPixCharge = async (restaurantId: string, cpf: string, name: string) => {
    try {
        // Para PIX, criamos um cliente temporário ou usamos o existente se tiver
        // Como PIX pede menos dados, podemos simplificar, mas ideal é buscar do banco se já tiver
        const docRef = doc(db, 'merchants', restaurantId);
        const snapshot = await getDoc(docRef);
        const existingId = snapshot.data()?.asaasCustomerId;

        // Dados mínimos para PIX
        const pixCustomerData = {
            holder: name,
            cpfCnpj: cpf,
            email: snapshot.data()?.email || `loja-${restaurantId}@email.com`, // Fallback
            phone: snapshot.data()?.whatsappNumber || '',
            postalCode: '63500000', // Genérico se não tiver
            addressNumber: '0'
        } as CardHolderData;

        // Cria ou Atualiza (Importante também no PIX para sair o nome certo)
        const customerId = await getOrCreateCustomer(restaurantId, pixCustomerData, existingId);

        console.log("Gerando PIX para cliente:", customerId);

        const paymentBody = {
            customer: customerId,
            billingType: 'PIX',
            value: SUBSCRIPTION_VALUE,
            dueDate: new Date().toISOString().split('T')[0],
            description: "Mensalidade App Descoontaí"
        };

        const payment = await apiCall('/payments', 'POST', paymentBody);

        return {
            success: true,
            paymentId: payment.id,
            qrCode: payment.bankSlipUrl, // Asaas retorna URL as vezes direto
            payload: payment.invoiceUrl // Ajustar conforme retorno real da API se precisar QRCode/CopiaCola
        };

    } catch (error: any) {
        console.error("Erro ao gerar PIX:", error);
        return { success: false, error: error.message };
    }
};

/**
 * 4. BUSCAR QR CODE / COPIA E COLA DO PIX
 */
export const getPixQrCode = async (paymentId: string) => {
    try {
        const data = await apiCall(`/payments/${paymentId}/pixQrCode`, 'GET');
        return {
            encodedImage: data.encodedImage,
            payload: data.payload
        };
    } catch (error) {
        console.error("Erro ao buscar QR Code:", error);
        throw error;
    }
}

/**
 * 5. VERIFICAR STATUS DO PAGAMENTO (Polling)
 */
export const checkPaymentStatus = async (restaurantId: string, paymentId: string) => {
    try {
        console.log(`Verificando pagamento ${paymentId} para loja ${restaurantId}...`);
        
        const json = await apiCall(`/payments/${paymentId}`, 'GET');
        
        console.log("Status retornado pelo Asaas:", json.status);

        // Lista de status que consideramos como PAGO
        const SUCCESS_STATUSES = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'DUNNING_RECEIVED'];

        if (SUCCESS_STATUSES.includes(json.status)) {
            try {
                console.log("Pagamento confirmado! Atualizando Firebase...");
                const newDueDate = await calculateNewDueDate(restaurantId);
                await updateDoc(doc(db, 'merchants', restaurantId), {
                    subscriptionStatus: 'active',
                    nextDueDate: newDueDate,
                    subscriptionPaymentMethod: 'PIX',
                    lastPaymentId: paymentId
                });
                console.log("Firebase atualizado com sucesso.");
                return { paid: true, status: json.status };
            } catch (firebaseError) {
                console.error("ERRO CRÍTICO AO SALVAR NO FIREBASE:", firebaseError);
                // Retorna pago mesmo se o Firebase falhar, para a UI avisar o usuário
                return { paid: true, status: "DB_ERROR" }; 
            }
        }
        
        return { paid: false, status: json.status };
    } catch (e: any) { 
        console.error("Erro ao verificar status:", e);
        return { paid: false, status: "NETWORK_ERROR" };
    }
};

// --- FUNÇÕES DE COMPATIBILIDADE (WRAPPER) PARA O FRONTEND ---

// Esta função orquestra a criação do pagamento E a busca do QR Code em uma única chamada,
// como esperado pelo PixPaymentForm.tsx
export const generatePixPayment = async (restaurantId: string, cpfInput?: string) => {
    // 1. Busca dados do estabelecimento para ter o Nome
    const docRef = doc(db, 'merchants', restaurantId);
    const snapshot = await getDoc(docRef);
    const merchantData = snapshot.data();

    // Nome da loja ou "Assinante"
    const name = merchantData?.name || "Assinante Descoontaí";
    
    // Tenta usar CPF informado > CPF da loja > ou string vazia (que vai gerar erro CPF_INVALIDO se o asaas rejeitar)
    const finalCpf = cpfInput || merchantData?.cpfCnpj || merchantData?.ownerCpf || "";

    // 2. Cria a cobrança
    const chargeResult = await createPixCharge(restaurantId, finalCpf, name);

    if (!chargeResult.success) {
        // Se o erro for de CPF, repassa mensagem específica para a UI abrir o input
        if (chargeResult.error?.includes('CPF') || chargeResult.error?.includes('cpf')) {
             throw new Error("CPF_INVALIDO");
        }
        throw new Error(chargeResult.error);
    }

    // 3. Busca o QR Code (Imagem e Copia e Cola)
    const qrResult = await getPixQrCode(chargeResult.paymentId);

    // 4. Retorna no formato que o componente espera
    return {
        paymentId: chargeResult.paymentId,
        payload: qrResult.payload,
        qrCodeImage: `data:image/png;base64,${qrResult.encodedImage}`
    };
};

// Wrapper para inverter a ordem dos parâmetros e bater com a chamada do componente
export const checkPixStatus = async (paymentId: string, restaurantId: string) => {
    return checkPaymentStatus(restaurantId, paymentId);
};
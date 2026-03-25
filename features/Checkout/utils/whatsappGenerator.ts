import { Product, Restaurant, CartItem } from '../../../types';

interface WhatsAppMessageData {
  customerName: string;
  paymentMethod: string;
  orderType: 'delivery' | 'pickup';
  items: CartItem[]; 
  total: number;
  deliveryFee: number;
  address?: string;
  changeFor?: string;
  couponCode?: string;
  discountAmount?: number;
}

export const generateWhatsAppLink = (
  restaurant: Restaurant,
  data: WhatsAppMessageData
): string => {
  // 1. Saudação e Cabeçalho
  let message = `*NOVO PEDIDO - Descoontaí* 🚀\n\n`;
  message += `👤 *Cliente:* ${data.customerName}\n`;
  message += `🏪 *Loja:* ${restaurant.name}\n`;
  message += `--------------------------------\n`;

  // 2. Lista de Itens Detalhada
  message += `*📋 RESUMO DO PEDIDO:*\n\n`;

  data.items.forEach((item) => {
    
    // Lista Adicionais
    let addonsText = '';
    
    if (item.selectedGroups && item.selectedGroups.length > 0) {
      item.selectedGroups.forEach(group => {
        if (group.items && group.items.length > 0) {
          group.items.forEach((addon: any) => {
             // Formata: + Bacon (R$ 3,00)
             const addonPrice = addon.price > 0 ? `(R$ ${addon.price.toFixed(2)})` : '(Grátis)';
             addonsText += `   + ${addon.name} ${addonPrice}\n`;
          });
        }
      });
    }

    // Linha principal: 2x X-Tudo (R$ 25,00 cada)
    message += `*${item.quantity}x ${item.name}* (R$ ${item.price.toFixed(2)}/un)\n`;
    
    if (addonsText) message += `${addonsText}`;
    
    // Cálculo do total da linha para exibição no Zap (Preço Base + Adicionais * Qtd)
    let itemTotalUnit = item.price;
    if (item.selectedGroups) {
      item.selectedGroups.forEach(g => g.items.forEach(i => itemTotalUnit += i.price));
    }
    const lineTotal = itemTotalUnit * item.quantity;
    
    message += `   = R$ ${lineTotal.toFixed(2)}\n`;

    if (item.notes) message += `   📝 _Obs: ${item.notes}_\n`;
    message += `\n`;
  });

  message += `--------------------------------\n`;

  // 3. Totais Financeiros (Lógica Blindada)
  message += `*💰 VALORES:*\n`;
  
  // Recalcula o subtotal dos produtos baseados nos itens
  const productsTotal = data.items.reduce((acc, item) => {
      let unit = item.price;
      if (item.selectedGroups) item.selectedGroups.forEach(g => g.items.forEach(i => unit += i.price));
      return acc + (unit * item.quantity);
  }, 0);

  message += `📦 Subtotal Produtos: R$ ${productsTotal.toFixed(2)}\n`;
  
  // Exibe Cupom se houver
  const discount = data.couponCode && data.discountAmount ? data.discountAmount : 0;
  if (discount > 0) {
     message += `🎫 Cupom (${data.couponCode}): - R$ ${discount.toFixed(2)}\n`;
  }

  // Verifica entrega
  const deliveryFee = data.orderType === 'delivery' ? data.deliveryFee : 0;
  if (data.orderType === 'delivery') {
      message += `🚚 Taxa de Entrega: ${deliveryFee === 0 ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}\n`;
  } else {
      message += `🏃 Taxa de Retirada: Grátis\n`;
  }
  
  // SOMA BLINDADA: Produtos - Desconto + Entrega
  // Isso garante que o valor exibido no WhatsApp seja matematicamente indiscutível.
  const verifiedTotal = productsTotal - discount + deliveryFee;

  message += `\n*TOTAL FINAL: R$ ${verifiedTotal.toFixed(2)}*\n`;
  
  message += `--------------------------------\n`;

  // 4. Pagamento e Entrega
  message += `*📍 DADOS DE ENTREGA:*\n`;
  
  if (data.orderType === 'pickup') {
    message += `🏃 *Tipo:* Retirada no Balcão\n`;
  } else {
    message += `🛵 *Tipo:* Entrega\n`;
    message += `🏡 *Endereço:* ${data.address || 'Não informado'}\n`;
  }

  message += `\n💳 *Pagamento:* ${data.paymentMethod}\n`;
  if (data.changeFor) {
    message += `💵 *Troco para:* R$ ${data.changeFor}\n`;
  }

  message += `\n--------------------------------\n`;
  message += `📲 _Pedido gerado via Descoontaí App_`;

  // 5. Geração do Link Seguro
  const phoneNumber = restaurant.whatsappNumber.replace(/\D/g, '');
  
  return `https://api.whatsapp.com/send?phone=55${phoneNumber}&text=${encodeURIComponent(message)}`;
};
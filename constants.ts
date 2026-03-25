import { Category } from './types';

export const IGUATU_NEIGHBORHOODS = [
  "Aeroporto",
  "Altiplano I",
  "Altiplano II",
  "Alto do Jucá",
  "Alvorada",
  "Areias I",
  "Areias II",
  "Barreiras",
  "Barro Alto",
  "Baú",
  "Brasília",
  "Bugi",
  "Cajazeiras",
  "Cajueiro",
  "Centro",
  "Chapadinha",
  "Cocobó",
  "Cohab I",
  "Cohab II",
  "Cohab III",
  "Distrito de Alencar",
  "Esplanada I",
  "Esplanada II",
  "Esplendor",
  "Filadélfia",
  "Flores",
  "Fomento",
  "Gadelha",
  "Industrial",
  "Jardim Oásis",
  "João Paulo II",
  "Lagoa Park",
  "Lagoa Seca (Bairro Urbano)",
  "Mirante",
  "Mirante 2",
  "Novo Iguatu",
  "Novo Oriente",
  "Paraná",
  "Parque Dois Irmãos",
  "Parque e Jardins",
  "Penha",
  "Planalto",
  "Pôr do Sol",
  "Pôr do Sol II",
  "Prado",
  "Premier",
  "Riacho Vermelho",
  "Royal Ville",
  "Santo Antônio",
  "Sete de Setembro",
  "Suassurana",
  "Tabuleiro",
  "Varjota",
  "Veneza",
  "Verde Park",
  "Vila Centenário",
  "Vila Cidão",
  "Vila Coqueiros",
  "Vila Jardim",
  "Vila Moura",
  "Vila Neuma",
  "Vila Operária"
].sort();

// Lista completa de métodos disponíveis para o lojista selecionar
export const AVAILABLE_PAYMENT_METHODS = [
  'PIX',
  'Dinheiro',
  'Cartão de Crédito',
  'Cartão de Débito'
];

// Mantido para compatibilidade, mas o App deve preferir usar a config do restaurante
export const PAYMENT_METHODS = AVAILABLE_PAYMENT_METHODS;

// Categorias GERAIS do App (Filtros da Home e Cadastro de Loja)
export const CATEGORIES: Category[] = [
  { id: 'all', name: 'Todos' },
  { id: 'pizzaria', name: 'Pizzaria' },
  { id: 'hamburgueria', name: 'Hambúrgueria' },
  { id: 'salgaderia', name: 'Salgaderia' },
  { id: 'pastelaria', name: 'Pastelaria' },
  { id: 'sushi', name: 'Sushis' },
  { id: 'tapiocaria', name: 'Tapiocaria' },
  { id: 'acai', name: 'Açaí' },
  { id: 'sorvete', name: 'Sorvetes' },
  { id: 'espetinho', name: 'Espetinhos' },
  { id: 'cafeteria', name: 'Cafeteria' },
  { id: 'deposito de bebidas', name: 'Depósito de bebidas' },
  { id: 'agua', name: 'Depósitos de Água' },
  { id: 'hortifruti', name: 'Hortifruti' },
  { id: 'mercantil', name: 'Mercantil' },
  { id: 'frigorifico', name: 'Frigorífico' },
  { id: 'padaria', name: 'Padaria' },
  { id: 'doces', name: 'Doces e Bolos' },
  { id: 'marmitaria', name: 'Marmitarias' },
  { id: 'churrascaria', name: 'Churrascaria' },
  { id: 'farmacia', name: 'Farmácia' },
  { id: 'petshop', name: 'Petshop' },
];

// NOVA LISTA: Categorias Específicas para Busca de Produto / Promoções (Stories)
// IDs mantidos compatíveis com o sistema, Nomes atualizados conforme solicitação.
export const PRODUCT_SEARCH_CATEGORIES = [
 // --- JÁ EXISTENTES (Mantidos) ---
  { id: 'hamburgueria', name: 'Burger' },
  { id: 'pizzaria', name: 'Pizza' },
  { id: 'pastelaria', name: 'Pastel' },
  { id: 'sushi', name: 'Sushi' },
  { id: 'salgaderia', name: 'Salgados' }, // Ajustei para plural, soa mais natural
  { id: 'acai', name: 'Açaí' },
  { id: 'sorvete', name: 'Sorvetes' },
  { id: 'marmitaria', name: 'Marmitas' },
  { id: 'doces', name: 'Doces e Bolos' },
  { id: 'espetinho', name: 'Espetinho' },
  { id: 'farmacia', name: 'Farmácia' },
  { id: 'mercantil', name: 'Mercado' }, // 'Mercado' ou 'Supermercado' é mais comum que Mercantil em algumas regiões
  { id: 'agua', name: 'Água e Gás' },   // Gás é muito comum vender junto

  // --- BEBIDAS (Essencial) ---
  { id: 'bebidas', name: 'Bebidas' }, // Geral
  { id: 'cerveja', name: 'Cervejas' },
  { id: 'adega', name: 'Adega e Vinhos' },
  { id: 'sucos', name: 'Sucos Naturais' },
  { id: 'cafe', name: 'Cafeteria' },

  // --- LANCHES RÁPIDOS & COMIDA DE RUA ---
  { id: 'cachorro_quente', name: 'Hot Dog' },
  { id: 'frango_frito', name: 'Frango Frito' }, // Estilo balde (muito popular)
  { id: 'batata', name: 'Batata Recheada' },
  { id: 'tapioca', name: 'Tapioca' },
  { id: 'crepe', name: 'Crepes' },
 
  // --- CULINÁRIA INTERNACIONAL ---
  { id: 'arabe', name: 'Comida Árabe' }, // Esfihas, Kibe
  { id: 'chinesa', name: 'Chinesa' }, // Yakisoba
  { id: 'italiana', name: 'Massas e Italiana' },
  
  // --- REFEIÇÕES & TRADICIONAIS ---
  { id: 'brasileira', name: 'Comida Brasileira' }, // Feijoada, Prato Feito
  { id: 'churrasco', name: 'Churrasco' },
  { id: 'frutos_do_mar', name: 'Frutos do Mar' },
  { id: 'peixes', name: 'Peixes' },
  { id: 'sopas', name: 'Caldos e Sopas' },

  // --- ESTILO DE VIDA & DIETA ---
  { id: 'saudavel', name: 'Saudável' },
  { id: 'vegetariana', name: 'Vegetariana' },
 

 
  // --- PADARIA & CAFÉ DA MANHÃ ---
  { id: 'padaria', name: 'Padaria' },

  // --- CONVENIÊNCIA & OUTROS ---
  { id: 'hortifruti', name: 'Hortifruti' },
  { id: 'acougue', name: 'Açougue' },
  { id: 'petshop', name: 'Pet Shop' }, // Itens para pets são muito buscados
];
import React from 'react';
import { Utensils } from 'lucide-react';

/* LISTA DE ÍCONES (CARREGADOS DIRETO DA NUVEM/GITHUB) */
const ICON_MAP: Record<string, string> = {
  // ✅ Ícone "Todos" adicionado:
  'all': 'https://github.com/descoontai-ops/imagenspp/blob/main/todos.png?raw=true',
  
  // Demais ícones:
  'pizzaria': 'https://github.com/descoontai-ops/imagenspp/blob/main/pizza.png?raw=true',
  'hamburgueria': 'https://github.com/descoontai-ops/imagenspp/blob/main/burger.png?raw=true',
  'salgaderia': 'https://github.com/descoontai-ops/imagenspp/blob/main/croissant.png?raw=true',
  'pastelaria': 'https://github.com/descoontai-ops/imagenspp/blob/main/pastel.png?raw=true',
  'tapiocaria': 'https://github.com/descoontai-ops/3D-Categorias2/blob/main/tapiocaria.png?raw=true',
  'sushi': 'https://github.com/descoontai-ops/imagenspp/blob/main/sushi.png?raw=true',
  'acai': 'https://github.com/descoontai-ops/imagenspp/blob/main/acai.png?raw=true',
  'sorvete': 'https://github.com/descoontai-ops/imagenspp/blob/main/sorvete.png?raw=true',
  'espetinho': 'https://github.com/descoontai-ops/imagenspp/blob/main/espetinho.png?raw=true',
  'cafeteria': 'https://github.com/descoontai-ops/3D-Categorias2/blob/main/cafeteria.png?raw=true',
  'padaria': 'https://github.com/descoontai-ops/3D-Categorias2/blob/main/padaria.png?raw=true',
  'agua': 'https://github.com/descoontai-ops/imagenspp/blob/main/agua.png?raw=true',
  'deposito de bebidas': 'https://github.com/descoontai-ops/3D-Categorias2/blob/main/bebidas.png?raw=true',
  'mercantil': 'https://github.com/descoontai-ops/imagenspp/blob/main/mercado.png?raw=true',
  'frigorifico': 'https://github.com/descoontai-ops/3D-Categorias2/blob/main/frigorifico.png?raw=true',
  'hortifruti': 'https://github.com/descoontai-ops/3D-Categorias2/blob/main/hortfruti.png?raw=true',
  'doces': 'https://github.com/descoontai-ops/imagenspp/blob/main/bolo.png?raw=true',
  'marmitaria': 'https://github.com/descoontai-ops/imagenspp/blob/main/marmita.png?raw=true',
  'churrascaria': 'https://github.com/descoontai-ops/imagenspp/blob/main/carne.png?raw=true',
  'farmacia': 'https://github.com/descoontai-ops/imagenspp/blob/main/remedio.png?raw=true',
  'petshop': 'https://github.com/descoontai-ops/3D-Categorias2/blob/main/petshop.png?raw=true',
};

export const getCategoryIcon = (id: string, size: number = 24) => {
  const imageUrl = ICON_MAP[id];

  if (imageUrl) {
    return (
      <img 
        src={imageUrl} 
        alt={id}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          objectFit: 'contain',
          filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))'
        }}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  return <Utensils size={size} className="text-gray-300 opacity-50" />;
};
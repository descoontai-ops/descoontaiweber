import React from 'react';
import { CATEGORIES } from '../../../constants';
import { useFilter } from '../context/FilterContext';
import { getCategoryIcon } from '../utils/categoryIcons';

export const CategoryList: React.FC = () => {
  const { selectedCategoryId, setSelectedCategoryId } = useFilter();

  return (
    <div className="flex space-x-4 overflow-x-auto pb-6 pt-2 no-scrollbar px-4 items-start">
      {CATEGORIES.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        const isAll = cat.id === 'all'; // Verifica se é o botão "Todos"
        
        return (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            title={cat.name} // Tooltip para passar o mouse (útil já que removemos os nomes)
            className="flex flex-col items-center gap-2 group min-w-[70px]"
          >
            {/* Container do Ícone */}
            <div 
              className={`
                flex items-center justify-center p-3 rounded-2xl transition-all duration-300 relative
                ${isSelected 
                  ? 'bg-brand-50 border-2 border-brand-500 shadow-[0_8px_16px_rgb(0,0,0,0.1)] transform scale-105' 
                  : 'bg-white border border-gray-100 group-hover:bg-gray-50 group-hover:shadow-md'
                }
              `}
              style={{ 
                width: '70px', 
                height: '70px' 
              }}
            >
              <div className="transform transition-transform duration-300 group-hover:scale-110 drop-shadow-sm">
                 {getCategoryIcon(cat.id, 45)}
              </div>
              
              {/* REMOVIDO: Ponto vermelho de seleção */}
            </div>

            {/* Texto "Todos": Aparece APENAS no ícone 'all' */}
            {isAll && (
              <span className={`
                text-xs font-bold text-center leading-tight
                ${isSelected ? 'text-brand-700' : 'text-gray-500 group-hover:text-gray-900'}
              `}>
                Todos
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Sparkles, Check, AlertTriangle, Save, Store, Utensils, IceCream, Pizza, Coffee, Layers, CheckSquare } from 'lucide-react';
import { AddonGroup, AddonItem, GroupType } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface MerchantGroupManagerProps {
  groups: AddonGroup[];
  onUpdateGroups: (newGroups: AddonGroup[]) => void;
}

// ------------------------------------------------------------------
// ÁREA DE CONFIGURAÇÃO MANUAL (AQUI VOCÊ MANDA)
// ------------------------------------------------------------------

// 1. Defina aqui as abas que você quer ver no topo
const SECTIONS = [
  "Adicionais Açai",
  "Adicionais Hamburgueria",
  "Adicionais Pizzaria",
  "Adicionais Sorveteria",
  "Adicionais Churrascaria",
  "Adicionais Japonesa",
  "Adicionais Gerais"
];

// 2. Defina aqui QUAIS TIPOS de grupo aparecem em CADA ABA
// Se você não colocar uma aba aqui, ela vai mostrar TODOS os tipos.
const MANUAL_RULES: Record<string, GroupType[]> = {
  "Adicionais Açai": [
    'tipo_de_acai', 
    'escolha_o_creme', 
    'adicional_gratis',
    'adicional',
    'cobertura', 
    'colher'
  ],
  "Adicionais Hamburgueria": [
    'adicional',
    'tipo_de_pao', 
    'adicional_gratis', 
    'proteina', // Ex: Ponto da carne
    'opcao',
    'ponto_da_carne', 
    'acompanhamento' // Ex: Batata Frita
  ],
  "Adicionais Pizzaria": [
    'sabores', 
    'bordas',
    'adicional', 
    'ponto_da_carne',
    'opcao' // Ex: Massa Fina/Grossa
  ],
  "Adicionais Sorveteria": [
    'sabores',
    'cobertura',
    'adicional',
    'acompanhamento' // Ex: Casquinha extra
  ],
  "Adicionais Churrascaria": [
    'proteina',
    'ponto_da_carne',
    'tamanho',
    'guarnicao', // Ex: Arroz, Farofa
    'adicional'
  ],
  "Adicionais Japonesa": [
    'opcao', // Ex: Grelhado ou Cru
    'adicional', 
    'recheio',
    'molho',// Ex: Cream Cheese extra
    'adicional_gratis' // Ex: Hashi, Shoyu
  ],
  "Adicionais Gerais": [
    'adicional',
    'adicional_gratis', 
    'acompanhamento',
    'cobertura',
    'guarnicao',
    'proteina',
    'tamanho',
    'bordas',
    'tipo_de_pao',
    'ponto_da_carne',
    'opcao',
    'sabores',
    'recheio',
    'tipo_de_acai',
    'escolha_o_creme',
    'colher'
  ]
};

// ------------------------------------------------------------------

// Dicionário de Correção Automática
const FOOD_CORRECTIONS: Record<string, string> = {
  'parmezao': 'Parmesão', 'parmesao': 'Parmesão', 'musarela': 'Mussarela', 'mussarela': 'Mussarela',
  'calabreza': 'Calabresa', 'bacon': 'Bacon', 'cheedar': 'Cheddar', 'chedar': 'Cheddar',
  'catupiri': 'Catupiry', 'maionese': 'Maionese', 'ketchup': 'Ketchup', 'barbecue': 'Barbecue',
  'rucula': 'Rúcula', 'manjericao': 'Manjericão', 'cebola': 'Cebola', 'ovo': 'Ovo', 'presunto': 'Presunto',
  'batata frita': 'Batata Frita', 'pure': 'Purê', 'frango': 'Frango', 'carne': 'Carne', 'leite ninho': 'Leite Ninho',
  'morango': 'Morango', 'nutela': 'Nutella', 'confete': 'Confete', 'pacoca': 'Paçoca', 'granola': 'Granola'
};

// Lista completa de todos os tipos disponíveis no sistema
const ALL_GROUP_TYPES: { id: GroupType; label: string }[] = [
  { id: 'adicional', label: 'Adicionais Pagos' },
  { id: 'adicional_gratis', label: 'Adicionais Inclusos (Grátis)' },
  { id: 'tipo_de_acai', label: 'Tipo de Açai (Obrigatório)' },
  { id: 'tipo_de_pao', label: 'Tipo de Pão' },
  { id: 'bordas', label: 'Bordas' },
  { id: 'escolha_o_creme', label: 'Escolha o Creme' },
  { id: 'sabores', label: 'Escolha os Sabores' },
  { id: 'colher', label: 'Colher / Talher' },
  { id: 'tamanho', label: 'Tamanho (Inteiro/Meio)' },
  { id: 'acompanhamento', label: 'Acompanhamentos' }, 
  { id: 'molho', label: 'Molho' }, 
  { id: 'recheio', label: 'Recheio' }, 
  { id: 'ponto_da_carne', label: 'Ponto da carne' }, 
  { id: 'cobertura', label: 'Coberturas' },
  { id: 'guarnicao', label: 'Guarnições' },
  { id: 'proteina', label: 'Proteínas / Carnes' },
  { id: 'opcao', label: 'Opções de Preparo' },
];

export const MerchantGroupManager: React.FC<MerchantGroupManagerProps> = ({ groups, onUpdateGroups }) => {
  // Estado da aba ativa
  const [activeSection, setActiveSection] = useState(SECTIONS[0]); // Começa na primeira aba

  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Group Form State
  const [groupType, setGroupType] = useState<GroupType>('adicional');
  const [groupMin, setGroupMin] = useState(0);
  const [groupMax, setGroupMax] = useState(1);
  const [groupRequired, setGroupRequired] = useState(false); // <--- NOVO ESTADO: Checkbox Obrigatório

  // --- CORREÇÃO DO BUG DE DIGITAÇÃO ---
  // Dicionário para guardar o que está escrito em cada grupo separadamente
  const [groupInputs, setGroupInputs] = useState<Record<string, { name: string, price: string, suggestion: string | null }>>({});

  const updateGroupInput = (groupId: string, field: 'name' | 'price' | 'suggestion', value: string | null) => {
    setGroupInputs(prev => ({
      ...prev,
      [groupId]: {
        name: field === 'name' ? (value || '') : (prev[groupId]?.name || ''),
        price: field === 'price' ? (value || '') : (prev[groupId]?.price || ''),
        suggestion: field === 'suggestion' ? (value || null) : (prev[groupId]?.suggestion || null)
      }
    }));
  };

  useEffect(() => {
    if ((isCreatingGroup || editingGroupId) && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isCreatingGroup, editingGroupId]);

  // --- Group Logic ---

  const handleStartCreateGroup = () => {
    // Tenta pegar o primeiro tipo permitido na aba atual como padrão
    const allowedTypes = MANUAL_RULES[activeSection];
    const defaultType = allowedTypes ? allowedTypes[0] : 'adicional';
    
    setGroupType(defaultType);
    setGroupMin(0);
    setGroupMax(1);
    setGroupRequired(false); // Padrão: Não obrigatório
    setIsCreatingGroup(true);
    setEditingGroupId(null);
  };

  const handleSaveGroup = () => {
    if (groupMax < groupMin) return alert('O máximo não pode ser menor que o mínimo.');
    if (groupMax < 1) return alert('O máximo deve ser pelo menos 1.');

    // A regra de obrigatório agora vem DIRETAMENTE do checkbox, não mais do mínimo
    const required = groupRequired;

    const typeObj = ALL_GROUP_TYPES.find(t => t.id === groupType);
    const autoTitle = typeObj ? typeObj.label : 'Grupo';

    if (editingGroupId) {
      const updated = groups.map(g => g.id === editingGroupId ? { 
        ...g, 
        title: autoTitle, 
        type: groupType, 
        min: groupMin, 
        max: groupMax,
        required, // Salva o valor do checkbox
        // Mantém a categoria original ou atualiza se estiver vazia
        category: g.category || activeSection 
      } : g);
      onUpdateGroups(updated);
      setEditingGroupId(null);
    } else {
      const newGroup: AddonGroup = {
        id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: autoTitle,
        type: groupType,
        min: groupMin,
        max: groupMax,
        required, // Salva o valor do checkbox
        category: activeSection, // Aplica a categoria da aba atual
        items: []
      };
      onUpdateGroups([...groups, newGroup]);
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation(); 
    if (deleteConfirmId === id) {
        onUpdateGroups(groups.filter(g => g.id !== id));
        setDeleteConfirmId(null);
    } else {
        setDeleteConfirmId(id);
        setTimeout(() => setDeleteConfirmId(prev => prev === id ? null : prev), 4000);
    }
  };

  const handleEditGroupHeader = (e: React.MouseEvent, group: AddonGroup) => {
    e.preventDefault(); e.stopPropagation(); 
    setEditingGroupId(group.id);
    setGroupType(group.type);
    setGroupMin(group.min);
    setGroupMax(group.max);
    setGroupRequired(group.required); // Carrega o estado salvo do checkbox
    setIsCreatingGroup(false); 
  };

  // --- Item Logic ---

  const handleNameChange = (groupId: string, val: string) => {
    updateGroupInput(groupId, 'name', val);
    const cleanVal = val.toLowerCase().trim().replace(/[^a-z ]/g, '');
    const foundKey = Object.keys(FOOD_CORRECTIONS).find(k => k === cleanVal);
    if (foundKey && FOOD_CORRECTIONS[foundKey] !== val) {
      updateGroupInput(groupId, 'suggestion', FOOD_CORRECTIONS[foundKey]);
    } else {
      updateGroupInput(groupId, 'suggestion', null);
    }
  };

  const applySuggestion = (groupId: string) => {
    const suggestion = groupInputs[groupId]?.suggestion;
    if (suggestion) {
      updateGroupInput(groupId, 'name', suggestion);
      updateGroupInput(groupId, 'suggestion', null);
    }
  };

  const handleAddItemToGroup = (groupId: string, groupType: GroupType) => {
    const inputData = groupInputs[groupId];
    const itemName = inputData?.name;
    
    if (!itemName) return;
    
    let price = 0;
    if (groupType !== 'adicional_gratis') {
        price = parseFloat((inputData?.price || '').replace(',', '.')) || 0;
    }
    
    const newItem: AddonItem = {
      id: `itm_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
      name: itemName,
      price: price,
      available: true
    };

    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: [...g.items, newItem] };
      }
      return g;
    });

    onUpdateGroups(updatedGroups);
    // Limpa apenas o input deste grupo
    setGroupInputs(prev => {
        const copy = { ...prev };
        delete copy[groupId];
        return copy;
    });
  };

  const handleDeleteItem = (groupId: string, itemId: string) => {
    const updatedGroups = groups.map(g => {
      if (g.id === groupId) {
        return { ...g, items: g.items.filter(i => i.id !== itemId) };
      }
      return g;
    });
    onUpdateGroups(updatedGroups);
  };

  // --- LÓGICA DE FILTROS ---
  
  // 1. Filtra quais grupos aparecem na lista (baseado na aba ativa)
  const visibleGroups = groups.filter(g => 
    (g.category || "Adicionais Gerais") === activeSection
  );

  // 2. Filtra quais TIPOS aparecem no select de criar grupo (baseado no MANUAL_RULES)
  const availableTypes = ALL_GROUP_TYPES.filter(t => {
    const allowed = MANUAL_RULES[activeSection];
    if (!allowed) return true; // Se não tiver regra, libera tudo
    return allowed.includes(t.id);
  });

  return (
    <div className="space-y-6">
      
      {/* MENU DE ABAS (Scroll Horizontal no Mobile) */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-gray-100">
        {SECTIONS.map(section => (
          <button
            key={section}
            onClick={() => {
                setActiveSection(section);
                setIsCreatingGroup(false);
                setEditingGroupId(null);
            }}
            className={`
              whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border
              ${activeSection === section 
                ? 'bg-brand-500 text-white border-brand-600 shadow-md' 
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }
            `}
          >
            {section}
          </button>
        ))}
      </div>

      {/* Título da Seção Ativa */}
      <div className="flex items-center justify-between">
         <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Layers size={18} className="text-brand-600" />
            {activeSection}
         </h3>
         <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-md">
            {visibleGroups.length} grupos
         </span>
      </div>

      {/* Botão Novo Grupo (Vinculado à categoria ativa) */}
      {!isCreatingGroup && !editingGroupId && (
        <Button fullWidth onClick={handleStartCreateGroup} className="bg-gray-900 hover:bg-black text-white">
          <Plus size={18} className="mr-2" /> Criar em "{activeSection}"
        </Button>
      )}

      {/* Formulário de Grupo */}
      {(isCreatingGroup || editingGroupId) && (
        <div ref={formRef} className="bg-gray-800 p-5 rounded-xl border border-gray-700 animate-in slide-in-from-top-4 shadow-lg scroll-mt-20">
           <h3 className="text-white font-bold mb-4 flex items-center justify-between">
             {editingGroupId ? 'Editar Regras' : `Novo Grupo em ${activeSection}`}
             <button onClick={() => {setIsCreatingGroup(false); setEditingGroupId(null);}} className="text-gray-400 hover:text-white"><X size={20}/></button>
           </h3>

           <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo do Grupo</label>
                <select 
                  value={groupType} 
                  onChange={e => setGroupType(e.target.value as GroupType)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-brand-500 outline-none appearance-none font-medium"
                >
                  {/* select obedece regras manuais */}
                  {availableTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <p className="text-[10px] text-gray-500 mt-1">
                   Mostrando apenas opções permitidas para {activeSection}.
                </p>
              </div>

              {/* CHECKBOX DE OBRIGATÓRIO (NOVO) */}
              <div 
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                  ${groupRequired ? 'bg-brand-900/30 border-brand-500/50' : 'bg-gray-900 border-gray-700'}
                `}
                onClick={() => setGroupRequired(!groupRequired)}
              >
                 <div className={`
                    w-5 h-5 rounded flex items-center justify-center border transition-colors
                    ${groupRequired ? 'bg-brand-500 border-brand-500' : 'bg-gray-800 border-gray-600'}
                 `}>
                    {groupRequired && <Check size={14} className="text-white" />}
                 </div>
                 <div>
                    <span className={`text-sm font-bold ${groupRequired ? 'text-brand-400' : 'text-gray-300'}`}>
                       Este grupo é Obrigatório?
                    </span>
                    <p className="text-[10px] text-gray-500 leading-tight">
                       {groupRequired 
                         ? 'O cliente NÃO conseguirá adicionar ao carrinho sem escolher.' 
                         : 'O cliente pode pular esta etapa se quiser.'}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Mínimo</label>
                    <input 
                      type="number" 
                      min="0"
                      value={groupMin}
                      onChange={e => setGroupMin(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-brand-500 outline-none"
                    />
                    {/* Helper text dinâmico */}
                    <p className={`text-[10px] mt-1 ${groupRequired ? 'text-brand-400 font-bold' : 'text-gray-500'}`}>
                       {groupRequired ? 'Quantos itens o cliente deve escolher?' : 'Mínimo de escolhas (Geralmente 0).'}
                    </p>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Máximo de Itens</label>
                    <input 
                      type="number" 
                      min="1"
                      value={groupMax}
                      onChange={e => setGroupMax(parseInt(e.target.value))}
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-brand-500 outline-none"
                    />
                 </div>
              </div>

              <Button fullWidth onClick={handleSaveGroup} className="mt-2">
                 <Save size={18} className="mr-2" /> Salvar Grupo
              </Button>
           </div>
        </div>
      )}

      {/* Lista de Grupos Existentes (FILTRADA) */}
      <div className="space-y-4">
        {visibleGroups.length === 0 && !isCreatingGroup && (
           <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm">Nenhum grupo nesta categoria.</p>
           </div>
        )}

        {visibleGroups.map(group => {
          const isFreeGroup = group.type === 'adicional_gratis';
          const isConfirmingDelete = deleteConfirmId === group.id;

          // Dados do input DESTE grupo
          const inputData = groupInputs[group.id] || { name: '', price: '', suggestion: null };

          return (
            <div key={group.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
               
               {/* Group Header */}
               <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                     <h4 className="font-bold text-gray-800 text-base flex items-center gap-2">
                       {group.title}
                       {/* BADGE DE OBRIGATÓRIO NA LISTAGEM */}
                       {group.required && (
                         <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded border border-red-200 uppercase font-bold tracking-wide">
                           Obrigatório
                         </span>
                       )}
                     </h4>
                     <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${isFreeGroup ? 'bg-green-100 text-green-700 border-green-200' : 'bg-brand-100 text-brand-700 border-brand-200'}`}>
                           {isFreeGroup ? 'Grátis' : 'Pago'}
                        </span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-300">
                          {group.min > 0 ? `Min ${group.min}` : '0'} • Max {group.max}
                        </span>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button 
                       type="button"
                       onClick={(e) => handleEditGroupHeader(e, group)} 
                       className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                       title="Editar Regras"
                     >
                       <Edit2 size={18} />
                     </button>
                     
                     <button 
                       type="button"
                       onClick={(e) => handleDeleteGroup(e, group.id)} 
                       className={`p-2 rounded-lg transition-all border flex items-center gap-1 font-bold text-xs
                         ${isConfirmingDelete 
                           ? 'bg-red-600 text-white border-red-700 w-auto px-3' 
                           : 'text-red-600 hover:bg-red-50 border-transparent hover:border-red-100'
                         }
                       `}
                       title={isConfirmingDelete ? "Clique para confirmar exclusão" : "Excluir Grupo"}
                     >
                       {isConfirmingDelete ? (
                         <>Confirmar?</>
                       ) : (
                         <Trash2 size={18} />
                       )}
                     </button>
                  </div>
               </div>

               {/* Items List inside Group */}
               <div className="p-4 bg-white">
                  
                  {/* Form to Add Item to THIS Group (ISOLADO) */}
                  <div className="flex items-end gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                     <div className="flex-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Nome do Item</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Leite Condensado"
                          value={inputData.name}
                          onChange={e => handleNameChange(group.id, e.target.value)}
                          className="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-sm outline-none focus:border-brand-500 text-gray-900"
                          onKeyDown={(e) => {
                             if(e.key === 'Enter') handleAddItemToGroup(group.id, group.type);
                          }}
                        />
                        {inputData.suggestion && (
                          <div onClick={() => applySuggestion(group.id)} className="text-xs text-brand-600 cursor-pointer mt-1 flex items-center gap-1 hover:underline">
                             <Sparkles size={10} /> Sugestão: <b>{inputData.suggestion}</b>
                          </div>
                        )}
                     </div>
                     
                     {!isFreeGroup && (
                       <div className="w-24">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Preço</label>
                          <input 
                            type="number" 
                            placeholder="0.00"
                            value={inputData.price}
                            onChange={e => updateGroupInput(group.id, 'price', e.target.value)}
                            className="w-full bg-white border border-gray-300 px-2 py-1.5 rounded text-sm outline-none focus:border-brand-500 text-gray-900"
                          />
                       </div>
                     )}

                     <button 
                       type="button"
                       onClick={() => handleAddItemToGroup(group.id, group.type)}
                       className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 h-[34px] w-[34px] flex items-center justify-center shrink-0"
                     >
                       <Plus size={18} />
                     </button>
                  </div>

                  <div className="space-y-1">
                     {group.items.length === 0 && <p className="text-center text-sm text-gray-400 italic py-2">Nenhum item neste grupo.</p>}
                     
                     {group.items.map(item => (
                        <div key={item.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 group/item">
                           <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                           <div className="flex items-center gap-3">
                              {item.price > 0 && (
                                <span className="text-sm font-bold text-brand-600">
                                   + R$ {item.price.toFixed(2)}
                                </span>
                              )}
                              <button 
                                type="button"
                                onClick={() => handleDeleteItem(group.id, item.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                title="Excluir item"
                              >
                                 <Trash2 size={18} />
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
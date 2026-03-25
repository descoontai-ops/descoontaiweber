import React from 'react';
import { MapPin, ExternalLink, Star, ChevronRight } from 'lucide-react';
import { UserLocation, Restaurant } from '../../../../types';

interface DeliverySectionProps {
  orderType: 'delivery' | 'pickup';
  setOrderType: (type: 'delivery' | 'pickup') => void;
  finalDeliveryAddress: UserLocation | null;
  activeRestaurant: Restaurant;
  onOpenAddressManager: () => void;
  onOpenMap: () => void;
}

export const DeliverySection: React.FC<DeliverySectionProps> = ({
  orderType, setOrderType, finalDeliveryAddress, activeRestaurant, onOpenAddressManager, onOpenMap
}) => {
  return (
    <>
      <div className="bg-gray-100 p-1.5 rounded-2xl flex relative">
          <div 
            className={`absolute inset-y-1.5 w-[calc(50%-4px)] bg-brand-600 rounded-xl shadow-lg shadow-brand-600/30 transition-all duration-300 ease-spring ${orderType === 'pickup' ? 'translate-x-[100%] ml-1' : 'left-1.5'}`} 
          />
          <button 
            onClick={() => setOrderType('delivery')} 
            className={`flex-1 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors duration-300 ${orderType === 'delivery' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Entrega
          </button>
          <button 
            onClick={() => setOrderType('pickup')} 
            className={`flex-1 py-3 rounded-xl text-sm font-bold relative z-10 transition-colors duration-300 ${orderType === 'pickup' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Retirada
          </button>
      </div>

      {orderType === 'pickup' ? (
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2.5 rounded-xl shrink-0 text-blue-600"><MapPin size={20} /></div>
                  <div className="flex-1">
                      <h4 className="text-sm font-bold text-blue-900">Retirar na Loja</h4>
                      <p className="text-xs text-blue-700 mt-1 mb-3 leading-relaxed">{activeRestaurant.address || 'Endereço não disponível'}</p>
                      <button onClick={onOpenMap} className="text-xs font-bold bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg inline-flex items-center gap-1.5 hover:bg-blue-50 transition-colors shadow-sm">
                        <ExternalLink size={12} /> Abrir Mapa
                      </button>
                  </div>
              </div>
          </div>
      ) : (
          <div className={`p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 border transition-colors ${finalDeliveryAddress ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
              <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${finalDeliveryAddress ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                      <MapPin size={20} />
                  </div>
                  <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                         <h4 className={`text-sm font-bold ${finalDeliveryAddress ? 'text-green-900' : 'text-red-900'}`}>
                             {finalDeliveryAddress ? 'Endereço de Entrega' : 'Endereço Necessário'}
                         </h4>
                         {finalDeliveryAddress?.isDefault && (
                             <span className="text-[10px] bg-white/60 border border-green-200 text-green-800 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium shadow-sm">
                                 <Star size={8} className="fill-green-600 text-green-600" /> Principal
                             </span>
                         )}
                      </div>
                      
                      {finalDeliveryAddress ? (
                          <div onClick={onOpenAddressManager} className="cursor-pointer group">
                            <p className="text-xs text-green-800 mt-1 font-medium group-hover:underline">
                                {finalDeliveryAddress.street}, {finalDeliveryAddress.number}
                            </p>
                            <p className="text-xs text-green-700">
                                {finalDeliveryAddress.neighborhood} - {finalDeliveryAddress.city}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-green-600 text-[10px] font-bold uppercase tracking-wide">
                               Trocar Endereço <ChevronRight size={10} />
                            </div>
                          </div>
                      ) : (
                          <div className="mt-2">
                              <button 
                                onClick={onOpenAddressManager}
                                className="w-full text-left bg-white/50 p-2 rounded-lg border border-red-100 hover:bg-white transition-colors"
                              >
                                <p className="text-sm font-bold text-red-600 mb-1 flex items-center gap-2">
                                   Endereço não cadastrado!
                                </p>
                                <p className="text-xs text-red-500 underline decoration-red-300 underline-offset-2">
                                   Clique aqui para cadastrar seu endereço de entrega.
                                </p>
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </>
  );
};
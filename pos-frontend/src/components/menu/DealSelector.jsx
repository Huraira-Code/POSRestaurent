import React, { useState, useEffect } from 'react';
import { FaPlus, FaMinus, FaTimes, FaTag } from 'react-icons/fa';
import { getMyDeals, calculateDealTax } from '../../https/index';

const DealSelector = ({ isOpen, onClose, onDealsSelected, selectedDeals = [], paymentMethod = 'CASH' }) => {
  const [availableDeals, setAvailableDeals] = useState([]);
  const [dealQuantities, setDealQuantities] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchDeals();
      
      // Initialize quantities from selected deals
      const quantities = {};
      selectedDeals.forEach(deal => {
        quantities[deal.dealId] = deal.quantity || 1;
      });
      setDealQuantities(quantities);
    }
  }, [isOpen, selectedDeals]);

  const fetchDeals = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await getMyDeals();
      if (response.data?.success) {
        setAvailableDeals(response.data.data || []);
      } else {
        setAvailableDeals([]);
        setError('No deals available');
      }
    } catch (error) {
      console.error('Error fetching deals:', error);
      setAvailableDeals([]);
      setError('Failed to load deals');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDealQuantity = (dealId, quantity) => {
    if (quantity <= 0) {
      const newQuantities = { ...dealQuantities };
      delete newQuantities[dealId];
      setDealQuantities(newQuantities);
    } else {
      setDealQuantities(prev => ({
        ...prev,
        [dealId]: quantity
      }));
    }
  };

  const getDealTotal = (deal, quantity) => {
    return (deal.dealPrice * quantity);
  };

  const getSelectedDealsData = () => {
    return Object.entries(dealQuantities).map(([dealId, quantity]) => {
      const deal = availableDeals.find(d => d._id === dealId);
      return {
        dealId,
        quantity,
        deal,
        total: getDealTotal(deal, quantity)
      };
    }).filter(item => item.deal);
  };

  const getTotalAmount = () => {
    return getSelectedDealsData().reduce((sum, item) => sum + item.total, 0);
  };

  const getTotalSavings = () => {
    return getSelectedDealsData().reduce((sum, item) => {
      const savingsPerDeal = item.deal.originalPrice - item.deal.dealPrice;
      return sum + (savingsPerDeal * item.quantity);
    }, 0);
  };

  const handleApplyDeals = () => {
    const selectedDealsData = getSelectedDealsData().map(item => ({
      dealId: item.dealId,
      name: item.deal.name,
      dealPrice: item.deal.dealPrice,
      originalPrice: item.deal.originalPrice,
      savings: item.deal.savings,
      quantity: item.quantity,
      items: item.deal.items
    }));
    
    onDealsSelected(selectedDealsData);
    onClose();
  };

  const isExpired = (deal) => {
    return deal.validUntil && new Date() > new Date(deal.validUntil);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col border border-[#2a2a2a]">
        {/* Header - Fixed */}
        <div className="flex justify-between items-center p-6 border-b border-[#2a2a2a] bg-[#262626] flex-shrink-0">
          <h2 className="text-xl font-semibold text-[#f5f5f5]">Select Deals</h2>
          <button
            onClick={onClose}
            className="text-[#a0a0a0] hover:text-[#f5f5f5] text-xl transition-colors"
          >
            <FaTimes />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]">
          {error && (
            <div className="mb-4 p-3 bg-[#ef4444]/20 border border-[#ef4444]/50 rounded-lg">
              <p className="text-[#ef4444] text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f6b100]"></div>
            </div>
          ) : availableDeals.length > 0 ? (
            <div className="space-y-4">
              {availableDeals.map((deal) => {
                const quantity = dealQuantities[deal._id] || 0;
                const expired = isExpired(deal);
                
                return (
                  <div 
                    key={deal._id} 
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      expired ? 'bg-[#2a2a2a] opacity-60 border-[#404040]' : 'bg-[#262626] border-[#404040]'
                    } ${quantity > 0 ? 'border-[#f6b100] bg-[#f6b100]/10' : 'hover:border-[#606060]'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-[#f5f5f5]">{deal.name}</h3>
                          <span className="px-3 py-1 bg-[#10b981] text-white text-sm rounded-full font-medium">
                            Rs {deal.dealPrice}
                          </span>
                          {deal.savings > 0 && (
                            <span className="px-3 py-1 bg-[#f6b100] text-[#1f1f1f] text-sm rounded-full font-medium">
                              Save Rs {deal.savings}
                            </span>
                          )}
                          {expired && (
                            <span className="px-3 py-1 bg-[#ef4444] text-white text-sm rounded-full font-medium">
                              Expired
                            </span>
                          )}
                        </div>

                        {deal.description && (
                          <p className="text-[#a0a0a0] text-sm mb-3">{deal.description}</p>
                        )}

                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-[#f5f5f5] mb-2">Included Items:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {deal.items?.map((item, index) => (
                              <div key={index} className="text-xs text-[#a0a0a0] bg-[#404040] p-2 rounded border border-[#606060]">
                                {item.itemId?.name || 'Unknown Item'} × {item.quantity}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-[#a0a0a0]">
                          <span>Original Price: <span className="line-through">Rs {deal.originalPrice}</span></span>
                          {deal.validUntil && (
                            <span>Valid until: {new Date(deal.validUntil).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        {!expired && (
                          <>
                            <button
                              onClick={() => updateDealQuantity(deal._id, Math.max(0, quantity - 1))}
                              className={`p-2 rounded-full transition-all duration-200 ${
                                quantity <= 0 
                                  ? 'text-[#606060] cursor-not-allowed' 
                                  : 'text-[#ef4444] hover:bg-[#ef4444]/20 hover:text-[#ef4444]'
                              }`}
                              disabled={quantity <= 0}
                            >
                              <FaMinus className="text-sm" />
                            </button>
                            
                            <span className="w-12 text-center font-bold text-[#f5f5f5] bg-[#404040] py-2 px-3 rounded-lg border border-[#606060]">
                              {quantity}
                            </span>
                            
                            <button
                              onClick={() => updateDealQuantity(deal._id, quantity + 1)}
                              className="p-2 text-[#10b981] hover:bg-[#10b981]/20 hover:text-[#10b981] rounded-full transition-all duration-200"
                            >
                              <FaPlus className="text-sm" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {quantity > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#404040]">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#a0a0a0]">Subtotal ({quantity}x):</span>
                          <span className="font-bold text-[#f6b100]">Rs {getDealTotal(deal, quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FaTag className="text-gray-400 text-4xl mx-auto mb-4" />
              <p className="text-[#a0a0a0] mb-4">No deals available</p>
            </div>
          )}
        </div>

        {/* Footer - Fixed (Always Visible) */}
        {Object.keys(dealQuantities).length > 0 && (
          <div className="border-t border-[#404040] bg-[#1a1a1a] p-6 flex-shrink-0">
            <div className="mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[#a0a0a0]">Total Deals:</span>
                <span className="font-bold text-[#f5f5f5]">Rs {getTotalAmount().toFixed(2)}</span>
              </div>
              {getTotalSavings() > 0 && (
                <div className="flex justify-between text-[#10b981]">
                  <span>Total Savings:</span>
                  <span className="font-bold">Rs {getTotalSavings().toFixed(2)}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#404040] text-[#f5f5f5] border border-[#606060] rounded-lg hover:bg-[#505050] hover:border-[#707070] transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDeals}
                className="px-8 py-3 bg-gradient-to-r from-[#f6b100] to-[#e6a000] text-[#1f1f1f] rounded-lg hover:from-[#e6a000] hover:to-[#d69100] transition-all duration-200 font-bold shadow-lg hover:shadow-2xl transform hover:-translate-y-1 border-2 border-[#f6b100] text-lg"
              >
                Apply Deals
              </button>
            </div>
          </div>
        )}

        {Object.keys(dealQuantities).length === 0 && (
          <div className="border-t border-[#404040] bg-[#1a1a1a] p-6 flex-shrink-0">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-[#404040] text-[#f5f5f5] border border-[#606060] rounded-lg hover:bg-[#505050] hover:border-[#707070] transition-all duration-200 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DealSelector;

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTotalPrice } from "../../redux/slices/cartSlice";
import {
  // addOrder,
  updateTable,
  createOrder,
} from "../../https/index";
import { enqueueSnackbar } from "notistack";
import { useMutation } from "@tanstack/react-query";
import { removeAllItems } from "../../redux/slices/cartSlice";
import { removeCustomer } from "../../redux/slices/customerSlice";
import Invoice from "../invoice/Invoice";
import PrintReceiptsModal from "../receipt/PrintReceiptsModal";
import DealSelector from "./DealSelector";
import { FaSpinner, FaTag } from "react-icons/fa";

const Bill = () => {
  const dispatch = useDispatch();

  const customerData = useSelector((state) => state.customer);
  const cartData = useSelector((state) => state.cart);
  const total = useSelector(getTotalPrice);

  const [showInvoice, setShowInvoice] = useState(false);
  const [showOrderConfirmation, setShowOrderConfirmation] = useState(false);
  const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
  const [showPrintReceiptsModal, setShowPrintReceiptsModal] = useState(false);
  const [orderInfo, setOrderInfo] = useState();
  const [orderReceiptData, setOrderReceiptData] = useState(null);
  const [selectedOrderType, setSelectedOrderType] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Deal-related state
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [showDealSelector, setShowDealSelector] = useState(false);

  // Deal calculation functions (moved before usage)
  const getDealsTotal = () => {
    return selectedDeals.reduce((sum, deal) => {
      return sum + (deal.dealPrice * deal.quantity);
    }, 0);
  };

  const getDealsSavings = () => {
    return selectedDeals.reduce((sum, deal) => {
      const savingsPerDeal = deal.originalPrice - deal.dealPrice;
      return sum + (savingsPerDeal * deal.quantity);
    }, 0);
  };

  // Calculate totals after state declarations
  const totalPriceWithTax = total;
  const dealsTotal = getDealsTotal();
  const dealsSavings = getDealsSavings();
  const grandTotal = totalPriceWithTax + dealsTotal;

  // Automatically set payment mode to "online" when payment type is "online"
  useEffect(() => {
    if (paymentType === "online") {
      setPaymentMode("online");
    } else if (paymentType === "cod" || paymentType === "on_arrival") {
      // Reset to cash for non-online payment types
      setPaymentMode("cash");
    }
  }, [paymentType]);

  // Group cart items by menu
  const groupItemsByMenu = () => {
    const grouped = {};
    cartData.forEach(item => {
      const menuName = item.menuName || 'General Items';
      if (!grouped[menuName]) {
        grouped[menuName] = [];
      }
      grouped[menuName].push(item);
    });
    return grouped;
  };

  const groupedCartItems = groupItemsByMenu();

  const handlePlaceOrder = async () => {
    // Just open the order type modal - no validation needed here
    setShowOrderTypeModal(true);
  };

  // Deal handlers
  const handleSelectDeals = () => {
    setShowDealSelector(true);
  };

  const handleDealsSelected = (deals) => {
    setSelectedDeals(deals);
    setShowDealSelector(false);
  };

  const removeDeal = (dealId) => {
    setSelectedDeals(prev => prev.filter(deal => (deal.dealId || deal._id) !== dealId));
  };

  const updateDealQuantity = (dealId, newQuantity) => {
    if (newQuantity <= 0) {
      removeDeal(dealId);
    } else {
      setSelectedDeals(prev => 
        prev.map(deal => 
          (deal.dealId || deal._id) === dealId 
            ? { ...deal, quantity: newQuantity }
            : deal
        )
      );
    }
  };

  // Enhanced receipt printing function
  const showReceiptOptions = (orderData, orderType) => {
    console.log("=== SHOW RECEIPT OPTIONS DEBUG ===");
    console.log("orderData received:", orderData);
    console.log("orderData.kitchenReceipts:", orderData.kitchenReceipts);
    console.log("orderData.customerReceipts:", orderData.customerReceipts);
    console.log("orderData.items:", orderData.items);
    console.log("orderData.deals:", orderData.deals);
    console.log("selectedDeals from state:", selectedDeals);
    if (orderData.deals && orderData.deals.length > 0) {
      console.log("First deal structure:", orderData.deals[0]);
      console.log("First deal items:", orderData.deals[0].items);
    }
    if (selectedDeals && selectedDeals.length > 0) {
      console.log("First selectedDeal structure:", selectedDeals[0]);
      console.log("First selectedDeal items:", selectedDeals[0].items);
    }
    console.log("cartData:", cartData);
    
    // Set the receipt data and open the modal
    const receiptData = {
      ...orderData,
      // Ensure order ID is available for receipt display
      _id: orderData._id || orderData.orderId || orderData.id,
      orderType,
      customerInfo: {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        table: orderType === 'DINE' ? customerName : null
      },
      paymentType,
      paymentMode,
      // Preserve kitchen and customer receipts from backend
      kitchenReceipts: orderData.kitchenReceipts || [],
      customerReceipts: orderData.customerReceipts || [],
      // Use backend items if available, otherwise fallback to cartData
      items: orderData.items || cartData.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.pricePerQuantity,
        totalPrice: item.pricePerQuantity * item.quantity,
        options: item.selectedOptions || []
      })),
      // Include deals data for receipt processing
      deals: orderData.deals || selectedDeals.map(deal => ({
        _id: deal._id || deal.dealId,
        dealId: deal.dealId || deal._id,
        name: deal.name,
        dealPrice: deal.dealPrice || deal.price,
        originalPrice: deal.originalPrice,
        quantity: deal.quantity,
        savings: deal.savings || (deal.originalPrice - deal.dealPrice),
        items: (deal.items || []).map(item => ({
          name: item.name || item.itemName || (item.itemId && item.itemId.name) || 'Unknown Item',
          quantity: item.quantity || 1,
          itemId: item.itemId || item._id
        }))
      })),
      totalAmount: orderData.totalAmount || total
    };
    
    console.log("Final receiptData being set:", receiptData);
    console.log("receiptData._id:", receiptData._id);
    console.log("receiptData.orderId:", receiptData.orderId);
    console.log("receiptData.id:", receiptData.id);
    console.log("receiptData.deals:", receiptData.deals);
    console.log("=== END SHOW RECEIPT OPTIONS DEBUG ===");
    
    setOrderReceiptData(receiptData);
    setShowPrintReceiptsModal(true);
  };

  const handleCreateOrder = async () => {
    console.log("=== CREATE ORDER DEBUG ===");
    console.log("handleCreateOrder called");
    console.log("selectedOrderType:", selectedOrderType);
    console.log("isCreatingOrder:", isCreatingOrder);
    console.log("createOrderMutation.isLoading:", createOrderMutation.isLoading);
    
    if (!selectedOrderType) {
      enqueueSnackbar("Please select an order type!", {
        variant: "warning",
      });
      return;
    }

    // Validation for delivery orders
    if (selectedOrderType === "DELIVERY") {
      if (!customerName || !customerPhone || !customerAddress) {
        enqueueSnackbar("Please fill in customer name, phone, and address for delivery orders!", {
          variant: "warning",
        });
        return;
      }
      if (!paymentType) {
        enqueueSnackbar("Please select a payment type for delivery orders!", {
          variant: "warning",
        });
        return;
      }
    }

    // Validation for pickup orders
    if (selectedOrderType === "PICKUP") {
      if (!customerName || !customerPhone) {
        enqueueSnackbar("Please fill in customer name and phone for pickup orders!", {
          variant: "warning",
        });
        return;
      }
      if (!paymentType) {
        enqueueSnackbar("Please select a payment type for pickup orders!", {
          variant: "warning",
        });
        return;
      }
    }

    console.log("Validation passed, setting loading state");
    
    // Set manual loading state
    setIsCreatingOrder(true);
    
    console.log("isCreatingOrder set to true");

    // Prepare cart data for API
    const cartForAPI = cartData.map(item => ({
      itemId: item.itemId,
      name: item.name,
      pricePerQuantity: item.pricePerQuantity,
      quantity: item.quantity,
      price: item.price,
      menuId: item.menuId,
      categoryId: item.categoryId,
      menuName: item.menuName,
      categoryName: item.categoryName,
      options: item.selectedOptions || []
    }));

    const orderData = {
      cart: cartForAPI,
      deals: selectedDeals.length > 0 ? selectedDeals.map(deal => ({
        dealId: deal.dealId,
        quantity: deal.quantity
      })) : undefined,
      orderType: selectedOrderType,
      customerInfo: {
        name: customerName,
        phone: customerPhone || null,
        address: customerAddress || null
      },
      paymentMethod: paymentMode.toUpperCase(),
      paymentType: paymentType || null,
      paymentMode: paymentMode
    };

    console.log("Order data prepared:", orderData);
    console.log("About to call createOrderMutation.mutate");

    createOrderMutation.mutate(orderData);
  };

  const createOrderMutation = useMutation({
    mutationFn: (reqData) => {
      console.log("=== MUTATION DEBUG ===");
      console.log("Mutation function called with data:", reqData);
      console.log("About to call createOrder API");
      return createOrder(reqData);
    },
    onMutate: (variables) => {
      console.log("onMutate called with:", variables);
      console.log("Mutation starting...");
    },
    onSuccess: (resData) => {
      console.log("=== MUTATION SUCCESS ===");
      console.log("Full response:", resData);
      const data = resData?.data?.data || resData?.data;
      console.log("Order created:", data);
      console.log("Order ID from data:", data?._id);
      console.log("Data keys:", data ? Object.keys(data) : "no data");
      console.log("Kitchen receipts:", data?.kitchenReceipts);
      console.log("Customer receipts:", data?.customerReceipts);

      enqueueSnackbar("Order created successfully!", {
        variant: "success",
      });

      // Show receipt printing modal with order data
      if (data) {
        showReceiptOptions(data, selectedOrderType);
      }

      // Clear cart and close modals
      dispatch(removeAllItems());
      dispatch(removeCustomer());
      setShowOrderTypeModal(false);
      setSelectedOrderType("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setPaymentType("");
      setPaymentMode("cash");
      setSelectedDeals([]);
      
      // Clear manual loading state
      setIsCreatingOrder(false);
      console.log("isCreatingOrder set to false in success");
    },
    onError: (error) => {
      console.log("=== MUTATION ERROR ===");
      console.error("Error creating order:", error);
      console.log("Error details:", error.response?.data);
      enqueueSnackbar(error.response?.data?.message || "Failed to create order!", {
        variant: "error",
      });
      
      // Clear manual loading state on error
      setIsCreatingOrder(false);
      console.log("isCreatingOrder set to false in error");
    },
  });

  const orderMutation = useMutation({
    mutationFn: (reqData) => addOrder(reqData),
    onSuccess: (resData) => {
      const { data } = resData.data;
      console.log(data);

      setOrderInfo(data);

      // Update Table
      const tableData = {
        status: "Booked",
        orderId: data._id,
        tableId: data.table,
      };

      setTimeout(() => {
        tableUpdateMutation.mutate(tableData);
      }, 1500);

      enqueueSnackbar("Order Placed!", {
        variant: "success",
      });
      setShowInvoice(true);
    },
    onError: (error) => {
      console.log(error);
    },
  });

  const tableUpdateMutation = useMutation({
    mutationFn: (reqData) => updateTable(reqData),
    onSuccess: (resData) => {
      console.log(resData);
      dispatch(removeCustomer());
      dispatch(removeAllItems());
    },
    onError: (error) => {
      console.log(error);
    },
  });

  return (
    <>
      <div className="flex items-center justify-between px-3 sm:px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Items({cartData.length})
        </p>
        <h1 className="text-[#f5f5f5] text-sm sm:text-md font-bold">
          Rs{total.toFixed(2)}
        </h1>
      </div>

      {/* Deals Section */}
      <div className="px-3 sm:px-5 mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-[#ababab] font-medium">
            Deals({selectedDeals.length})
          </p>
          <button
            onClick={handleSelectDeals}
            className="flex items-center gap-2 px-3 py-1 bg-[#f6b100] text-[#1f1f1f] rounded-lg text-xs font-medium hover:bg-[#e5a000] transition-colors"
          >
            <FaTag size={12} />
            Select Deals
          </button>
        </div>

        {/* Selected Deals Display */}
        {selectedDeals.length > 0 && (
          <div className="space-y-2 mb-3">
            {selectedDeals.map((deal) => (
              <div key={deal._id} className="bg-[#262626] p-3 rounded-lg border border-[#404040]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[#f5f5f5] font-medium text-sm">{deal.name}</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateDealQuantity(deal._id, Math.max(1, deal.quantity - 1))}
                        className="w-6 h-6 flex items-center justify-center bg-[#404040] text-[#f5f5f5] rounded text-xs hover:bg-[#505050]"
                      >
                        -
                      </button>
                      <span className="text-[#f5f5f5] text-xs min-w-[20px] text-center">{deal.quantity}</span>
                      <button
                        onClick={() => updateDealQuantity(deal._id, deal.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-[#404040] text-[#f5f5f5] rounded text-xs hover:bg-[#505050]"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeDeal(deal._id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#ababab]">
                    Rs{deal.dealPrice} × {deal.quantity}
                  </span>
                  <span className="text-[#f6b100] font-medium">
                    Rs{(deal.dealPrice * deal.quantity).toFixed(2)}
                  </span>
                </div>
                {deal.items && deal.items.length > 0 && (
                  <div className="mt-2 text-xs text-[#ababab]">
                    Items: {deal.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Deals Total */}
        {selectedDeals.length > 0 && (
          <div className="flex items-center justify-between py-2 border-t border-[#404040]">
            <p className="text-xs text-[#ababab] font-medium">Deals Total</p>
            <h1 className="text-[#f5f5f5] text-sm font-bold">
              Rs{getDealsTotal().toFixed(2)}
            </h1>
          </div>
        )}
      </div>
      
      {/* Discount Input Field */}
      {/* Discount section removed */}

      <div className="flex items-center justify-between px-3 sm:px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">Subtotal</p>
        <h1 className="text-[#f5f5f5] text-sm sm:text-md font-bold">
          Rs{total.toFixed(2)}
        </h1>
      </div>
      
      <div className="flex items-center justify-between px-3 sm:px-5 mt-2">
        <p className="text-xs text-[#ababab] font-medium mt-2">
          Grand Total
        </p>
        <h1 className="text-[#f5f5f5] text-sm sm:text-md font-bold">
          Rs{(total + getDealsTotal()).toFixed(2)}
        </h1>
      </div>

      {/* Savings Display */}
      {getDealsSavings() > 0 && (
        <div className="flex items-center justify-between px-3 sm:px-5 mt-2">
          <p className="text-xs text-green-400 font-medium mt-2">
            You Save
          </p>
          <h1 className="text-green-400 text-sm font-bold">
            Rs{getDealsSavings().toFixed(2)}
          </h1>
        </div>
      )}
      {/* Order Requirements removed - just need items in cart */}

      <div className="flex flex-col sm:flex-row items-center gap-3 px-3 sm:px-5 mt-4">
        <button
          onClick={handlePlaceOrder}
          disabled={cartData.length === 0 && selectedDeals.length === 0}
          className={`px-3 sm:px-4 py-2 sm:py-3 w-full rounded-lg font-semibold text-sm sm:text-lg ${
            cartData.length === 0 && selectedDeals.length === 0
              ? "bg-gray-600 text-gray-400 cursor-not-allowed"
              : "bg-[#f6b100] text-[#1f1f1f] hover:bg-[#e5a000]"
          }`}
        >
          Place Order
        </button>
      </div>

      {showInvoice && (
        <Invoice orderInfo={orderInfo} setShowInvoice={setShowInvoice} />
      )}

      {/* Order Type Modal */}
      {showOrderTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-center text-[#f5f5f5]">Create New Order</h3>
            
            {/* Date Display */}
            <div className="mb-4 p-3 bg-[#262626] rounded-lg">
              <div className="text-[#f5f5f5] text-sm">
                <span className="font-medium">Date: </span>
                {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            
            {/* Order Type Selection */}
            <div className="mb-6">
              <label className="block text-[#f5f5f5] text-sm font-medium mb-3">Order Type</label>
              <div className="space-y-2">
                {["DINE", "DELIVERY", "PICKUP"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedOrderType(type);
                      // Reset fields when order type changes
                      setPaymentType("");
                      setCustomerPhone("");
                      setCustomerAddress("");
                    }}
                    className={`w-full p-3 rounded-lg border-2 transition-colors ${
                      selectedOrderType === type
                        ? "border-[#f6b100] bg-[#f6b100] bg-opacity-20 text-[#f6b100]"
                        : "border-[#404040] bg-[#262626] text-[#f5f5f5] hover:border-[#606060]"
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{type}</div>
                      <div className="text-xs opacity-75">
                        {type === "DINE" && "Table service in restaurant"}
                        {type === "DELIVERY" && "Food delivered to customer"}
                        {type === "PICKUP" && "Customer picks up order"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            {selectedOrderType && (
              <div className="mb-6 space-y-4">
                <h4 className="text-[#f5f5f5] font-medium text-lg">Customer Information</h4>
                
                {/* Customer Name */}
                <div>
                  <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                    {selectedOrderType === "DINE" ? "Table Number / Customer Name" : "Customer Name"} 
                    {selectedOrderType !== "DINE" && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={selectedOrderType === "DINE" ? "Enter table number or customer name" : "Enter customer name"}
                    className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#f6b100] focus:outline-none"
                  />
                </div>

                {/* Phone Number - Required for Delivery and Pickup */}
                {(selectedOrderType === "DELIVERY" || selectedOrderType === "PICKUP") && (
                  <div>
                    <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#f6b100] focus:outline-none"
                    />
                  </div>
                )}

                {/* Address - Required for Delivery only */}
                {selectedOrderType === "DELIVERY" && (
                  <div>
                    <label className="block text-[#f5f5f5] text-sm font-medium mb-2">
                      Delivery Address <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Enter complete delivery address"
                      rows={3}
                      className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#f6b100] focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Payment Type - Based on Order Type */}
            {selectedOrderType && selectedOrderType !== "DINE" && (
              <div className="mb-6">
                <label className="block text-[#f5f5f5] text-sm font-medium mb-3">
                  Payment Type <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {selectedOrderType === "DELIVERY" && (
                    <>
                      <button
                        onClick={() => setPaymentType("cod")}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          paymentType === "cod"
                            ? "border-[#f6b100] bg-[#f6b100] bg-opacity-20 text-[#f6b100]"
                            : "border-[#404040] bg-[#262626] text-[#f5f5f5] hover:border-[#606060]"
                        }`}
                      >
                        Cash on Delivery (COD)
                      </button>
                      <button
                        onClick={() => {
                          setPaymentType("online");
                          setPaymentMode("online");
                        }}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          paymentType === "online"
                            ? "border-[#f6b100] bg-[#f6b100] bg-opacity-20 text-[#f6b100]"
                            : "border-[#404040] bg-[#262626] text-[#f5f5f5] hover:border-[#606060]"
                        }`}
                      >
                        Online Payment
                      </button>
                    </>
                  )}
                  
                  {selectedOrderType === "PICKUP" && (
                    <>
                      <button
                        onClick={() => setPaymentType("on_arrival")}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          paymentType === "on_arrival"
                            ? "border-[#f6b100] bg-[#f6b100] bg-opacity-20 text-[#f6b100]"
                            : "border-[#404040] bg-[#262626] text-[#f5f5f5] hover:border-[#606060]"
                        }`}
                      >
                        Pay on Arrival
                      </button>
                      <button
                        onClick={() => {
                          setPaymentType("online");
                          setPaymentMode("online");
                        }}
                        className={`w-full p-3 rounded-lg border transition-colors ${
                          paymentType === "online"
                            ? "border-[#f6b100] bg-[#f6b100] bg-opacity-20 text-[#f6b100]"
                            : "border-[#404040] bg-[#262626] text-[#f5f5f5] hover:border-[#606060]"
                        }`}
                      >
                        Online Payment
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Payment Mode */}
            {selectedOrderType && selectedOrderType !== "DINE" && (
              <div className="mb-6">
                <label className="block text-[#f5f5f5] text-sm font-medium mb-3">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {["cash", "card", "online"].map((mode) => {
                    const isDisabled = paymentType === "online" && mode !== "online";
                    
                    return (
                      <button
                        key={mode}
                        onClick={() => !isDisabled && setPaymentMode(mode)}
                        disabled={isDisabled}
                        className={`p-3 rounded-lg border transition-colors capitalize ${
                          paymentMode === mode
                            ? "border-[#f6b100] bg-[#f6b100] bg-opacity-20 text-[#f6b100]"
                            : isDisabled
                            ? "border-[#303030] bg-[#1a1a1a] text-[#666666] cursor-not-allowed opacity-50"
                            : "border-[#404040] bg-[#262626] text-[#f5f5f5] hover:border-[#606060]"
                        }`}
                      >
                        {mode === "online" ? "Online Pay" : mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOrderTypeModal(false);
                  setSelectedOrderType("");
                  setCustomerName("");
                  setCustomerPhone("");
                  setCustomerAddress("");
                  setPaymentType("");
                  setPaymentMode("cash");
                }}
                disabled={createOrderMutation.isLoading || isCreatingOrder}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  createOrderMutation.isLoading || isCreatingOrder
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-[#404040] text-[#f5f5f5] hover:bg-[#505050]"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log("=== CREATE ORDER BUTTON CLICKED ===");
                  console.log("Current loading states:");
                  console.log("isCreatingOrder:", isCreatingOrder);
                  console.log("createOrderMutation.isLoading:", createOrderMutation.isLoading);
                  console.log("selectedOrderType:", selectedOrderType);
                  handleCreateOrder();
                }}
                disabled={!selectedOrderType || createOrderMutation.isLoading || isCreatingOrder}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  !selectedOrderType || createOrderMutation.isLoading || isCreatingOrder
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-[#f6b100] text-[#1f1f1f] hover:bg-[#e5a000]"
                }`}
              >
                {(createOrderMutation.isLoading || isCreatingOrder) && (
                  <FaSpinner className="animate-spin" />
                )}
                {(createOrderMutation.isLoading || isCreatingOrder) ? "Creating Order..." : "Create Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Receipts Modal */}
      <PrintReceiptsModal
        isOpen={showPrintReceiptsModal}
        onClose={() => setShowPrintReceiptsModal(false)}
        orderData={orderReceiptData}
        orderType={selectedOrderType}
        customerReceipts={orderReceiptData?.customerReceipts || []}
        kitchenReceipts={orderReceiptData?.kitchenReceipts || []}
      />

      {/* Loading Overlay */}
      {(createOrderMutation.isLoading || isCreatingOrder) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] rounded-lg p-6 flex flex-col items-center space-y-4">
            <FaSpinner className="animate-spin text-4xl text-[#f6b100]" />
            <p className="text-[#f5f5f5] text-lg font-medium">Creating Order...</p>
            <p className="text-[#ababab] text-sm text-center">Please wait while we process your order</p>
          </div>
        </div>
      )}

      {/* Deal Selector Modal */}
      {showDealSelector && (
        <DealSelector
          isOpen={showDealSelector}
          onClose={() => setShowDealSelector(false)}
          onDealsSelected={handleDealsSelected}
          selectedDeals={selectedDeals}
        />
      )}
    </>
  );
};

export default Bill;

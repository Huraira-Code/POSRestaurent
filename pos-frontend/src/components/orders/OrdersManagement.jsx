import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { getOrders, updateOrder, completeOrder, getPayment } from "../../https/index";
import EditOrderModal from "./EditOrderModal";

const OrdersManagement = () => {
  const [activeTab, setActiveTab] = useState("All Orders");
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedOrdersCount, setDisplayedOrdersCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const queryClient = useQueryClient();

  const ORDERS_PER_PAGE = 6;

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Handle different response structures
  const rawOrders = ordersData?.data?.orders || ordersData?.data?.data || ordersData?.data || [];
  
  // Sort orders by creation date (most recent first)
  const orders = rawOrders.sort((a, b) => {
    const dateA = new Date(a.createdAt || a.printedAt || 0);
    const dateB = new Date(b.createdAt || b.printedAt || 0);
    return dateB - dateA; // Descending order (newest first)
  });
  
  // Debug logging
  console.log("OrdersManagement - Raw response:", ordersData);
  console.log("OrdersManagement - Parsed orders:", orders);

  // Filter orders based on active tab and search query
  const filteredOrders = orders.filter(order => {
    // Tab filter
    let tabMatch = true;
    if (activeTab === "In Progress") tabMatch = order.orderStatus === "IN_PROGRESS";
    if (activeTab === "Completed") tabMatch = order.orderStatus === "COMPLETED" && order.paymentStatus !== "PAID";
    if (activeTab === "Paid") tabMatch = order.paymentStatus === "PAID";
    
    // Search filter - search by order ID (last 6 characters)
    let searchMatch = true;
    if (searchQuery.trim()) {
      const orderId = order._id?.slice(-6) || '';
      searchMatch = orderId.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return tabMatch && searchMatch;
  });

  // Get orders to display based on pagination
  const displayedOrders = filteredOrders.slice(0, displayedOrdersCount);
  const hasMoreOrders = filteredOrders.length > displayedOrdersCount;

  // Reset pagination when filters change
  React.useEffect(() => {
    setDisplayedOrdersCount(ORDERS_PER_PAGE);
  }, [activeTab, searchQuery]);

  // Load more orders function
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayedOrdersCount(prev => prev + ORDERS_PER_PAGE);
      setIsLoadingMore(false);
    }, 500);
  };

  // Complete order mutation
  const completeOrderMutation = useMutation({
    mutationFn: completeOrder,
    onSuccess: (response) => {
      enqueueSnackbar("Order completed successfully!", { variant: "success" });
      queryClient.invalidateQueries(["orders"]);
      
      // Handle customer receipts for final bill
      const data = response?.data?.data || response?.data;
      if (data && data.customerReceipts) {
        console.log("Final customer receipts:", data.customerReceipts);
        // Here you can handle receipt printing/display
      }
    },
    onError: (error) => {
      enqueueSnackbar(error.response?.data?.message || "Failed to complete order", { 
        variant: "error" 
      });
    },
  });

  const handleCompleteOrder = (orderId) => {
    completeOrderMutation.mutate({ orderId });
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
  };

  const getOrderTypeColor = (type) => {
    switch (type) {
      case "DINE": return "bg-blue-100 text-blue-800";
      case "DELIVERY": return "bg-green-100 text-green-800";
      case "PICKUP": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "COMPLETED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatOrderName = (order) => {
    return `Order #${order._id?.slice(-6) || 'N/A'}`;
  };

  // Helper function to calculate tab counts with search filter
  const getTabCount = (tabName) => {
    const searchFilteredOrders = orders.filter(order => {
      if (!searchQuery.trim()) return true;
      const orderId = order._id?.slice(-6) || '';
      return orderId.toLowerCase().includes(searchQuery.toLowerCase());
    });

    switch (tabName) {
      case "All Orders":
        return searchFilteredOrders.length;
      case "In Progress":
        return searchFilteredOrders.filter(o => o.orderStatus === "IN_PROGRESS").length;
      case "Completed":
        return searchFilteredOrders.filter(o => o.orderStatus === "COMPLETED" && o.paymentStatus !== "PAID").length;
      case "Paid":
        return searchFilteredOrders.filter(o => o.paymentStatus === "PAID").length;
      default:
        return 0;
    }
  };

  // Show error message if there's an error
  if (error) {
    console.error("Error fetching orders:", error);
    enqueueSnackbar("Failed to load orders", { variant: "error" });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f6b100]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0f0f0f] min-h-screen">
      <h1 className="text-2xl font-bold text-[#f5f5f5] mb-6">Orders Management</h1>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[#606060]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by Order ID (e.g., a1b2c3)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-[#2a2a2a] rounded-lg bg-[#1a1a1a] text-[#f5f5f5] placeholder-[#606060] focus:outline-none focus:ring-2 focus:ring-[#f6b100] focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-[#606060] hover:text-[#f5f5f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-sm text-[#a0a0a0]">
            Searching for orders with ID containing: <span className="text-[#f6b100] font-medium">"{searchQuery}"</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-[#1a1a1a] p-1 rounded-lg">
        {["All Orders", "In Progress", "Completed", "Paid"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === tab
                ? "bg-[#f6b100] text-[#1f1f1f]"
                : "text-[#f5f5f5] hover:bg-[#262626]"
            }`}
          >
            {tab}
            <span className="ml-2 text-xs">
              ({getTabCount(tab)})
            </span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {displayedOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-[#606060] text-lg">No orders found</div>
            <div className="text-[#404040] text-sm mt-1">
              {searchQuery ? (
                <>
                  No orders found matching "<span className="text-[#f6b100]">{searchQuery}</span>"
                  <div className="mt-2">
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-[#f6b100] hover:text-[#e8a600] underline"
                    >
                      Clear search
                    </button>
                  </div>
                </>
              ) : (
                activeTab === "All Orders" ? "No orders have been created yet" :
                activeTab === "In Progress" ? "No orders are currently in progress" :
                activeTab === "Completed" ? "No orders have been completed yet" :
                activeTab === "Paid" ? "No orders have been paid yet" : "No orders found"
              )}
            </div>
          </div>
        ) : (
          <>
            {displayedOrders.map((order) => (
              <div
                key={order._id}
                className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] hover:border-[#404040] transition-colors"
              >
                <div className="flex items-center justify-between">
                  {/* Order Info */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="text-[#f5f5f5] font-semibold">
                        {formatOrderName(order)}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getOrderTypeColor(order.orderType || 'DINE')}`}>
                          {order.orderType || 'DINE'}
                        </span>
                        {/* <span className="text-[#a0a0a0] text-sm">
                          Rs{(order.totalAmount || 0).toFixed(2)}
                        </span> */}
                        <span className="text-[#606060] text-xs">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 
                           order.printedAt ? new Date(order.printedAt).toLocaleDateString() : 
                           new Date().toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.orderStatus || 'IN_PROGRESS')}`}>
                        {(order.orderStatus || 'IN_PROGRESS').replace("_", " ")}
                      </span>
                      
                      {order.paymentStatus === "PAID" && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          PAID
                        </span>
                      )}
                      
                      {order.paymentStatus === "UNPAID" && order.orderStatus === "COMPLETED" && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          UNPAID
                        </span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleEditOrder(order)}
                      className="px-4 py-2 bg-[#60a5fa] text-white rounded-lg hover:bg-[#3b82f6] transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {/* Order Items and Deals Preview */}
                <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                  <div className="text-[#a0a0a0] text-sm space-y-1">
                    {/* Items */}
                    <div>
                      <span className="font-medium">Items:</span>
                      <span className="ml-1">
                        {order.items && order.items.length > 0 ? (
                          (() => {
                            const itemsText = order.items.map(item => `${item.name || 'Unknown Item'} (${item.quantity || 1})`).join(", ");
                            return itemsText.length > 100 ? itemsText.slice(0, 100) + "..." : itemsText;
                          })()
                        ) : (
                          "No items found"
                        )}
                      </span>
                    </div>
                    
                    {/* Deals */}
                    {/* {order.deals && order.deals.length > 0 && (
                      <div>
                        <span className="font-medium text-[#f6b100]">Deals:</span>
                        <span className="ml-1">
                          {order.deals.map(deal => `${deal.name} (${deal.quantity}x) - Rs${(deal.dealPrice * deal.quantity).toFixed(2)}`).join(", ")}
                        </span>
                      </div>
                    )}
                     */}
                    {/* Total Amount */}
                    {/* <div className="pt-1">
                      <span className="font-medium">Total:</span>
                      <span className="ml-1 text-[#f6b100] font-semibold">
                        Rs{(order.totalAmount || 0).toFixed(2)}
                      </span>
                      {order.deals && order.deals.length > 0 && (
                        <span className="ml-2 text-green-400 text-xs">
                          (Save: Rs{order.deals.reduce((sum, deal) => sum + ((deal.originalPrice - deal.dealPrice) * deal.quantity), 0).toFixed(2)})
                        </span>
                      )}
                    </div> */}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMoreOrders && (
              <div className="flex justify-center pt-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    isLoadingMore
                      ? 'bg-[#2a2a2a] text-[#606060] cursor-not-allowed'
                      : 'bg-[#f6b100] hover:bg-[#e8a600] text-black'
                  }`}
                >
                  {isLoadingMore ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#606060]"></div>
                      <span>Loading...</span>
                    </div>
                  ) : (
                    `Load More Orders (${filteredOrders.length - displayedOrdersCount} remaining)`
                  )}
                </button>
              </div>
            )}

            {/* Orders Count Info */}
            <div className="text-center pt-4">
              <div className="text-[#606060] text-sm">
                Showing {displayedOrders.length} of {filteredOrders.length} orders
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Order Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onOrderUpdated={() => {
            queryClient.invalidateQueries(["orders"]);
            setEditingOrder(null);
          }}
          onCompleteOrder={handleCompleteOrder}
        />
      )}
    </div>
  );
};

export default OrdersManagement;

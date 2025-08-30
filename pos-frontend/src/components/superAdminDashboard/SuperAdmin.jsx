import React, { useState, useEffect, useCallback } from "react";
import {
  FaUserPlus,
  FaUsers,
  FaUtensils,
  FaEdit,
  FaTrash,
  FaEye,
  FaSignOutAlt,
  FaExclamationTriangle,
} from "react-icons/fa";
import { MdRestaurantMenu, MdAssignment } from "react-icons/md";
import {
  logout as logoutAPI,
  superAdminLogout,
  getAllAdmin,
  getCategoriesForAdmin,
  getAllItemsOfAdmin,
  getAllMenuOfAdmin,
  deleteCategory,
  updateCategory,
  deleteItem,
  updateItem,
  deleteMenu,
  updateMenu,
  getReceiptsByAdmin,
  getOrdersByAdmin,
  exportOrdersToExcel,
  getAllVouchers,
  getVouchersByAdmin,
  deleteVoucher,
  getDealsByAdmin,
  deleteDeal,
} from "../../https/index";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import CreateUserModal from "../superAdminModals/CreateUserModal";
import CreateCategoryModal from "../superAdminModals/CreateCategoryModal";
import CreateItemModal from "../superAdminModals/CreateItemModal";
import CreateMenuModal from "../superAdminModals/CreateMenuModal";
import EditCategoryModal from "../superAdminModals/EditCategoryModal";
import EditItemModal from "../superAdminModals/EditItemModal";
import EditMenuModal from "../superAdminModals/EditMenuModal";
import CreateVoucherModal from "../superAdminModals/CreateVoucherModal";
import EditVoucherModal from "../superAdminModals/EditVoucherModal";
import CreateDealModal from "../superAdminModals/CreateDealModal";
import EditDealModal from "../superAdminModals/EditDealModal";

const tabs = ["Setup Wizard", "All Admins"];

const setupSteps = [
  {
    id: 1,
    title: "Create User",
    description: "First, create a user account",
    completed: false,
  },
  {
    id: 2,
    title: "Create Categories",
    description: "Create multiple categories for menu items",
    completed: false,
  },
  {
    id: 3,
    title: "Create Items",
    description: "Add multiple menu items to categories",
    completed: false,
  },
  {
    id: 4,
    title: "Create Menu",
    description: "Create the final menu with logo and items",
    completed: false,
  },
];

// Mock data for demonstration

const SuperAdmin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "POS | Super Admin Dashboard";
  }, []);

  const [activeTab, setActiveTab] = useState("All Admins");
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [createdUser, setCreatedUser] = useState(null);
  const [createdCategories, setCreatedCategories] = useState([]);
  const [createdItems, setCreatedItems] = useState([]);
  const [createdMenu, setCreatedMenu] = useState(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] =
    useState(false);
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [isCreateMenuModalOpen, setIsCreateMenuModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminDetailView, setAdminDetailView] = useState("Analytics");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Category management states
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  // Item management states
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);
  const [isUpdatingItem, setIsUpdatingItem] = useState(false);

  // Menu management states
  const [editingMenu, setEditingMenu] = useState(null);
  const [showDeleteMenuModal, setShowDeleteMenuModal] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [isDeletingMenu, setIsDeletingMenu] = useState(false);
  const [isUpdatingMenu, setIsUpdatingMenu] = useState(false);
  const [showAddItemInMenuEdit, setShowAddItemInMenuEdit] = useState(false);
  const [newlyAddedItemId, setNewlyAddedItemId] = useState(null);

  // Voucher management states
  const [isCreateVoucherModalOpen, setIsCreateVoucherModalOpen] =
    useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [showDeleteVoucherModal, setShowDeleteVoucherModal] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);
  const [isDeletingVoucher, setIsDeletingVoucher] = useState(false);
  const [allVouchers, setAllVouchers] = useState([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [vouchersError, setVouchersError] = useState("");

  // Deal Management State
  const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [showDeleteDealModal, setShowDeleteDealModal] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);
  const [allDeals, setAllDeals] = useState([]);
  const [isLoadingDeals, setIsLoadingDeals] = useState(false);
  const [dealsError, setDealsError] = useState("");

  // State for fetched data from APIs
  const [allAdmins, setAllAdmins] = useState([]);
  const [adminCategories, setAdminCategories] = useState([]);
  const [adminItems, setAdminItems] = useState([]);
  const [adminMenu, setAdminMenu] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false);

  // Error states for API calls
  const [adminsError, setAdminsError] = useState("");
  const [categoriesError, setCategoriesError] = useState("");
  const [itemsError, setItemsError] = useState("");
  const [menuError, setMenuError] = useState("");

  // Analytics states
  const [adminOrders, setAdminOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingSingleOrder, setIsExportingSingleOrder] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [searchOrderId, setSearchOrderId] = useState("");
  const [displayedOrdersCount, setDisplayedOrdersCount] = useState(5);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topSellingItems: [],
    salesByDate: [],
    recentTransactions: [],
    dealMetrics: {
      totalDealRevenue: 0,
      totalDealsSold: 0,
      totalDealsSavings: 0,
      topDeals: [],
      dealPercentageOfSales: 0,
    },
  });

  const handleStepCompletion = (stepId, data = null) => {
    if (stepId === 1) {
      setCreatedUser(data);
      setCurrentStep(2);
      setCompletedSteps((prev) => [...prev, stepId]);
      // Fetch all admins when user is created
      fetchAllAdmins();
    } else if (stepId === 2) {
      // For categories, append new data to existing categories
      if (data) {
        if (Array.isArray(data)) {
          setCreatedCategories((prev) => [...prev, ...data]);
        } else {
          setCreatedCategories((prev) => [...prev, data]);
        }
      }
      // Don't auto-advance to next step, let user add more categories
      // They can manually proceed to step 3 when ready
    } else if (stepId === 3) {
      // For items, append new data to existing items
      if (data) {
        if (Array.isArray(data)) {
          setCreatedItems((prev) => [...prev, ...data]);
        } else {
          setCreatedItems((prev) => [...prev, data]);
        }
      }
      // Don't auto-advance to next step, let user add more items
      // They can manually proceed to step 4 when ready
    } else if (stepId === 4) {
      setCreatedMenu(data);
      setCurrentStep(5); // Workflow completed
      setCompletedSteps((prev) => [...prev, stepId]);
    }
  };

  // New function to manually advance steps
  const handleManualStepAdvance = (stepId) => {
    if (stepId === 2 && createdCategories.length > 0) {
      setCurrentStep(3);
      setCompletedSteps((prev) => [...prev, stepId]);
    } else if (stepId === 3 && createdItems.length > 0) {
      setCurrentStep(4);
      setCompletedSteps((prev) => [...prev, stepId]);
    }
  };

  // Fetch all admins
  const fetchAllAdmins = async () => {
    setIsLoadingAdmins(true);
    setAdminsError("");
    try {
      const response = await getAllAdmin();
      if (response.data?.success) {
        setAllAdmins(response.data.data || []);
      } else {
        setAdminsError("Failed to fetch admins");
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      setAdminsError("Error loading administrators. Please try again.");
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  // Fetch categories for specific admin
  const fetchCategoriesForAdmin = useCallback(async (adminId) => {
    if (!adminId) {
      setAdminCategories([]);
      return;
    }

    setIsLoadingCategories(true);
    setCategoriesError("");
    try {
      const response = await getCategoriesForAdmin(adminId);
      if (response.data?.success) {
        console.log("mera 1",response.data.data)
        setAdminCategories(response.data.data || []);
      } else {
        setCategoriesError("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories for admin:", error);
      setCategoriesError("Error loading categories. Please try again.");
      setAdminCategories([]);
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Fetch items for specific admin
  const fetchItemsForAdmin = useCallback(async (adminId) => {
    if (!adminId) {
      setAdminItems([]);
      return;
    }

    setIsLoadingItems(true);
    setItemsError("");
    try {
      const response = await getAllItemsOfAdmin(adminId);
      if (response.data?.success) {
        setAdminItems(response.data.data || []);
      } else {
        setItemsError("Failed to fetch menu items");
      }
    } catch (error) {
      console.error("Error fetching items for admin:", error);
      setItemsError("Error loading menu items. Please try again.");
      setAdminItems([]);
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  // Fetch menu for specific admin
  const fetchMenuForAdmin = useCallback(async (adminId) => {
    if (!adminId) {
      setAdminMenu(null);
      setMenuItems([]);
      return;
    }

    setIsLoadingMenu(true);
    setMenuError("");
    try {
      const response = await getAllMenuOfAdmin(adminId);
      console.log("Menu fetch response:", response.data);

      if (response.data?.success && response.data.data?.length > 0) {
        const menus = response.data.data; // Get all menus, not just the first one
        setAdminMenu(menus); // Store all menus

        // Collect all items from all menus
        const allItems = [];
        menus.forEach((menu) => {
          if (menu.itemsID && menu.itemsID.length > 0) {
            allItems.push(...menu.itemsID);
          }
        });

        // Also fetch category names for each item
        await fetchMenuItemsWithCategories(allItems);
      } else {
        setAdminMenu(null);
        setMenuItems([]);
      }
    } catch (error) {
      console.error("Error fetching menu for admin:", error);
      setMenuError("Error loading menu. Please try again.");
      setAdminMenu(null);
      setMenuItems([]);
    } finally {
      setIsLoadingMenu(false);
    }
  }, []);

  // Fetch menu items with category information
  const fetchMenuItemsWithCategories = useCallback(async (items) => {
    if (!items || items.length === 0) {
      setMenuItems([]);
      return;
    }

    setIsLoadingMenuItems(true);
    try {
      // Get all categories for the admin to resolve category names
      const categoriesResponse = await getCategoriesForAdmin(items[0].adminId);
      const categories = categoriesResponse.data?.success
        ? categoriesResponse.data.data || []
        : [];

      // Map items with category information
      const itemsWithCategories = items.map((item) => {
        const category = categories.find((cat) => cat._id === item.categoryId);
        return {
          ...item,
          categoryId: category || { name: "Unknown Category" },
        };
      });

      setMenuItems(itemsWithCategories);
    } catch (error) {
      console.error("Error fetching category information:", error);
      // Still set the items even if category fetch fails
      setMenuItems(items);
    } finally {
      setIsLoadingMenuItems(false);
    }
  }, []);

  // Fetch orders and calculate analytics for specific admin
  const fetchOrdersAndAnalytics = useCallback(async (adminId) => {
    if (!adminId) {
      setAdminOrders([]);
      setAnalyticsData({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        salesByDate: [],
        recentTransactions: [],
      });
      return;
    }

    setIsLoadingOrders(true);
    setOrdersError("");
    try {
      const response = await getOrdersByAdmin(adminId);
      console.log("Orders fetch response:", response.data);
      if (response.data?.success) {
        const orders = response.data.data || [];
        console.log("Processing orders count:", orders.length);

        // Validate orders data
        const validOrders = orders.filter((order) => {
          if (!order) return false;
          // Check if essential fields exist
          if (typeof order.totalAmount !== "number" && !order.totalAmount) {
            console.warn("Order missing totalAmount:", order._id);
          }
          return true;
        });

        // Sort orders by most recent first (recent order manner)
        const sortedOrders = validOrders.sort((a, b) => {
          const dateA = new Date(a.createdAt || new Date());
          const dateB = new Date(b.createdAt || new Date());
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });

        setAdminOrders(sortedOrders);

        // Calculate analytics from sorted orders
        const analytics = calculateAnalytics(sortedOrders);
        console.log("Calculated analytics:", analytics);
        setAnalyticsData(analytics);
      } else {
        setOrdersError("Failed to fetch orders");
        setAdminOrders([]);
        setAnalyticsData({
          totalSales: 0,
          totalOrders: 0,
          averageOrderValue: 0,
          topSellingItems: [],
          salesByDate: [],
          recentTransactions: [],
        });
      }
    } catch (error) {
      console.error("Error fetching orders for admin:", error);
      setOrdersError("Error loading orders data. Please try again.");
      setAdminOrders([]);
      setAnalyticsData({
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        salesByDate: [],
        recentTransactions: [],
      });
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  // Calculate analytics from orders data
  const calculateAnalytics = (orders) => {
    console.log("Starting analytics calculation with orders:", orders.length);

    if (!orders || orders.length === 0) {
      return {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        salesByDate: [],
        recentTransactions: [],
      };
    }

    // Calculate total sales and orders using the same method as PrintReceiptsModal
    let totalSales = 0;
    orders.forEach((order) => {
      let orderTotal = 0;

      // Calculate items total
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const basePrice =
            item.basePrice || item.originalPrice || item.price || 0;
          const options = item.options || [];
          const optionsPrice = options.reduce(
            (sum, opt) => sum + (opt.price || 0),
            0
          );
          const discount = item.discount || item.itemDiscount || 0;
          const quantity = item.quantity || 1;

          const paymentMethod =
            order.paymentMethod || order.paymentType || "CASH";
          const taxRates = item.tax || { card: "0", cash: "0" };
          const taxRate =
            paymentMethod === "CARD"
              ? parseFloat(taxRates.card || "0")
              : parseFloat(taxRates.cash || "0");

          const originalAmount = basePrice + optionsPrice;
          const taxAmount = (originalAmount * taxRate) / 100;
          const finalPrice = originalAmount - discount + taxAmount;

          orderTotal += finalPrice * quantity;
        });
      }

      // Add deals total
      if (order.deals && order.deals.length > 0) {
        order.deals.forEach((deal) => {
          const dealPrice = parseFloat(deal.dealPrice) || 0;
          const quantity = parseInt(deal.quantity) || 1;
          orderTotal += dealPrice * quantity;
        });
      }

      // Subtract voucher discount and add to total sales
      totalSales += orderTotal - (order.voucherDiscount || 0);
    });

    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    console.log("Basic stats:", { totalSales, totalOrders, averageOrderValue });

    // Get recent transactions (last 10)
    const recentTransactions = orders
      .filter((order) => {
        // Filter out orders with invalid dates
        if (!order.createdAt) return false;
        const date = new Date(order.createdAt);
        return !isNaN(date.getTime());
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 10)
      .map((order) => ({
        id: order._id,
        date: order.createdAt,
        amount: parseFloat(order.totalAmount) || 0,
        customer: order.customerInfo?.name || "Walk-in Customer",
        items: order.items?.length || 0,
      }));

    // Calculate sales by date (last 30 days)
    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      last30Days.push({
        date: date.toISOString().split("T")[0],
        sales: 0,
        orders: 0,
      });
    }

    orders.forEach((order) => {
      try {
        // Validate and parse the order date
        if (order.createdAt) {
          const orderDate = new Date(order.createdAt);
          // Check if date is valid
          if (!isNaN(orderDate.getTime())) {
            const orderDateString = orderDate.toISOString().split("T")[0];
            const dayIndex = last30Days.findIndex(
              (day) => day.date === orderDateString
            );
            if (dayIndex !== -1) {
              let orderTotal = 0;
              if (order.items && order.items.length > 0) {
                order.items.forEach((item) => {
                  const basePrice =
                    item.basePrice || item.originalPrice || item.price || 0;
                  const options = item.options || [];
                  const optionsPrice = options.reduce(
                    (sum, opt) => sum + (opt.price || 0),
                    0
                  );
                  const discount = item.discount || item.itemDiscount || 0;
                  const quantity = item.quantity || 1;

                  const paymentMethod =
                    order.paymentMethod || order.paymentType || "CASH";
                  const taxRates = item.tax || { card: "0", cash: "0" };
                  const taxRate =
                    paymentMethod === "CARD"
                      ? parseFloat(taxRates.card || "0")
                      : parseFloat(taxRates.cash || "0");

                  const originalAmount = basePrice + optionsPrice;
                  const taxAmount = (originalAmount * taxRate) / 100;
                  const finalPrice = originalAmount - discount + taxAmount;

                  orderTotal += finalPrice * quantity;
                });
              }
              const finalAmount = orderTotal - (order.voucherDiscount || 0);
              last30Days[dayIndex].sales += finalAmount;
              last30Days[dayIndex].orders += 1;
            }
          }
        }
      } catch (dateError) {
        console.warn(
          "Invalid date found in order:",
          order._id,
          order.createdAt
        );
      }
    });

    // Calculate top selling items
    const itemCounts = {};
    orders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          try {
            const itemName = item.name || "Unknown Item";
            const quantity = parseInt(item.quantity) || 1;
            const price = parseFloat(item.price) || 0;

            if (!itemCounts[itemName]) {
              itemCounts[itemName] = {
                name: itemName,
                quantity: 0,
                totalRevenue: 0,
              };
            }
            itemCounts[itemName].quantity += quantity;
            itemCounts[itemName].totalRevenue += price * quantity;
          } catch (itemError) {
            console.warn("Error processing item:", item, itemError);
          }
        });
      }
    });

    const topSellingItems = Object.values(itemCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log("Top selling items:", topSellingItems);

    // Calculate deal analytics
    let totalDealRevenue = 0;
    let totalDealsSold = 0;
    let totalDealsSavings = 0;
    const dealCounts = {};

    orders.forEach((order) => {
      if (order.deals && Array.isArray(order.deals)) {
        order.deals.forEach((deal) => {
          try {
            const dealName = deal.name || "Unknown Deal";
            const quantity = parseInt(deal.quantity) || 1;
            const dealPrice = parseFloat(deal.dealPrice) || 0;
            const originalPrice = parseFloat(deal.originalPrice) || 0;
            const savings = (originalPrice - dealPrice) * quantity;

            totalDealRevenue += dealPrice * quantity;
            totalDealsSold += quantity;
            totalDealsSavings += savings;

            if (!dealCounts[dealName]) {
              dealCounts[dealName] = {
                name: dealName,
                quantity: 0,
                totalRevenue: 0,
                totalSavings: 0,
              };
            }
            dealCounts[dealName].quantity += quantity;
            dealCounts[dealName].totalRevenue += dealPrice * quantity;
            dealCounts[dealName].totalSavings += savings;
          } catch (dealError) {
            console.warn("Error processing deal:", deal, dealError);
          }
        });
      }
    });

    const topDeals = Object.values(dealCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    console.log("Deal analytics:", {
      totalDealRevenue,
      totalDealsSold,
      totalDealsSavings,
      topDeals,
    });

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      topSellingItems,
      salesByDate: last30Days,
      recentTransactions,
      // Deal analytics
      dealMetrics: {
        totalDealRevenue,
        totalDealsSold,
        totalDealsSavings,
        topDeals,
        dealPercentageOfSales:
          totalSales > 0 ? (totalDealRevenue / totalSales) * 100 : 0,
      },
    };
  };

  // Handle Excel export
  const handleExportToExcel = async (adminId) => {
    try {
      setIsExportingExcel(true);
      const response = await exportOrdersToExcel(adminId);
      if (response.data?.success) {
        const excelData = response.data.data;

        // Create workbook and worksheet
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Set column widths
        const columnWidths = [
          { wch: 12 }, // Order ID
          { wch: 12 }, // Order Date
          { wch: 12 }, // Order Time
          { wch: 12 }, // Order Type
          { wch: 15 }, // Order Status
          { wch: 15 }, // Payment Status
          { wch: 15 }, // Payment Method
          { wch: 20 }, // Customer Name
          { wch: 15 }, // Customer Phone
          { wch: 30 }, // Customer Address
          { wch: 12 }, // Table Number
          { wch: 12 }, // Total Amount
          { wch: 10 }, // Total Tax
          { wch: 15 }, // Voucher Code
          { wch: 15 }, // Voucher Discount
          { wch: 12 }, // Total Items
          { wch: 25 }, // Item Name
          { wch: 12 }, // Item Quantity
          { wch: 12 }, // Item Price
          { wch: 12 }, // Item Total
          { wch: 20 }, // Menu Name
          { wch: 15 }, // Category
          { wch: 20 }, // Item Notes
        ];
        worksheet["!cols"] = columnWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

        // Generate filename
        const filename = `orders_${selectedAdmin.email}_${
          new Date().toISOString().split("T")[0]
        }.xlsx`;

        // Download file
        XLSX.writeFile(workbook, filename);

        console.log("Excel export completed successfully");
      } else {
        console.error("Failed to export orders:", response.data?.message);
        alert("Failed to export orders. Please try again.");
      }
    } catch (error) {
      console.error("Error exporting orders:", error);
      alert("Error exporting orders. Please try again.");
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Handle Excel export for a single order
  const handleExportSingleOrder = async (order) => {
    try {
      setIsExportingSingleOrder(true);

      // Calculate order totals
      let totalOriginalAmount = 0;
      let totalItemDiscount = 0;
      let totalTaxAmount = 0;
      let totalFinalAmount = 0;
      let totalBasePrice = 0;
      let totalOptionsPrice = 0;

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const basePrice =
            item.basePrice || item.originalPrice || item.price || 0;
          const options = item.options || [];
          const optionsPrice = options.reduce(
            (sum, opt) => sum + (opt.price || 0),
            0
          );
          const discount = item.discount || item.itemDiscount || 0;
          const quantity = item.quantity || 1;

          // Determine tax rate based on payment method
          const paymentMethod =
            order.paymentMethod || order.paymentType || "CASH";
          const taxRates = item.tax || { card: "0", cash: "0" };
          const taxRate =
            paymentMethod === "CARD"
              ? parseFloat(taxRates.card || "0")
              : parseFloat(taxRates.cash || "0");

          // Calculate amounts
          const originalAmount = basePrice + optionsPrice;
          const taxAmount = (originalAmount * taxRate) / 100;
          const finalPrice = originalAmount - discount + taxAmount;

          totalOriginalAmount += originalAmount * quantity;
          totalItemDiscount += discount * quantity;
          totalTaxAmount += taxAmount * quantity;
          totalFinalAmount += finalPrice * quantity;
          totalBasePrice += basePrice * quantity;
          totalOptionsPrice += optionsPrice * quantity;
        });
      }

      const voucherDiscount = order.voucherDiscount || 0;
      const finalOrderTotal = totalFinalAmount - voucherDiscount;

      // Format date and time
      const orderDateTime = order.createdAt
        ? new Date(order.createdAt)
        : new Date();
      const formattedDate = !isNaN(orderDateTime.getTime())
        ? orderDateTime.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        : "N/A";
      const formattedTime = !isNaN(orderDateTime.getTime())
        ? orderDateTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "N/A";

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Create multiple worksheets for better organization

      // === WORKSHEET 1: ORDER SUMMARY ===
      const summaryData = [
        ["🍽️ ORDER DETAILS REPORT", "", "", ""],
        [
          "Generated on:",
          new Date().toLocaleDateString("en-GB"),
          new Date().toLocaleTimeString("en-US"),
          "",
        ],
        ["", "", "", ""],
        ["📋 ORDER INFORMATION", "", "", ""],
        [
          "Order ID:",
          order._id ? String(order._id).slice(-8).toUpperCase() : "N/A",
          "",
          "",
        ],
        ["Order Type:", order.orderType || "DINE", "", ""],
        ["Order Status:", order.orderStatus || "COMPLETED", "", ""],
        ["Order Date:", formattedDate, "", ""],
        ["Order Time:", formattedTime, "", ""],
        [
          "Payment Method:",
          order.paymentMethod || order.paymentType || "CASH",
          "",
          "",
        ],
        ["", "", "", ""],
        ["📊 FINANCIAL SUMMARY", "", "", ""],
        ["Total Items:", order.items?.length || 0, "", ""],
        ["Base Price Total:", `Rs ${totalBasePrice.toFixed(2)}`, "", ""],
        ["Options Price Total:", `Rs ${totalOptionsPrice.toFixed(2)}`, "", ""],
        [
          "Gross Total:",
          `Rs ${(totalBasePrice + totalOptionsPrice).toFixed(2)}`,
          "",
          "",
        ],
        ["Item Discounts:", `Rs ${totalItemDiscount.toFixed(2)}`, "", ""],
        ["Tax Amount:", `Rs ${totalTaxAmount.toFixed(2)}`, "", ""],
        ["Voucher Discount:", `Rs ${voucherDiscount.toFixed(2)}`, "", ""],
        ["", "", "", ""],
        ["💰 FINAL TOTAL:", `Rs ${finalOrderTotal.toFixed(2)}`, "", ""],
        [
          "Total Savings:",
          `Rs ${(totalItemDiscount + voucherDiscount).toFixed(2)}`,
          "",
          "",
        ],
      ];

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);

      // Style the summary worksheet
      summaryWorksheet["!cols"] = [
        { wch: 25 }, // Labels
        { wch: 20 }, // Values
        { wch: 15 }, // Extra space
        { wch: 15 }, // Extra space
      ];

      // === WORKSHEET 2: ITEMS BREAKDOWN ===
      const itemsData = [
        ["🛍️ ITEMS BREAKDOWN", "", "", "", "", "", "", "", "", "", "", ""],
        ["", "", "", "", "", "", "", "", "", "", "", ""],
        [
          "#",
          "Item Name",
          "Category",
          "Menu",
          "Qty",
          "Base Price",
          "Options",
          "Options Price",
          "Discount",
          "Tax Rate",
          "Tax Amount",
          "Subtotal",
        ],
      ];

      // Add individual items
      if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
          const basePrice =
            item.basePrice || item.originalPrice || item.price || 0;
          const options = item.options || [];
          const optionsPrice = options.reduce(
            (sum, opt) => sum + (opt.price || 0),
            0
          );
          const discount = item.discount || item.itemDiscount || 0;
          const quantity = item.quantity || 1;

          // Calculate tax
          const paymentMethod =
            order.paymentMethod || order.paymentType || "CASH";
          const taxRates = item.tax || { card: "0", cash: "0" };
          const taxRate =
            paymentMethod === "CARD"
              ? parseFloat(taxRates.card || "0")
              : parseFloat(taxRates.cash || "0");
          const originalAmount = basePrice + optionsPrice;
          const taxAmount = (originalAmount * taxRate) / 100;
          const finalPrice = originalAmount - discount + taxAmount;

          // Format options for display
          const optionsText =
            options.length > 0
              ? options.map((opt) => `${opt.name} (+Rs${opt.price})`).join(", ")
              : "None";

          itemsData.push([
            index + 1,
            item.name || "Unknown Item",
            item.categoryName || "General",
            item.menuName || "General Items",
            quantity,
            `Rs ${basePrice.toFixed(2)}`,
            optionsText,
            `Rs ${optionsPrice.toFixed(2)}`,
            `Rs ${discount.toFixed(2)}`,
            `${taxRate}%`,
            `Rs ${taxAmount.toFixed(2)}`,
            `Rs ${(finalPrice * quantity).toFixed(2)}`,
          ]);
        });
      }

      // Add totals row
      itemsData.push(["", "", "", "", "", "", "", "", "", "", "", ""]);
      itemsData.push([
        "",
        "TOTALS",
        "",
        "",
        order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0,
        `Rs ${totalBasePrice.toFixed(2)}`,
        "",
        `Rs ${totalOptionsPrice.toFixed(2)}`,
        `Rs ${totalItemDiscount.toFixed(2)}`,
        "",
        `Rs ${totalTaxAmount.toFixed(2)}`,
        `Rs ${totalFinalAmount.toFixed(2)}`,
      ]);

      const itemsWorksheet = XLSX.utils.aoa_to_sheet(itemsData);

      // Style the items worksheet
      itemsWorksheet["!cols"] = [
        { wch: 5 }, // #
        { wch: 25 }, // Item Name
        { wch: 15 }, // Category
        { wch: 20 }, // Menu
        { wch: 8 }, // Qty
        { wch: 12 }, // Base Price
        { wch: 35 }, // Options
        { wch: 15 }, // Options Price
        { wch: 12 }, // Discount
        { wch: 10 }, // Tax Rate
        { wch: 12 }, // Tax Amount
        { wch: 15 }, // Subtotal
      ];

      // === WORKSHEET 3: CALCULATION BREAKDOWN ===
      const calculationData = [
        ["🧮 CALCULATION BREAKDOWN", "", ""],
        ["", "", ""],
        ["Step", "Description", "Amount"],
        ["1", "Base Price Total", `Rs ${totalBasePrice.toFixed(2)}`],
        ["2", "Add: Options Price", `Rs ${totalOptionsPrice.toFixed(2)}`],
        [
          "3",
          "Gross Amount",
          `Rs ${(totalBasePrice + totalOptionsPrice).toFixed(2)}`,
        ],
        ["4", "Less: Item Discounts", `Rs ${totalItemDiscount.toFixed(2)}`],
        [
          "5",
          "Amount After Discounts",
          `Rs ${(
            totalBasePrice +
            totalOptionsPrice -
            totalItemDiscount
          ).toFixed(2)}`,
        ],
        ["6", "Add: Tax Amount", `Rs ${totalTaxAmount.toFixed(2)}`],
        ["7", "Subtotal", `Rs ${totalFinalAmount.toFixed(2)}`],
        ["8", "Less: Voucher Discount", `Rs ${voucherDiscount.toFixed(2)}`],
        ["", "", ""],
        ["💰", "FINAL TOTAL", `Rs ${finalOrderTotal.toFixed(2)}`],
        ["", "", ""],
        [
          "📈",
          "Total Savings",
          `Rs ${(totalItemDiscount + voucherDiscount).toFixed(2)}`,
        ],
        ["", "", ""],
        ["📊 PAYMENT BREAKDOWN", "", ""],
        [
          "Payment Method:",
          order.paymentMethod || order.paymentType || "CASH",
          "",
        ],
        ["Payment Status:", order.paymentStatus || "COMPLETED", ""],
        ["Order Status:", order.orderStatus || "COMPLETED", ""],
      ];

      const calculationWorksheet = XLSX.utils.aoa_to_sheet(calculationData);

      // Style the calculation worksheet
      calculationWorksheet["!cols"] = [
        { wch: 15 }, // Step
        { wch: 30 }, // Description
        { wch: 20 }, // Amount
      ];

      // Add worksheets to workbook
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Order Summary");
      XLSX.utils.book_append_sheet(workbook, itemsWorksheet, "Items Details");
      XLSX.utils.book_append_sheet(
        workbook,
        calculationWorksheet,
        "Calculations"
      );

      // Generate filename with timestamp
      const orderId = order._id
        ? String(order._id).slice(-8).toUpperCase()
        : "ORDER";
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .split("T")[0];
      const filename = `Order_${orderId}_Details_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);

      console.log("Enhanced single order Excel export completed successfully");
    } catch (error) {
      console.error("Error exporting single order:", error);
      alert("Error exporting order details. Please try again.");
    } finally {
      setIsExportingSingleOrder(false);
    }
  };

  // Load initial data on component mount
  useEffect(() => {
    fetchAllAdmins();
  }, []);

  // Fetch data when switching to All Admins tab
  useEffect(() => {
    if (activeTab === "All Admins") {
      fetchAllAdmins();
    }
  }, [activeTab]);

  // Fetch categories and items when an admin is selected
  useEffect(() => {
    if (selectedAdmin && selectedAdmin._id) {
      fetchCategoriesForAdmin(selectedAdmin._id);
      fetchItemsForAdmin(selectedAdmin._id);
      fetchMenuForAdmin(selectedAdmin._id);
      fetchOrdersAndAnalytics(selectedAdmin._id);
    }
  }, [
    selectedAdmin,
    fetchCategoriesForAdmin,
    fetchItemsForAdmin,
    fetchMenuForAdmin,
    fetchOrdersAndAnalytics,
  ]);

  // Simple modal handlers - actual form logic is in the modal components
  const handleCloseUserModal = useCallback(() => {
    setIsCreateUserModalOpen(false);
  }, []);

  const handleCloseCategoryModal = useCallback(() => {
    setIsCreateCategoryModalOpen(false);
  }, []);

  const handleCloseItemModal = useCallback(() => {
    setIsCreateItemModalOpen(false);
  }, []);

  const handleCloseMenuModal = useCallback(() => {
    setIsCreateMenuModalOpen(false);
  }, []);

  // Category management handlers
  const handleDeleteCategory = useCallback(async (adminId, categoryId) => {
    setIsDeletingCategory(true);
    try {
      const response = await deleteCategory(adminId, categoryId);
      if (response.data?.success) {
        // Refresh categories for the admin
        await fetchCategoriesForAdmin(adminId);
        setShowDeleteCategoryModal(false);
        setCategoryToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      setCategoriesError("Failed to delete category. Please try again.");
    } finally {
      setIsDeletingCategory(false);
    }
  }, []);

  const handleUpdateCategory = useCallback(
    async (newName) => {
      if (!editingCategory || !newName || newName.trim() === "") return;

      setIsUpdatingCategory(true);
      try {
        const response = await updateCategory(
          selectedAdmin._id,
          editingCategory._id,
          { name: newName.trim() }
        );
        if (response.data?.success) {
          // Refresh categories for the admin
          await fetchCategoriesForAdmin(selectedAdmin._id);
          setEditingCategory(null);
        }
      } catch (error) {
        console.error("Error updating category:", error);
        setCategoriesError("Failed to update category. Please try again.");
      } finally {
        setIsUpdatingCategory(false);
      }
    },
    [editingCategory, selectedAdmin, fetchCategoriesForAdmin]
  );

  const handleEditCategoryClick = useCallback((category) => {
    setEditingCategory({ ...category });
  }, []);

  const handleDeleteCategoryClick = useCallback((category) => {
    setCategoryToDelete(category);
    setShowDeleteCategoryModal(true);
  }, []);

  const handleEditCategoryNameChange = useCallback((e) => {
    setEditingCategory((prev) => ({
      ...prev,
      name: e.target.value,
    }));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
  }, []);

  // Separate component for category row to prevent re-renders
  const CategoryRow = React.memo(({ category }) => {
    const isEditing = editingCategory && editingCategory._id === category._id;

    return (
      <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
        <div className="flex-1">
          {isEditing ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={editingCategory.name}
                onChange={handleEditCategoryNameChange}
                disabled={isUpdatingCategory}
                className="flex-1 p-2 bg-[#262626] text-[#f5f5f5] rounded border border-[#404040] focus:border-[#60a5fa] focus:outline-none disabled:opacity-50"
                placeholder="Category name"
                autoFocus
              />
              <button
                onClick={() => handleUpdateCategory(editingCategory.name)}
                disabled={isUpdatingCategory || !editingCategory.name.trim()}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  isUpdatingCategory || !editingCategory.name.trim()
                    ? "bg-[#404040] text-[#606060] cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {isUpdatingCategory ? "Saving..." : "Save"}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isUpdatingCategory}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  isUpdatingCategory
                    ? "bg-[#404040] text-[#606060] cursor-not-allowed"
                    : "bg-[#404040] hover:bg-[#505050] text-[#f5f5f5]"
                }`}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <h4 className="text-[#f5f5f5] font-medium">{category.name}</h4>
              <p className="text-[#a0a0a0] text-sm">
                Created: {new Date(category.createdAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">
              Active
            </span>
            <button
              onClick={() => handleEditCategoryClick(category)}
              className="p-2 bg-[#404040] hover:bg-[#505050] rounded text-[#10b981]"
            >
              <FaEdit size={14} />
            </button>
            <button
              onClick={() => handleDeleteCategoryClick(category)}
              className="p-2 bg-[#404040] hover:bg-[#505050] rounded text-[#ef4444]"
            >
              <FaTrash size={14} />
            </button>
          </div>
        )}
      </div>
    );
  });

  // Item management handlers
  const handleDeleteItem = useCallback(async (adminId, itemId) => {
    setIsDeletingItem(true);
    try {
      const response = await deleteItem(adminId, itemId);
      if (response.data?.success) {
        // Refresh items for the admin
        await fetchItemsForAdmin(adminId);
        // Also refresh menu to update item counts
        await fetchMenuForAdmin(adminId);
        setShowDeleteItemModal(false);
        setItemToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setItemsError("Failed to delete item. Please try again.");
    } finally {
      setIsDeletingItem(false);
    }
  }, []);

  const handleUpdateItem = useCallback(
    async (itemData) => {
      if (!editingItem || !itemData.name || itemData.name.trim() === "") return;
      if (!itemData.price || isNaN(parseFloat(itemData.price))) return;

      setIsUpdatingItem(true);
      try {
        const response = await updateItem(selectedAdmin._id, editingItem._id, {
          name: itemData.name.trim(),
          price: parseFloat(itemData.price),
          description: itemData.description?.trim() || "",
          pictureURL: editingItem.pictureURL,
          categoryId: editingItem.categoryId,
          options: itemData.options || [],
        });
        if (response.data?.success) {
          // Refresh items for the admin
          await fetchItemsForAdmin(selectedAdmin._id);
          // Also refresh menu to update item data
          await fetchMenuForAdmin(selectedAdmin._id);
          setEditingItem(null);
        }
      } catch (error) {
        console.error("Error updating item:", error);
        setItemsError("Failed to update item. Please try again.");
      } finally {
        setIsUpdatingItem(false);
      }
    },
    [editingItem, selectedAdmin, fetchItemsForAdmin, fetchMenuForAdmin]
  );

  const handleEditItemClick = useCallback((item) => {
    setEditingItem({ ...item });
  }, []);

  const handleDeleteItemClick = useCallback((item) => {
    setItemToDelete(item);
    setShowDeleteItemModal(true);
  }, []);

  const handleCancelItemEdit = useCallback(() => {
    setEditingItem(null);
  }, []);

  // Menu management handlers
  const handleDeleteMenu = useCallback(async (adminId, menuId) => {
    setIsDeletingMenu(true);
    try {
      const response = await deleteMenu(adminId, menuId);
      if (response.data?.success) {
        // Refresh menu for the admin
        await fetchMenuForAdmin(adminId);
        setShowDeleteMenuModal(false);
        setMenuToDelete(null);
      }
    } catch (error) {
      console.error("Error deleting menu:", error);
      setMenuError("Failed to delete menu. Please try again.");
    } finally {
      setIsDeletingMenu(false);
    }
  }, []);

  const handleUpdateMenu = useCallback(
    async (menuData, logoFile = null) => {
      if (!menuData.name || menuData.name.trim() === "") return;
      if (!menuData._id) {
        console.error("Menu ID is missing:", menuData);
        setMenuError("Menu ID is missing. Cannot update menu.");
        return;
      }

      console.log("handleUpdateMenu called with:", { menuData, logoFile });
      console.log("menuData._id:", menuData._id);
      console.log("selectedAdmin._id:", selectedAdmin?._id);

      setIsUpdatingMenu(true);
      try {
        let requestData;

        // If a new logo is provided, use FormData
        if (logoFile) {
          const formData = new FormData();
          formData.append("name", menuData.name.trim());
          formData.append("description", menuData.description?.trim() || "");
          formData.append("itemsID", JSON.stringify(menuData.itemsID || []));
          formData.append("logo", logoFile);
          requestData = formData;
        } else {
          // If no new logo, use JSON data
          requestData = {
            name: menuData.name.trim(),
            description: menuData.description?.trim() || "",
            pictureURL: menuData.pictureURL,
            itemsID: menuData.itemsID || [],
          };
        }

        // Use selectedAdmin._id instead of menuData.adminId to ensure we have a valid adminId
        const adminId = selectedAdmin?._id || menuData.adminId;

        if (!adminId) {
          console.error("Admin ID is missing");
          setMenuError("Admin ID is missing. Cannot update menu.");
          return;
        }

        console.log("About to call updateMenu with:", {
          adminId,
          menuId: menuData._id,
          requestData,
        });

        const response = await updateMenu(adminId, menuData._id, requestData);
        if (response.data?.success) {
          // Refresh menu for the admin
          await fetchMenuForAdmin(adminId);
          setEditingMenu(null);
          setNewlyAddedItemId(null);
        }
      } catch (error) {
        console.error("Error updating menu:", error);
        setMenuError("Failed to update menu. Please try again.");
      } finally {
        setIsUpdatingMenu(false);
      }
    },
    [selectedAdmin, fetchMenuForAdmin]
  );

  const handleItemRemovedFromMenu = useCallback(
    async (removedItem, updatedMenu) => {
      console.log("Item removed from menu:", removedItem.name);

      // Refresh the menu data for the admin to sync with backend
      if (selectedAdmin?._id) {
        await fetchMenuForAdmin(selectedAdmin._id);
      }

      // Update the editing menu state with the new data
      if (updatedMenu) {
        setEditingMenu(updatedMenu);
      }
    },
    [selectedAdmin, fetchMenuForAdmin]
  );

  // ===============================
  // VOUCHER MANAGEMENT FUNCTIONS
  // ===============================

  const fetchAllVouchers = useCallback(async () => {
    setIsLoadingVouchers(true);
    setVouchersError("");

    try {
      const response = await getAllVouchers();
      if (response.data?.success) {
        setAllVouchers(response.data.data || []);
      } else {
        setAllVouchers([]);
        setVouchersError("Failed to load vouchers");
      }
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setAllVouchers([]);
      if (error.response?.status === 404) {
        setVouchersError("No vouchers found");
      } else {
        setVouchersError("Failed to load vouchers");
      }
    } finally {
      setIsLoadingVouchers(false);
    }
  }, []);

  // Fetch vouchers for specific admin
  const fetchVouchersForAdmin = useCallback(async (adminId) => {
    if (!adminId) {
      setAllVouchers([]);
      return;
    }

    setIsLoadingVouchers(true);
    setVouchersError("");

    try {
      const response = await getVouchersByAdmin(adminId);
      if (response.data?.success) {
        setAllVouchers(response.data.data || []);
      } else {
        setAllVouchers([]);
        setVouchersError("Failed to load vouchers for this admin");
      }
    } catch (error) {
      console.error("Error fetching vouchers for admin:", error);
      setAllVouchers([]);
      if (error.response?.status === 404) {
        setVouchersError("No vouchers found for this admin");
      } else {
        setVouchersError("Failed to load vouchers for this admin");
      }
    } finally {
      setIsLoadingVouchers(false);
    }
  }, []);

  const handleCreateVoucher = useCallback(() => {
    setIsCreateVoucherModalOpen(true);
  }, []);

  const handleVoucherCreated = useCallback(() => {
    // Refresh vouchers list based on context
    if (selectedAdmin && adminDetailView === "Vouchers") {
      fetchVouchersForAdmin(selectedAdmin._id);
    } else {
      fetchAllVouchers();
    }
    setIsCreateVoucherModalOpen(false);
  }, [fetchAllVouchers, fetchVouchersForAdmin, selectedAdmin, adminDetailView]);

  const handleEditVoucher = useCallback((voucher) => {
    setEditingVoucher(voucher);
  }, []);

  const handleVoucherUpdated = useCallback(() => {
    // Refresh vouchers list based on context
    if (selectedAdmin && adminDetailView === "Vouchers") {
      fetchVouchersForAdmin(selectedAdmin._id);
    } else {
      fetchAllVouchers();
    }
    setEditingVoucher(null);
  }, [fetchAllVouchers, fetchVouchersForAdmin, selectedAdmin, adminDetailView]);

  const handleDeleteVoucherClick = useCallback((voucher) => {
    setVoucherToDelete(voucher);
    setShowDeleteVoucherModal(true);
  }, []);

  const handleDeleteVoucher = useCallback(async () => {
    if (!voucherToDelete) return;

    setIsDeletingVoucher(true);
    try {
      const response = await deleteVoucher({ voucherId: voucherToDelete._id });
      if (response.data?.success) {
        // Refresh vouchers list based on context
        if (selectedAdmin && adminDetailView === "Vouchers") {
          await fetchVouchersForAdmin(selectedAdmin._id);
        } else {
          await fetchAllVouchers();
        }
        setShowDeleteVoucherModal(false);
        setVoucherToDelete(null);
      } else {
        console.error("Failed to delete voucher");
      }
    } catch (error) {
      console.error("Error deleting voucher:", error);
    } finally {
      setIsDeletingVoucher(false);
    }
  }, [
    voucherToDelete,
    fetchAllVouchers,
    fetchVouchersForAdmin,
    selectedAdmin,
    adminDetailView,
  ]);

  const handleCancelDeleteVoucher = useCallback(() => {
    setShowDeleteVoucherModal(false);
    setVoucherToDelete(null);
  }, []);

  // Deal Management Functions
  const fetchDealsForAdmin = useCallback(async (adminId) => {
    if (!adminId) {
      setAllDeals([]);
      return;
    }

    setIsLoadingDeals(true);
    setDealsError("");

    try {
      const response = await getDealsByAdmin(adminId);
      if (response.data?.success) {
        setAllDeals(response.data.data || []);
      } else {
        setAllDeals([]);
        setDealsError("Failed to load deals for this admin");
      }
    } catch (error) {
      console.error("Error fetching deals for admin:", error);
      setAllDeals([]);
      if (error.response?.status === 404) {
        setDealsError("No deals found for this admin");
      } else {
        setDealsError("Failed to load deals for this admin");
      }
    } finally {
      setIsLoadingDeals(false);
    }
  }, []);

  const handleCreateDeal = useCallback(() => {
    setIsCreateDealModalOpen(true);
  }, []);

  const handleDealCreated = useCallback(
    (newDeal) => {
      // Refresh deals list
      if (selectedAdmin && adminDetailView === "Deals") {
        fetchDealsForAdmin(selectedAdmin._id);
      }
      setIsCreateDealModalOpen(false);
    },
    [fetchDealsForAdmin, selectedAdmin, adminDetailView]
  );

  const handleDealUpdated = useCallback(
    (updatedDeal) => {
      // Refresh deals list
      if (selectedAdmin && adminDetailView === "Deals") {
        fetchDealsForAdmin(selectedAdmin._id);
      }
      setEditingDeal(null);
    },
    [fetchDealsForAdmin, selectedAdmin, adminDetailView]
  );

  const handleEditDeal = useCallback((deal) => {
    setEditingDeal(deal);
  }, []);

  const handleDeleteDeal = useCallback((deal) => {
    setDealToDelete(deal);
    setShowDeleteDealModal(true);
  }, []);

  const confirmDeleteDeal = useCallback(async () => {
    if (!dealToDelete) return;

    setIsDeletingDeal(true);

    try {
      const response = await deleteDeal(dealToDelete._id);
      if (response.data?.success) {
        // Refresh deals list
        if (selectedAdmin && adminDetailView === "Deals") {
          await fetchDealsForAdmin(selectedAdmin._id);
        }
        setShowDeleteDealModal(false);
        setDealToDelete(null);
      } else {
        console.error("Failed to delete deal");
      }
    } catch (error) {
      console.error("Error deleting deal:", error);
    } finally {
      setIsDeletingDeal(false);
    }
  }, [dealToDelete, fetchDealsForAdmin, selectedAdmin, adminDetailView]);

  const handleCancelDeleteDeal = useCallback(() => {
    setShowDeleteDealModal(false);
    setDealToDelete(null);
  }, []);

  const handleEditMenuClick = useCallback(
    (menu) => {
      console.log("handleEditMenuClick called with menu:", menu);
      // Ensure the menu has the adminId when editing
      const editingMenuData = {
        ...menu,
        adminId: selectedAdmin?._id || menu.adminId,
      };
      console.log("Setting editingMenu to:", editingMenuData);
      setEditingMenu(editingMenuData);
    },
    [selectedAdmin]
  );

  const handleDeleteMenuClick = useCallback((menu) => {
    setMenuToDelete(menu);
    setShowDeleteMenuModal(true);
  }, []);

  const handleCancelMenuEdit = useCallback(() => {
    setEditingMenu(null);
    setShowAddItemInMenuEdit(false);
    setNewlyAddedItemId(null);
  }, []);

  // Handler to add item from within menu edit modal
  const handleAddItemFromMenuEdit = useCallback(() => {
    setShowAddItemInMenuEdit(true);
  }, []);

  // Handler to close add item modal from menu edit
  const handleCloseAddItemFromMenuEdit = useCallback(() => {
    setShowAddItemInMenuEdit(false);
  }, []);

  // Handler for when item is successfully added during menu editing
  const handleItemAddedDuringMenuEdit = useCallback(
    async (stepId, data = null) => {
      // Close the add item modal
      setShowAddItemInMenuEdit(false);

      // Track the newly added item ID for auto-addition to menu
      if (data && data._id) {
        setNewlyAddedItemId(data._id);
        // Clear the newly added item ID after a short delay
        setTimeout(() => setNewlyAddedItemId(null), 1000);
      }

      // Refresh admin items to include the new item
      if (selectedAdmin && selectedAdmin._id) {
        await fetchItemsForAdmin(selectedAdmin._id);
      }

      // Also call the regular step completion handler for any other side effects
      handleStepCompletion(stepId, data);
    },
    [selectedAdmin, fetchItemsForAdmin, handleStepCompletion]
  );

  // Logout handlers
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);

    try {
      console.log("Initiating super admin logout process...");
      const response = await superAdminLogout();

      console.log("Super Admin logout API successful:", response);

      // Clear any stored data in localStorage (if any exists)
      localStorage.clear();

      // Clear session storage as well
      sessionStorage.clear();

      console.log("Local storage cleared successfully");

      // Redirect to super admin login page
      navigate("/superAdminlogin", { replace: true });
    } catch (error) {
      console.error("Logout API failed:", error);

      // Log detailed error information
      if (error.response?.data) {
        const { message, error: serverError } = error.response.data;
        console.error("Server error details:", {
          message,
          serverError,
          status: error.response.status,
        });

        // Handle specific error cases
        if (error.response.status === 401) {
          console.warn(
            "Token invalid or expired - user session already cleared"
          );
        } else if (error.response.status === 403) {
          console.warn("Access denied - insufficient permissions");
        } else if (error.response.status === 500) {
          console.error("Server error during logout");
        }
      } else if (error.request) {
        console.error("Network error - unable to reach server:", error.request);
      } else {
        console.error("Unexpected error during logout:", error.message);
      }

      // Even if logout API fails, we should still redirect to login
      // This handles cases where the token is already invalid or expired
      console.log("Performing local cleanup and redirect...");

      // Clear all local data
      localStorage.clear();
      sessionStorage.clear();

      // Force redirect to login page
      window.location.href = "/superAdminlogin";
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // Logout Confirmation Modal
  const LogoutModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#404040] p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-900 flex items-center justify-center">
            <FaExclamationTriangle className="text-yellow-300 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
              Confirm Logout
            </h3>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              Are you sure you want to logout? You will be redirected to the
              login page and will need to sign in again to access the dashboard.
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleLogoutCancel}
            disabled={isLoggingOut}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isLoggingOut
                ? "bg-[#404040] text-[#606060] cursor-not-allowed"
                : "bg-[#404040] hover:bg-[#505050] text-[#f5f5f5]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleLogoutConfirm}
            disabled={isLoggingOut}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isLoggingOut
                ? "bg-[#dc2626] opacity-50 cursor-not-allowed text-white"
                : "bg-red-900 hover:bg-red-800 text-red-100"
            }`}
          >
            {isLoggingOut ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Logging out...
              </div>
            ) : (
              "Logout"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Delete Category Confirmation Modal
  const DeleteCategoryModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#404040] p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900 flex items-center justify-center">
            <FaExclamationTriangle className="text-red-300 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
              Delete Category
            </h3>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              Are you sure you want to delete the category "
              <span className="text-[#f5f5f5] font-medium">
                {categoryToDelete?.name}
              </span>
              "? This action cannot be undone and may affect associated menu
              items.
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setShowDeleteCategoryModal(false);
              setCategoryToDelete(null);
            }}
            disabled={isDeletingCategory}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isDeletingCategory
                ? "bg-[#404040] text-[#606060] cursor-not-allowed"
                : "bg-[#404040] hover:bg-[#505050] text-[#f5f5f5]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() =>
              handleDeleteCategory(selectedAdmin._id, categoryToDelete._id)
            }
            disabled={isDeletingCategory}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isDeletingCategory
                ? "bg-[#dc2626] opacity-50 cursor-not-allowed text-white"
                : "bg-red-900 hover:bg-red-800 text-red-100"
            }`}
          >
            {isDeletingCategory ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </div>
            ) : (
              "Delete Category"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Delete Item Confirmation Modal
  const DeleteItemModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#404040] p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900 flex items-center justify-center">
            <FaExclamationTriangle className="text-red-300 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
              Delete Item
            </h3>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              Are you sure you want to delete the item "
              <span className="text-[#f5f5f5] font-medium">
                {itemToDelete?.name}
              </span>
              "? This action cannot be undone and will remove the item from all
              menus.
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setShowDeleteItemModal(false);
              setItemToDelete(null);
            }}
            disabled={isDeletingItem}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isDeletingItem
                ? "bg-[#404040] text-[#606060] cursor-not-allowed"
                : "bg-[#404040] hover:bg-[#505050] text-[#f5f5f5]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() =>
              handleDeleteItem(selectedAdmin._id, itemToDelete._id)
            }
            disabled={isDeletingItem}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isDeletingItem
                ? "bg-[#dc2626] opacity-50 cursor-not-allowed text-white"
                : "bg-red-900 hover:bg-red-800 text-red-100"
            }`}
          >
            {isDeletingItem ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </div>
            ) : (
              "Delete Item"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // Delete Menu Confirmation Modal
  const DeleteMenuModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] rounded-2xl border border-[#404040] p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-900 flex items-center justify-center">
            <FaExclamationTriangle className="text-red-300 text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-[#f5f5f5] mb-2">
              Delete Menu
            </h3>
            <p className="text-[#a0a0a0] text-sm leading-relaxed">
              Are you sure you want to delete the menu "
              <span className="text-[#f5f5f5] font-medium">
                {menuToDelete?.name}
              </span>
              "? This action cannot be undone and will remove the entire menu.
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              setShowDeleteMenuModal(false);
              setMenuToDelete(null);
            }}
            disabled={isDeletingMenu}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isDeletingMenu
                ? "bg-[#404040] text-[#606060] cursor-not-allowed"
                : "bg-[#404040] hover:bg-[#505050] text-[#f5f5f5]"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() =>
              handleDeleteMenu(selectedAdmin._id, menuToDelete._id)
            }
            disabled={isDeletingMenu}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isDeletingMenu
                ? "bg-[#dc2626] opacity-50 cursor-not-allowed text-white"
                : "bg-red-900 hover:bg-red-800 text-red-100"
            }`}
          >
            {isDeletingMenu ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </div>
            ) : (
              "Delete Menu"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const SetupWizardTab = () => (
    <div className="container mx-auto px-6 md:px-4">
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        <h3 className="text-xl font-bold text-[#f5f5f5] mb-6">
          Restaurant Setup Wizard
        </h3>
        <p className="text-[#a0a0a0] mb-8">
          Follow these steps to set up a complete restaurant system
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {setupSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 ${
                    completedSteps.includes(step.id)
                      ? "bg-green-600 text-white"
                      : currentStep === step.id
                      ? "bg-[#60a5fa] text-white"
                      : "bg-[#404040] text-[#a0a0a0]"
                  }`}
                >
                  {completedSteps.includes(step.id) ? "✓" : step.id}
                </div>
                <span
                  className={`text-xs text-center ${
                    completedSteps.includes(step.id) || currentStep === step.id
                      ? "text-[#f5f5f5]"
                      : "text-[#a0a0a0]"
                  }`}
                >
                  {step.title}
                </span>
                {index < setupSteps.length - 1 && (
                  <div
                    className={`w-full h-1 mt-4 ${
                      completedSteps.includes(step.id)
                        ? "bg-green-600"
                        : "bg-[#404040]"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Create User */}
          <div
            className={`p-6 rounded-lg border-2 ${
              currentStep === 1
                ? "border-[#60a5fa] bg-[#262626]"
                : completedSteps.includes(1)
                ? "border-green-600 bg-[#1a2e1a]"
                : "border-[#404040] bg-[#1a1a1a] opacity-50"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-[#f5f5f5] mb-2">
                  Step 1: Create User Account
                </h4>
                <p className="text-[#a0a0a0] text-sm">
                  Create a user account that will manage the restaurant
                </p>
                {createdUser && (
                  <div className="mt-3 p-3 bg-[#1a2e1a] rounded border border-green-600">
                    <p className="text-green-300 text-sm">
                      ✓ User created: {createdUser.email} ({createdUser.role})
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCreateUserModalOpen(true)}
                disabled={completedSteps.includes(1)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  completedSteps.includes(1)
                    ? "bg-green-600 text-white cursor-not-allowed"
                    : currentStep === 1
                    ? "bg-[#60a5fa] hover:bg-[#3b82f6] text-white"
                    : "bg-[#404040] text-[#a0a0a0] cursor-not-allowed"
                }`}
              >
                {completedSteps.includes(1) ? "Completed" : "Create User"}
              </button>
            </div>
          </div>

          {/* Step 2: Create Categories */}
          <div
            className={`p-6 rounded-lg border-2 ${
              currentStep === 2
                ? "border-[#60a5fa] bg-[#262626]"
                : completedSteps.includes(2)
                ? "border-green-600 bg-[#1a2e1a]"
                : "border-[#404040] bg-[#1a1a1a] opacity-50"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-[#f5f5f5] mb-2">
                  Step 2: Create Categories ({createdCategories.length} created)
                </h4>
                <p className="text-[#a0a0a0] text-sm">
                  Create multiple categories for organizing your menu items
                </p>
                {createdCategories.length > 0 && (
                  <div className="mt-3 p-3 bg-[#1a2e1a] rounded border border-green-600">
                    <p className="text-green-300 text-sm mb-2">
                      ✓ Categories created ({createdCategories.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {createdCategories.map((category, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-800 text-green-200 rounded text-xs"
                        >
                          {typeof category === "string"
                            ? category
                            : category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => setIsCreateCategoryModalOpen(true)}
                  disabled={currentStep < 2 || completedSteps.includes(2)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    completedSteps.includes(2)
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : currentStep === 2
                      ? "bg-[#60a5fa] hover:bg-[#3b82f6] text-white"
                      : "bg-[#404040] text-[#a0a0a0] cursor-not-allowed"
                  }`}
                >
                  {completedSteps.includes(2) ? "Completed" : "Add Category"}
                </button>
                {currentStep === 2 &&
                  createdCategories.length > 0 &&
                  !completedSteps.includes(2) && (
                    <button
                      onClick={() => handleManualStepAdvance(2)}
                      className="px-4 py-2 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                    >
                      Continue to Items →
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Step 3: Create Items */}
          <div
            className={`p-6 rounded-lg border-2 ${
              currentStep === 3
                ? "border-[#60a5fa] bg-[#262626]"
                : completedSteps.includes(3)
                ? "border-green-600 bg-[#1a2e1a]"
                : "border-[#404040] bg-[#1a1a1a] opacity-50"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-[#f5f5f5] mb-2">
                  Step 3: Create Items ({createdItems.length} created)
                </h4>
                <p className="text-[#a0a0a0] text-sm">
                  Add multiple menu items with pictures and assign to categories
                </p>
                {createdItems.length > 0 && (
                  <div className="mt-3 p-3 bg-[#1a2e1a] rounded border border-green-600">
                    <p className="text-green-300 text-sm mb-2">
                      ✓ Items created ({createdItems.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {createdItems.map((item, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-800 text-green-200 rounded text-xs"
                        >
                          {typeof item === "string" ? item : item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => setIsCreateItemModalOpen(true)}
                  disabled={currentStep < 3 || completedSteps.includes(3)}
                  className={`px-4 py-2 rounded text-sm font-medium ${
                    completedSteps.includes(3)
                      ? "bg-green-600 text-white cursor-not-allowed"
                      : currentStep === 3
                      ? "bg-[#60a5fa] hover:bg-[#3b82f6] text-white"
                      : "bg-[#404040] text-[#a0a0a0] cursor-not-allowed"
                  }`}
                >
                  {completedSteps.includes(3) ? "Completed" : "Add Item"}
                </button>
                {currentStep === 3 &&
                  createdItems.length > 0 &&
                  !completedSteps.includes(3) && (
                    <button
                      onClick={() => handleManualStepAdvance(3)}
                      className="px-4 py-2 rounded text-sm font-medium bg-green-600 hover:bg-green-700 text-white"
                    >
                      Continue to Menu →
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Step 4: Create Menu */}
          <div
            className={`p-6 rounded-lg border-2 ${
              currentStep === 4
                ? "border-[#60a5fa] bg-[#262626]"
                : completedSteps.includes(4)
                ? "border-green-600 bg-[#1a2e1a]"
                : "border-[#404040] bg-[#1a1a1a] opacity-50"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-[#f5f5f5] mb-2">
                  Step 4: Create Menu
                </h4>
                <p className="text-[#a0a0a0] text-sm">
                  Create the final menu with logo, name and select items to
                  include
                </p>
                {createdMenu && (
                  <div className="mt-3 p-3 bg-[#1a2e1a] rounded border border-green-600">
                    <p className="text-green-300 text-sm">
                      ✓ Menu created: {createdMenu.name}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsCreateMenuModalOpen(true)}
                disabled={currentStep < 4 || completedSteps.includes(4)}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  completedSteps.includes(4)
                    ? "bg-green-600 text-white cursor-not-allowed"
                    : currentStep === 4
                    ? "bg-[#60a5fa] hover:bg-[#3b82f6] text-white"
                    : "bg-[#404040] text-[#a0a0a0] cursor-not-allowed"
                }`}
              >
                {completedSteps.includes(4) ? "Completed" : "Create Menu"}
              </button>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {completedSteps.length === 4 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-green-900 to-green-800 rounded-lg border border-green-600">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-green-100 mb-2">
                Setup Complete!
              </h3>
              <p className="text-green-200 mb-4">
                Your restaurant system is now ready with user, categories,
                items, and menu. The setup process has been completed
                successfully!
              </p>
              <button
                onClick={() => setActiveTab("All Admins")}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
              >
                Go to All Admins
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const AllAdminsTab = () => {
    if (selectedAdmin) {
      return (
        <div className="container mx-auto px-6 md:px-4">
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedAdmin(null)}
                  className="px-4 py-2 bg-[#404040] hover:bg-[#505050] rounded-lg text-[#f5f5f5]"
                >
                  ← Back to All Admins
                </button>
                <div>
                  <h3 className="text-xl font-bold text-[#f5f5f5]">
                    {selectedAdmin.name}
                  </h3>
                  <p className="text-[#a0a0a0]">
                    {selectedAdmin.email} - Admin Dashboard
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded text-sm bg-green-900 text-green-300">
                Active
              </span>
            </div>

            {/* Admin Information and Statistics */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#f5f5f5] mb-2">
                Admin Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#262626] p-4 rounded-lg">
                  <h4 className="text-[#a0a0a0] text-sm">Total Categories</h4>
                  <p className="text-[#60a5fa] text-2xl font-bold">
                    {adminCategories.length}
                  </p>
                </div>
                <div className="bg-[#262626] p-4 rounded-lg">
                  <h4 className="text-[#a0a0a0] text-sm">Total Menu Items</h4>
                  <p className="text-[#10b981] text-2xl font-bold">
                    {adminItems.length}
                  </p>
                </div>
                <div className="bg-[#262626] p-4 rounded-lg">
                  <h4 className="text-[#a0a0a0] text-sm">Admin Since</h4>
                  <p className="text-[#f59e0b] text-lg font-bold">
                    {selectedAdmin.createdAt
                      ? new Date(selectedAdmin.createdAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mb-6">
              {[
                "Analytics",
                "Categories",
                "Items",
                "Menu",
                "Vouchers",
                "Deals",
                "Settings",
              ].map((view) => (
                <button
                  key={view}
                  onClick={() => {
                    setAdminDetailView(view);
                    // Fetch data when switching to different views
                    if (view === "Analytics") {
                      fetchOrdersAndAnalytics(selectedAdmin._id);
                    } else if (view === "Categories") {
                      fetchCategoriesForAdmin(selectedAdmin._id);
                    } else if (view === "Items") {
                      fetchItemsForAdmin(selectedAdmin._id);
                    } else if (view === "Menu") {
                      fetchMenuForAdmin(selectedAdmin._id);
                    } else if (view === "Vouchers") {
                      fetchVouchersForAdmin(selectedAdmin._id);
                    } else if (view === "Deals") {
                      fetchDealsForAdmin(selectedAdmin._id);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    adminDetailView === view
                      ? "bg-[#60a5fa] text-white"
                      : "bg-[#262626] text-[#f5f5f5] hover:bg-[#404040]"
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Content based on selected view */}
            <div className="bg-[#262626] rounded-lg p-6">
              {adminDetailView === "Analytics" && (
                <div>
                  {/* Header Section */}
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-[#f5f5f5] text-xl font-semibold">
                        Recent Orders
                      </h3>
                      <p className="text-sm text-[#ababab]">
                        Order history for {selectedAdmin.email}'s restaurant
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {isLoadingOrders && (
                        <div className="text-[#60a5fa] text-sm">
                          Loading orders...
                        </div>
                      )}
                      {!isLoadingOrders &&
                        adminOrders &&
                        adminOrders.length > 0 && (
                          <button
                            onClick={() =>
                              handleExportToExcel(selectedAdmin._id)
                            }
                            disabled={isExportingExcel}
                            className={`px-4 py-2 ${
                              isExportingExcel
                                ? "bg-gray-500 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700"
                            } text-white rounded-lg font-medium transition-colors flex items-center gap-2`}
                          >
                            {isExportingExcel ? (
                              <>
                                <svg
                                  className="w-4 h-4 animate-spin"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                Generating Excel...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                  />
                                </svg>
                                Export to Excel
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  </div>

                  {/* Analytics Dashboard Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Sales */}
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#404040]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#a0a0a0] text-sm font-medium">
                            Total Sales
                          </p>
                          <p className="text-[#f5f5f5] text-2xl font-bold">
                            Rs{analyticsData.totalSales.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 bg-green-600/20 rounded-full">
                          <svg
                            className="w-6 h-6 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Total Orders */}
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#404040]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#a0a0a0] text-sm font-medium">
                            Total Orders
                          </p>
                          <p className="text-[#f5f5f5] text-2xl font-bold">
                            {analyticsData.totalOrders}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-600/20 rounded-full">
                          <svg
                            className="w-6 h-6 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Average Order Value */}
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#404040]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#a0a0a0] text-sm font-medium">
                            Avg Order Value
                          </p>
                          <p className="text-[#f5f5f5] text-2xl font-bold">
                            Rs{analyticsData.averageOrderValue.toFixed(2)}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-600/20 rounded-full">
                          <svg
                            className="w-6 h-6 text-purple-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Deal Metrics */}
                    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#404040]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#a0a0a0] text-sm font-medium">
                            Deal Revenue
                          </p>
                          <p className="text-[#f5f5f5] text-2xl font-bold">
                            Rs
                            {analyticsData?.dealMetrics?.totalDealRevenue.toFixed(
                              2
                            )}
                          </p>
                          <p className="text-[#f6b100] text-xs">
                            {analyticsData?.dealMetrics?.dealPercentageOfSales.toFixed(
                              1
                            )}
                            % of total sales
                          </p>
                        </div>
                        <div className="p-3 bg-[#f6b100]/20 rounded-full">
                          <svg
                            className="w-6 h-6 text-[#f6b100]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deals Analytics Section */}
                  {analyticsData?.dealMetrics?.totalDealsSold > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      {/* Deal Metrics Summary */}
                      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#404040]">
                        <h4 className="text-[#f5f5f5] text-lg font-semibold mb-4 flex items-center">
                          <svg
                            className="w-5 h-5 text-[#f6b100] mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          Deal Performance
                        </h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-[#a0a0a0]">
                              Total Deals Sold
                            </span>
                            <span className="text-[#f5f5f5] font-semibold">
                              {analyticsData?.dealMetrics?.totalDealsSold}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#a0a0a0]">
                              Customer Savings
                            </span>
                            <span className="text-green-400 font-semibold">
                              Rs
                              {analyticsData?.dealMetrics?.totalDealsSavings.toFixed(
                                2
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[#a0a0a0]">
                              Revenue from Deals
                            </span>
                            <span className="text-[#f6b100] font-semibold">
                              Rs
                              {analyticsData?.dealMetrics?.totalDealRevenue.toFixed(
                                2
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Top Performing Deals */}
                      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#404040]">
                        <h4 className="text-[#f5f5f5] text-lg font-semibold mb-4">
                          Top Performing Deals
                        </h4>
                        <div className="space-y-3">
                          {analyticsData.dealMetrics.topDeals.length > 0 ? (
                            analyticsData.dealMetrics.topDeals.map(
                              (deal, index) => (
                                <div
                                  key={deal.name}
                                  className="flex items-center justify-between p-3 bg-[#262626] rounded-lg"
                                >
                                  <div className="flex items-center">
                                    <span className="w-6 h-6 bg-[#f6b100] text-[#1f1f1f] rounded-full flex items-center justify-center text-xs font-bold mr-3">
                                      {index + 1}
                                    </span>
                                    <div>
                                      <p className="text-[#f5f5f5] font-medium">
                                        {deal.name}
                                      </p>
                                      <p className="text-[#a0a0a0] text-sm">
                                        {deal.quantity} sold
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[#f6b100] font-semibold">
                                      Rs{deal.totalRevenue.toFixed(2)}
                                    </p>
                                    <p className="text-green-400 text-sm">
                                      Save Rs{deal.totalSavings.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-[#a0a0a0] text-center py-4">
                              No deal data available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Search Bar */}
                  <div className="mb-6">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by Order ID..."
                        value={searchOrderId}
                        onChange={(e) => {
                          setSearchOrderId(e.target.value);
                          setDisplayedOrdersCount(5); // Reset pagination when searching
                        }}
                        className="w-full max-w-md px-4 py-2 pl-10 bg-[#1a1a1a] border border-[#404040] rounded-lg text-[#f5f5f5] placeholder-[#a0a0a0] focus:outline-none focus:border-[#60a5fa]"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="h-5 w-5 text-[#a0a0a0]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      {searchOrderId && (
                        <button
                          onClick={() => {
                            setSearchOrderId("");
                            setDisplayedOrdersCount(5);
                          }}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#a0a0a0] hover:text-[#f5f5f5]"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    {searchOrderId && (
                      <p className="text-[#a0a0a0] text-sm mt-2">
                        Searching for Order ID containing: "{searchOrderId}"
                      </p>
                    )}
                  </div>

                  {ordersError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                      <p className="text-red-300 text-sm">{ordersError}</p>
                    </div>
                  )}

                  {/* Orders Table */}
                  {isLoadingOrders ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#60a5fa] mx-auto"></div>
                      <p className="text-[#a0a0a0] mt-4">
                        Loading order data...
                      </p>
                    </div>
                  ) : adminOrders && adminOrders.length > 0 ? (
                    (() => {
                      // Filter orders based on search
                      const filteredOrders = searchOrderId
                        ? adminOrders.filter((order) => {
                            const orderId = order._id
                              ? String(order._id).slice(-8).toUpperCase()
                              : `ORD-${adminOrders.indexOf(order) + 1}`;
                            return orderId.includes(
                              searchOrderId.toUpperCase()
                            );
                          })
                        : adminOrders;

                      // Get orders to display (with pagination)
                      const ordersToDisplay = filteredOrders.slice(
                        0,
                        displayedOrdersCount
                      );
                      const hasMoreOrders =
                        filteredOrders.length > displayedOrdersCount;

                      return (
                        <div>
                          {filteredOrders.length === 0 ? (
                            <div className="text-center py-12 bg-[#1a1a1a] rounded-lg">
                              <div className="text-4xl mb-4">🔍</div>
                              <h4 className="text-[#f5f5f5] text-lg font-medium mb-2">
                                No Orders Found
                              </h4>
                              <p className="text-[#a0a0a0]">
                                No orders match your search criteria.
                              </p>
                              <p className="text-[#606060] text-sm mt-1">
                                Try searching with a different Order ID.
                              </p>
                            </div>
                          ) : (
                            <>
                              {searchOrderId && (
                                <div className="mb-4 p-3 bg-[#1a1a1a] border border-[#60a5fa] rounded-lg">
                                  <p className="text-[#60a5fa] text-sm">
                                    Found {filteredOrders.length} order
                                    {filteredOrders.length !== 1
                                      ? "s"
                                      : ""}{" "}
                                    matching "{searchOrderId}"
                                    {displayedOrdersCount <
                                      filteredOrders.length &&
                                      ` (showing first ${displayedOrdersCount})`}
                                  </p>
                                </div>
                              )}

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-[#f5f5f5]">
                                  <thead className="bg-[#1a1a1a] text-[#ababab]">
                                    <tr>
                                      <th className="p-3">Order ID</th>
                                      <th className="p-3">Order Type</th>
                                      <th className="p-3">Status</th>
                                      <th className="p-3">Date & Time</th>
                                      <th className="p-3">Items</th>
                                      <th className="p-3">Deals </th>
                                      <th className="p-3">Base Price</th>
                                      <th className="p-3">Options Price</th>
                                      <th className="p-3">Discount</th>
                                      <th className="p-3">Tax</th>
                                      <th className="p-3">Voucher Discount</th>
                                      <th className="p-3">Deal Amount</th>
                                      <th className="p-3">Total</th>
                                      <th className="p-3 text-center">
                                        Payment Method
                                      </th>
                                      <th className="p-3 text-center">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {ordersToDisplay.map((order, index) => {
                                      // Calculate order totals like in PrintReceiptsModal
                                      let totalOriginalAmount = 0;
                                      let totalItemDiscount = 0;
                                      let totalTaxAmount = 0;
                                      let totalFinalAmount = 0;
                                      let totalOptionsPrice = 0;
                                      let totalBasePrice = 0;

                                      if (
                                        order.items &&
                                        order.items.length > 0
                                      ) {
                                        order.items.forEach((item) => {
                                          const basePrice =
                                            item.basePrice ||
                                            item.originalPrice ||
                                            item.price ||
                                            0;
                                          const options = item.options || [];
                                          const optionsPrice = options.reduce(
                                            (sum, opt) =>
                                              sum + (opt.price || 0),
                                            0
                                          );
                                          const discount =
                                            item.discount ||
                                            item.itemDiscount ||
                                            0;
                                          const quantity = item.quantity || 1;

                                          // Determine tax rate based on payment method
                                          const paymentMethod =
                                            order.paymentMethod ||
                                            order.paymentType ||
                                            "CASH";
                                          const taxRates = item.tax || {
                                            card: "0",
                                            cash: "0",
                                          };
                                          const taxRate =
                                            paymentMethod === "CARD"
                                              ? parseFloat(taxRates.card || "0")
                                              : parseFloat(
                                                  taxRates.cash || "0"
                                                );

                                          // Calculate original amount before discounts
                                          const originalAmount =
                                            basePrice + optionsPrice;

                                          // Calculate tax on original amount
                                          const taxAmount =
                                            (originalAmount * taxRate) / 100;

                                          // Final calculation: basePrice + options - discount + tax
                                          const finalPrice =
                                            originalAmount -
                                            discount +
                                            taxAmount;

                                          totalOriginalAmount +=
                                            originalAmount * quantity;
                                          totalItemDiscount +=
                                            discount * quantity;
                                          totalTaxAmount +=
                                            taxAmount * quantity;
                                          totalFinalAmount +=
                                            finalPrice * quantity;
                                          totalOptionsPrice +=
                                            optionsPrice * quantity;
                                          totalBasePrice +=
                                            basePrice * quantity;
                                        });
                                      }

                                      // Calculate deal amounts
                                      let totalDealAmount = 0;
                                      if (
                                        order.deals &&
                                        order.deals.length > 0
                                      ) {
                                        order.deals.forEach((deal) => {
                                          const dealPrice =
                                            parseFloat(deal.dealPrice) || 0;
                                          const quantity =
                                            parseInt(deal.quantity) || 1;
                                          totalDealAmount +=
                                            dealPrice * quantity;
                                        });
                                      }

                                      const voucherDiscount =
                                        order.voucherDiscount || 0;
                                      const finalOrderTotal =
                                        totalFinalAmount +
                                        totalDealAmount -
                                        voucherDiscount;

                                      return (
                                        <tr
                                          key={order._id || index}
                                          className="border-b border-gray-600 hover:bg-[#333] cursor-pointer"
                                          onClick={() =>
                                            setSelectedOrderForDetails(order)
                                          }
                                        >
                                          <td className="p-4">
                                            #
                                            {order._id
                                              ? String(order._id)
                                                  .slice(-8)
                                                  .toUpperCase()
                                              : `ORD-${index + 1}`}
                                          </td>
                                          <td className="p-4">
                                            <span
                                              className={`px-2 py-1 rounded text-xs font-medium ${
                                                order.orderType === "DINE"
                                                  ? "bg-blue-900 text-blue-300"
                                                  : order.orderType ===
                                                    "DELIVERY"
                                                  ? "bg-green-900 text-green-300"
                                                  : order.orderType === "PICKUP"
                                                  ? "bg-orange-900 text-orange-300"
                                                  : "bg-gray-900 text-gray-300"
                                              }`}
                                            >
                                              {order.orderType || "DINE"}
                                            </span>
                                          </td>
                                          <td className="p-4">
                                            <span
                                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                order.orderStatus ===
                                                  "COMPLETED" ||
                                                order.paymentStatus === "PAID"
                                                  ? "bg-green-900 text-green-300"
                                                  : order.orderStatus ===
                                                      "IN_PROGRESS" ||
                                                    order.paymentStatus ===
                                                      "PENDING"
                                                  ? "bg-yellow-900 text-yellow-300"
                                                  : "bg-blue-900 text-blue-300"
                                              }`}
                                            >
                                              {order.orderStatus ||
                                                order.paymentStatus ||
                                                "COMPLETED"}
                                            </span>
                                          </td>
                                          <td className="p-4">
                                            {(() => {
                                              if (!order.createdAt)
                                                return (
                                                  new Date().toLocaleDateString() +
                                                  " " +
                                                  new Date().toLocaleTimeString(
                                                    [],
                                                    {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    }
                                                  )
                                                );
                                              try {
                                                const date = new Date(
                                                  order.createdAt
                                                );
                                                if (isNaN(date.getTime()))
                                                  return (
                                                    new Date().toLocaleDateString() +
                                                    " " +
                                                    new Date().toLocaleTimeString(
                                                      [],
                                                      {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                      }
                                                    )
                                                  );
                                                return (
                                                  date.toLocaleDateString() +
                                                  " " +
                                                  date.toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                  })
                                                );
                                              } catch (error) {
                                                return (
                                                  new Date().toLocaleDateString() +
                                                  " " +
                                                  new Date().toLocaleTimeString(
                                                    [],
                                                    {
                                                      hour: "2-digit",
                                                      minute: "2-digit",
                                                    }
                                                  )
                                                );
                                              }
                                            })()}
                                          </td>
                                          <td className="p-4">
                                            {order.items?.length || 0} Items
                                          </td>
                                          <td className="p-4 text-purple-400">
                                            Rs{totalBasePrice.toFixed(2)}
                                          </td>
                                          <td className="p-4 text-blue-400">
                                            Rs{totalOptionsPrice.toFixed(2)}
                                          </td>
                                          <td className="p-4 text-red-400">
                                            Rs{totalItemDiscount.toFixed(2)}
                                          </td>
                                          <td className="p-4 text-green-400">
                                            Rs{totalTaxAmount.toFixed(2)}
                                          </td>
                                          <td className="p-4 text-orange-400">
                                            Rs{voucherDiscount.toFixed(2)}
                                          </td>
                                          <td className="p-4 text-cyan-400">
                                            Rs{totalDealAmount.toFixed(2)}
                                          </td>
                                          <td className="p-4 font-semibold text-green-400">
                                            Rs{finalOrderTotal.toFixed(2)}
                                          </td>
                                          <td className="p-4 text-center">
                                            <span className="px-2 py-1 bg-[#404040] rounded text-xs">
                                              {order.paymentMethod ||
                                                order.paymentType ||
                                                "CASH"}
                                            </span>
                                          </td>
                                          <td className="p-4 text-center">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOrderForDetails(
                                                  order
                                                );
                                              }}
                                              className="px-3 py-1 bg-[#60a5fa] text-white rounded text-xs hover:bg-[#3b82f6] transition-colors"
                                            >
                                              View Details
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* See More Button */}
                              {hasMoreOrders && (
                                <div className="text-center mt-6">
                                  <button
                                    onClick={() =>
                                      setDisplayedOrdersCount(
                                        (prev) => prev + 5
                                      )
                                    }
                                    className="px-6 py-3 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg font-medium transition-colors"
                                  >
                                    See More Orders (
                                    {filteredOrders.length -
                                      displayedOrdersCount}{" "}
                                    remaining)
                                  </button>
                                </div>
                              )}

                              {/* Show All/Show Less Toggle */}
                              {filteredOrders.length > 5 &&
                                displayedOrdersCount >=
                                  filteredOrders.length && (
                                  <div className="text-center mt-4">
                                    <button
                                      onClick={() => setDisplayedOrdersCount(5)}
                                      className="px-4 py-2 bg-[#404040] hover:bg-[#505050] text-[#f5f5f5] rounded-lg text-sm"
                                    >
                                      Show Less
                                    </button>
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-12 bg-[#1a1a1a] rounded-lg">
                      <div className="text-6xl mb-4">📋</div>
                      <h4 className="text-[#f5f5f5] text-lg font-medium mb-2">
                        No Orders Found
                      </h4>
                      <p className="text-[#a0a0a0]">
                        This restaurant hasn't received any orders yet.
                      </p>
                      <p className="text-[#606060] text-sm mt-1">
                        Orders will appear here once customers start placing
                        them.
                      </p>
                    </div>
                  )}

                  {/* Quick Stats Section */}
                  {adminOrders &&
                    adminOrders.length > 0 &&
                    (() => {
                      // Calculate stats based on filtered results if searching
                      const statsOrders = searchOrderId
                        ? adminOrders.filter((order) => {
                            const orderId = order._id
                              ? String(order._id).slice(-8).toUpperCase()
                              : `ORD-${adminOrders.indexOf(order) + 1}`;
                            return orderId.includes(
                              searchOrderId.toUpperCase()
                            );
                          })
                        : adminOrders;

                      return statsOrders.length > 0 ? (
                        <div className="mt-6">
                          {searchOrderId && (
                            <h4 className="text-[#f5f5f5] font-medium mb-3">
                              Statistics for "{searchOrderId}" (
                              {statsOrders.length} orders)
                            </h4>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-[#1a1a1a] p-4 rounded-lg text-center">
                              <h4 className="text-[#60a5fa] text-2xl font-bold">
                                {statsOrders.length}
                              </h4>
                              <p className="text-[#a0a0a0] text-sm">
                                {searchOrderId
                                  ? "Matching Orders"
                                  : "Total Orders"}
                              </p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-lg text-center">
                              <h4 className="text-[#10b981] text-2xl font-bold">
                                Rs
                                {statsOrders
                                  .reduce((sum, order) => {
                                    let orderTotal = 0;
                                    if (order.items && order.items.length > 0) {
                                      order.items.forEach((item) => {
                                        const basePrice =
                                          item.basePrice ||
                                          item.originalPrice ||
                                          item.price ||
                                          0;
                                        const options = item.options || [];
                                        const optionsPrice = options.reduce(
                                          (sum, opt) => sum + (opt.price || 0),
                                          0
                                        );
                                        const discount =
                                          item.discount ||
                                          item.itemDiscount ||
                                          0;
                                        const quantity = item.quantity || 1;

                                        const paymentMethod =
                                          order.paymentMethod ||
                                          order.paymentType ||
                                          "CASH";
                                        const taxRates = item.tax || {
                                          card: "0",
                                          cash: "0",
                                        };
                                        const taxRate =
                                          paymentMethod === "CARD"
                                            ? parseFloat(taxRates.card || "0")
                                            : parseFloat(taxRates.cash || "0");

                                        const originalAmount =
                                          basePrice + optionsPrice;
                                        const taxAmount =
                                          (originalAmount * taxRate) / 100;
                                        const finalPrice =
                                          originalAmount - discount + taxAmount;

                                        orderTotal += finalPrice * quantity;
                                      });
                                    }
                                    return (
                                      sum +
                                      (orderTotal -
                                        (order.voucherDiscount || 0))
                                    );
                                  }, 0)
                                  .toFixed(2)}
                              </h4>
                              <p className="text-[#a0a0a0] text-sm">
                                Total Revenue
                              </p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-lg text-center">
                              <h4 className="text-[#f59e0b] text-2xl font-bold">
                                Rs
                                {statsOrders.length > 0
                                  ? (
                                      statsOrders.reduce((sum, order) => {
                                        let orderTotal = 0;
                                        if (
                                          order.items &&
                                          order.items.length > 0
                                        ) {
                                          order.items.forEach((item) => {
                                            const basePrice =
                                              item.basePrice ||
                                              item.originalPrice ||
                                              item.price ||
                                              0;
                                            const options = item.options || [];
                                            const optionsPrice = options.reduce(
                                              (sum, opt) =>
                                                sum + (opt.price || 0),
                                              0
                                            );
                                            const discount =
                                              item.discount ||
                                              item.itemDiscount ||
                                              0;
                                            const quantity = item.quantity || 1;

                                            const paymentMethod =
                                              order.paymentMethod ||
                                              order.paymentType ||
                                              "CASH";
                                            const taxRates = item.tax || {
                                              card: "0",
                                              cash: "0",
                                            };
                                            const taxRate =
                                              paymentMethod === "CARD"
                                                ? parseFloat(
                                                    taxRates.card || "0"
                                                  )
                                                : parseFloat(
                                                    taxRates.cash || "0"
                                                  );

                                            const originalAmount =
                                              basePrice + optionsPrice;
                                            const taxAmount =
                                              (originalAmount * taxRate) / 100;
                                            const finalPrice =
                                              originalAmount -
                                              discount +
                                              taxAmount;

                                            orderTotal += finalPrice * quantity;
                                          });
                                        }
                                        return (
                                          sum +
                                          (orderTotal -
                                            (order.voucherDiscount || 0))
                                        );
                                      }, 0) / statsOrders.length
                                    ).toFixed(2)
                                  : "0.00"}
                              </h4>
                              <p className="text-[#a0a0a0] text-sm">
                                Average Order
                              </p>
                            </div>
                            <div className="bg-[#1a1a1a] p-4 rounded-lg text-center">
                              <h4 className="text-[#8b5cf6] text-2xl font-bold">
                                {statsOrders.reduce(
                                  (sum, order) =>
                                    sum + (order.items?.length || 0),
                                  0
                                )}
                              </h4>
                              <p className="text-[#a0a0a0] text-sm">
                                Total Items Sold
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                </div>
              )}

              {adminDetailView === "Categories" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#f5f5f5]">
                      Categories ({adminCategories.length})
                    </h3>
                    {isLoadingCategories && (
                      <div className="text-[#60a5fa] text-sm">Loading...</div>
                    )}
                  </div>

                  {categoriesError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                      <p className="text-red-300 text-sm">{categoriesError}</p>
                    </div>
                  )}

                  {isLoadingCategories ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60a5fa] mx-auto"></div>
                      <p className="text-[#a0a0a0] mt-2">
                        Loading categories...
                      </p>
                    </div>
                  ) : adminCategories.length > 0 ? (
                    <div className="space-y-3">
                      {adminCategories.map((category) => (
                        <CategoryRow key={category._id} category={category} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#a0a0a0]">
                        No categories found for this admin
                      </p>
                      <button
                        onClick={() => setIsCreateCategoryModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg"
                      >
                        Create First Category
                      </button>
                    </div>
                  )}
                </div>
              )}

              {adminDetailView === "Items" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#f5f5f5]">
                      Menu Items ({adminItems.length})
                    </h3>
                    {isLoadingItems && (
                      <div className="text-[#60a5fa] text-sm">Loading...</div>
                    )}
                  </div>

                  {itemsError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                      <p className="text-red-300 text-sm">{itemsError}</p>
                    </div>
                  )}

                  {isLoadingItems ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60a5fa] mx-auto"></div>
                      <p className="text-[#a0a0a0] mt-2">
                        Loading menu items...
                      </p>
                    </div>
                  ) : adminItems.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {adminItems.map((item) => (
                        <div
                          key={item._id}
                          className="bg-[#1a1a1a] p-4 rounded-lg"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <img
                              src={
                                item.pictureURL ||
                                "https://img.freepik.com/premium-psd/beautiful-food-menu-design-template_1150977-218.jpg?w=360"
                              }
                              alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="text-[#f5f5f5] font-semibold">
                                  {item.name}
                                </h4>
                                <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">
                                  Available
                                </span>
                              </div>
                              <p className="text-[#a0a0a0] text-sm">
                                Category: {item.categoryId?.name || "N/A"}
                              </p>
                            </div>
                          </div>
                          <p className="text-[#60a5fa] font-bold mb-3">
                            Rs{item.price}
                          </p>

                          {/* Display Options */}
                          {item.options && item.options.length > 0 && (
                            <div className="mb-3 p-2 bg-[#262626] rounded border border-[#404040]">
                              <h5 className="text-[#f5f5f5] text-xs font-medium mb-2">
                                Options ({item.options.length})
                              </h5>
                              <div className="space-y-1">
                                {item.options.map((option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className="flex justify-between items-center text-xs"
                                  >
                                    <span className="text-[#a0a0a0]">
                                      {option.name}
                                    </span>
                                    {option.option === true ? (
                                      <span className="ml-2 px-1 bg-green-900 text-green-300 text-xs rounded">
                                        Option
                                      </span>
                                    ) : (
                                      <span className="ml-2 px-1 bg-blue-900 text-blue-300 text-xs rounded">
                                        Addon
                                      </span>
                                    )}
                                    <span className="text-[#10b981] font-medium">
                                      +Rs{option.price}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItemClick(item)}
                              className="flex-1 py-2 bg-[#404040] hover:bg-[#505050] rounded text-[#f5f5f5] text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteItemClick(item)}
                              className="flex-1 py-2 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-sm transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[#a0a0a0]">
                        No menu items found for this admin
                      </p>
                      <button
                        onClick={() => setIsCreateItemModalOpen(true)}
                        className="mt-4 px-4 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg"
                      >
                        Create First Item
                      </button>
                    </div>
                  )}
                </div>
              )}

              {adminDetailView === "Menu" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#f5f5f5]">
                      Restaurant Menu
                    </h3>
                    {isLoadingMenu && (
                      <div className="text-[#60a5fa] text-sm">
                        Loading menu...
                      </div>
                    )}
                  </div>

                  {menuError && (
                    <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
                      <p className="text-red-300 text-sm">{menuError}</p>
                    </div>
                  )}

                  {isLoadingMenu ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60a5fa] mx-auto"></div>
                      <p className="text-[#a0a0a0] mt-2">Loading menu...</p>
                    </div>
                  ) : adminMenu ? (
                    <div className="space-y-6">
                      {/* Multiple Menus Display */}
                      {Array.isArray(adminMenu) ? (
                        adminMenu.map((menu, menuIndex) => (
                          <div
                            key={menu._id}
                            className="bg-[#1a1a1a] p-6 rounded-lg border border-[#404040]"
                          >
                            {/* Menu Header */}
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 bg-[#404040] rounded-lg flex items-center justify-center overflow-hidden">
                                {menu.logo ? (
                                  <img
                                    src={menu.logo}
                                    alt={menu.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <MdRestaurantMenu className="text-[#60a5fa] text-2xl" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-[#f5f5f5] font-bold text-xl">
                                      {menu.name}
                                    </h4>
                                    <p className="text-[#a0a0a0] text-sm">
                                      Created:{" "}
                                      {new Date(
                                        menu.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                    <p className="text-[#60a5fa] text-sm">
                                      {menu.itemsID?.length || 0} items in this
                                      menu
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">
                                      Menu #{menuIndex + 1}
                                    </span>
                                    <button
                                      onClick={() => handleEditMenuClick(menu)}
                                      className="p-2 bg-[#404040] hover:bg-[#505050] rounded text-[#10b981] transition-colors"
                                      title="Edit Menu"
                                    >
                                      <FaEdit size={14} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteMenuClick(menu)
                                      }
                                      className="p-2 bg-[#404040] hover:bg-[#505050] rounded text-[#ef4444] transition-colors"
                                      title="Delete Menu"
                                    >
                                      <FaTrash size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Menu Items for this specific menu */}
                            <div>
                              <h6 className="text-[#f5f5f5] font-medium mb-3">
                                Items in "{menu.name}" (
                                {menu.itemsID?.length || 0})
                              </h6>

                              {menu.itemsID && menu.itemsID.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {menu.itemsID.map((item) => {
                                    // Find the processed item with category info
                                    const processedItem =
                                      menuItems.find(
                                        (mi) => mi._id === item._id
                                      ) || item;
                                    return (
                                      <div
                                        key={item._id}
                                        className="bg-[#262626] p-3 rounded-lg border border-[#505050]"
                                      >
                                        <div className="flex items-center gap-2 mb-2">
                                          <img
                                            src={
                                              item.pictureURL ||
                                              "https://img.freepik.com/premium-psd/beautiful-food-menu-design-template_1150977-218.jpg?w=360"
                                            }
                                            alt={item.name}
                                            className="w-10 h-10 rounded object-cover"
                                          />
                                          <div className="flex-1">
                                            <h6 className="text-[#f5f5f5] font-medium text-sm">
                                              {item.name}
                                            </h6>
                                            <p className="text-[#a0a0a0] text-xs">
                                              Category:{" "}
                                              {processedItem.categoryId?.name ||
                                                "N/A"}
                                            </p>
                                          </div>
                                          <span className="px-2 py-1 rounded text-xs bg-blue-900 text-blue-300">
                                            Rs{item.price}
                                          </span>
                                        </div>

                                        {/* Display Options */}
                                        {item.options &&
                                          item.options.length > 0 && (
                                            <div className="mt-2 p-2 bg-[#1a1a1a] rounded border border-[#404040]">
                                              <h6 className="text-[#f5f5f5] text-xs font-medium mb-1">
                                                Options ({item.options.length})
                                              </h6>
                                              <div className="space-y-1">
                                                {item.options.map(
                                                  (option, optionIndex) => (
                                                    <div
                                                      key={optionIndex}
                                                      className="flex justify-between items-center text-xs"
                                                    >
                                                      <span className="text-[#a0a0a0]">
                                                        {option.name}
                                                      </span>
                                                      <span className="text-[#10b981] font-medium">
                                                        +Rs{option.price}
                                                      </span>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-4 bg-[#262626] rounded-lg">
                                  <p className="text-[#a0a0a0] text-sm">
                                    No items in this menu
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        /* Single Menu Display (fallback) */
                        <div className="bg-[#1a1a1a] p-6 rounded-lg">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-[#404040] rounded-lg flex items-center justify-center overflow-hidden">
                              {adminMenu.logo ? (
                                <img
                                  src={adminMenu.logo}
                                  alt={adminMenu.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <MdRestaurantMenu className="text-[#60a5fa] text-2xl" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-[#f5f5f5] font-bold text-xl">
                                    {adminMenu.name}
                                  </h4>
                                  <p className="text-[#a0a0a0] text-sm">
                                    Created:{" "}
                                    {new Date(
                                      adminMenu.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                  <p className="text-[#60a5fa] text-sm">
                                    {menuItems.length} items in menu
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleEditMenuClick(adminMenu)
                                    }
                                    className="p-2 bg-[#404040] hover:bg-[#505050] rounded text-[#10b981] transition-colors"
                                    title="Edit Menu"
                                  >
                                    <FaEdit size={14} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteMenuClick(adminMenu)
                                    }
                                    className="p-2 bg-[#404040] hover:bg-[#505050] rounded text-[#ef4444] transition-colors"
                                    title="Delete Menu"
                                  >
                                    <FaTrash size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary Section */}
                      <div className="bg-[#1a1a1a] p-4 rounded-lg">
                        <h5 className="text-[#f5f5f5] font-semibold mb-3">
                          Summary - All Menu Items ({menuItems.length} total)
                        </h5>

                        {isLoadingMenuItems ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#60a5fa] mx-auto"></div>
                            <p className="text-[#a0a0a0] mt-2 text-sm">
                              Loading menu items...
                            </p>
                          </div>
                        ) : menuItems.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {menuItems.map((item) => (
                              <div
                                key={item._id}
                                className="bg-[#262626] p-4 rounded-lg border border-[#505050]"
                              >
                                <div className="flex items-center gap-3 mb-3">
                                  <img
                                    src={
                                      item.pictureURL ||
                                      "https://img.freepik.com/premium-psd/beautiful-food-menu-design-template_1150977-218.jpg?w=360"
                                    }
                                    alt={item.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                      <h6 className="text-[#f5f5f5] font-semibold">
                                        {item.name}
                                      </h6>
                                      <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">
                                        In Menu
                                      </span>
                                    </div>
                                    <p className="text-[#a0a0a0] text-sm">
                                      Category: {item.categoryId?.name || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-[#60a5fa] font-bold mb-2">
                                  Rs{item.price}
                                </p>

                                {/* Display Options */}
                                {item.options && item.options.length > 0 && (
                                  <div className="mb-2 p-2 bg-[#1a1a1a] rounded border border-[#404040]">
                                    <h6 className="text-[#f5f5f5] text-xs font-medium mb-1">
                                      Options ({item.options.length})
                                    </h6>
                                    <div className="space-y-1">
                                      {item.options.map(
                                        (option, optionIndex) => (
                                          <div
                                            key={optionIndex}
                                            className="flex justify-between items-center text-xs"
                                          >
                                            <span className="text-[#a0a0a0]">
                                              {option.name}
                                            </span>
                                            <span className="text-[#10b981] font-medium">
                                              +Rs{option.price}
                                            </span>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}

                                {item.description && (
                                  <p className="text-[#a0a0a0] text-sm mb-3 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 bg-[#262626] rounded-lg">
                            <MdRestaurantMenu className="text-[#404040] text-2xl mx-auto mb-2" />
                            <p className="text-[#a0a0a0] text-sm">
                              No items found across all menus
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#1a1a1a] rounded-lg">
                      <MdRestaurantMenu className="text-[#404040] text-4xl mx-auto mb-3" />
                      <p className="text-[#a0a0a0] mb-4">
                        No menu created for this admin yet
                      </p>
                      <button
                        onClick={() => setIsCreateMenuModalOpen(true)}
                        className="px-6 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg"
                      >
                        Create Menu
                      </button>
                    </div>
                  )}
                </div>
              )}

              {adminDetailView === "Vouchers" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#f5f5f5]">
                      Voucher Management
                    </h3>
                    <button
                      onClick={handleCreateVoucher}
                      className="px-4 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg font-medium"
                    >
                      + Create Voucher
                    </button>
                  </div>

                  {vouchersError && (
                    <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
                      <p className="text-red-100 text-sm">{vouchersError}</p>
                    </div>
                  )}

                  {isLoadingVouchers ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60a5fa]"></div>
                    </div>
                  ) : allVouchers.length > 0 ? (
                    <div className="grid gap-4">
                      {allVouchers.map((voucher) => (
                        <div
                          key={voucher._id}
                          className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-[#f5f5f5] font-medium">
                                  Voucher Code: #{voucher.code}
                                </h4>
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                                  Rs{voucher.voucherPrice}
                                </span>
                              </div>
                              <p className="text-[#a0a0a0] text-sm mb-2">
                                Menu: {voucher.menuId?.name || "Unknown Menu"}
                              </p>
                              <p className="text-[#606060] text-xs">
                                Created:{" "}
                                {new Date(
                                  voucher.createdAt
                                ).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditVoucher(voucher)}
                                className="p-2 text-[#60a5fa] hover:bg-[#262626] rounded"
                                title="Edit Voucher"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteVoucherClick(voucher)
                                }
                                className="p-2 text-red-500 hover:bg-[#262626] rounded"
                                title="Delete Voucher"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#1a1a1a] rounded-lg">
                      <div className="text-[#404040] text-4xl mx-auto mb-3">
                        🎟️
                      </div>
                      <p className="text-[#a0a0a0] mb-4">
                        No vouchers created yet
                      </p>
                      <button
                        onClick={handleCreateVoucher}
                        className="px-6 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg"
                      >
                        Create First Voucher
                      </button>
                    </div>
                  )}
                </div>
              )}

              {adminDetailView === "Deals" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-[#f5f5f5]">
                      Deal Management
                    </h3>
                    <button
                      onClick={handleCreateDeal}
                      className="px-4 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg font-medium"
                    >
                      + Create Deal
                    </button>
                  </div>

                  {dealsError && (
                    <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
                      <p className="text-red-100 text-sm">{dealsError}</p>
                    </div>
                  )}

                  {isLoadingDeals ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#60a5fa]"></div>
                    </div>
                  ) : allDeals.length > 0 ? (
                    <div className="grid gap-4">
                      {allDeals.map((deal) => (
                        <div
                          key={deal._id}
                          className="bg-[#1a1a1a] p-4 rounded-lg border border-[#404040]"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-[#f5f5f5] font-medium">
                                  {deal.name}
                                </h4>
                                <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                                  Rs{deal.dealPrice}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    deal.isActive
                                      ? "bg-green-900 text-green-300"
                                      : "bg-red-900 text-red-300"
                                  }`}
                                >
                                  {deal.isActive ? "Active" : "Inactive"}
                                </span>
                                {deal.savings > 0 && (
                                  <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
                                    Save Rs{deal.savings}
                                  </span>
                                )}
                              </div>
                              {deal.description && (
                                <p className="text-[#a0a0a0] text-sm mb-2">
                                  {deal.description}
                                </p>
                              )}
                              <div className="text-[#a0a0a0] text-sm mb-2">
                                Items: {deal.items?.length || 0} items included
                              </div>
                              <div className="flex gap-4 text-xs text-[#606060]">
                                <span>Original: Rs{deal.originalPrice}</span>
                                <span>
                                  Created:{" "}
                                  {new Date(
                                    deal.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {deal.validUntil && (
                                  <span>
                                    Expires:{" "}
                                    {new Date(
                                      deal.validUntil
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditDeal(deal)}
                                className="p-2 text-[#60a5fa] hover:bg-[#262626] rounded"
                                title="Edit Deal"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteDeal(deal)}
                                className="p-2 text-red-500 hover:bg-[#262626] rounded"
                                title="Delete Deal"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </div>

                          {/* Deal Items Display */}
                          {deal.items && deal.items.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-[#404040]">
                              <h5 className="text-[#f5f5f5] text-sm font-medium mb-2">
                                Included Items:
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {deal.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="text-xs text-[#a0a0a0] bg-[#262626] p-2 rounded"
                                  >
                                    {item.itemId?.name || "Unknown Item"} ×{" "}
                                    {item.quantity}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* New Section for Customizations */}
                          {deal.customizations &&
                            deal.customizations.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-[#404040]">
                                <h5 className="text-[#f5f5f5] text-sm font-medium mb-2">
                                  Customizations:
                                </h5>
                                <div className="space-y-2">
                                  {deal.customizations.map(
                                    (customization, custIndex) => (
                                      <div
                                        key={custIndex}
                                        className="bg-[#262626] p-3 rounded"
                                      >
                                        <p className="text-[#f5f5f5] text-sm font-semibold">
                                          {customization.name}
                                          <span className="ml-2 text-xs text-[#a0a0a0]">
                                            ({customization.minSelect}-
                                            {customization.maxSelect}{" "}
                                            selections)
                                          </span>
                                        </p>
                                        {customization.options &&
                                          customization.options.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                              {customization.options.map(
                                                (option, optIndex) => (
                                                  <span
                                                    key={optIndex}
                                                    className="px-2 py-1 text-xs text-white bg-[#404040] rounded-full flex items-center gap-1"
                                                  >
                                                    {option.name}
                                                    {option.price > 0 && (
                                                      <span className="text-green-300">
                                                        +Rs{option.price}
                                                      </span>
                                                    )}
                                                  </span>
                                                )
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-[#1a1a1a] rounded-lg">
                      <div className="text-[#404040] text-4xl mx-auto mb-3">
                        🎯
                      </div>
                      <p className="text-[#a0a0a0] mb-4">
                        No deals created yet
                      </p>
                      <button
                        onClick={handleCreateDeal}
                        className="px-6 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-lg"
                      >
                        Create First Deal
                      </button>
                    </div>
                  )}
                </div>
              )}

              {adminDetailView === "Settings" && (
                <div>
                  <h3 className="text-lg font-bold text-[#f5f5f5] mb-4">
                    Admin Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-[#f5f5f5] font-medium">
                          Account Status
                        </h4>
                        <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                          Active
                        </span>
                      </div>
                      <p className="text-[#a0a0a0] text-sm mb-2">
                        Admin account is active and operational
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button className="px-4 py-2 bg-[#404040] hover:bg-[#505050] rounded text-[#f5f5f5] text-sm">
                          Edit Profile
                        </button>
                        <button className="px-4 py-2 bg-[#ef4444] hover:bg-[#dc2626] rounded text-white text-sm">
                          Suspend Account
                        </button>
                      </div>
                    </div>
                    <div className="bg-[#1a1a1a] p-4 rounded-lg">
                      <h4 className="text-[#f5f5f5] font-medium mb-2">
                        Quick Actions
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <button
                          onClick={() => setIsCreateCategoryModalOpen(true)}
                          className="p-3 bg-[#262626] hover:bg-[#404040] rounded text-center"
                        >
                          <FaUserPlus className="text-[#60a5fa] mx-auto mb-1" />
                          <p className="text-[#f5f5f5] text-sm">Add Category</p>
                        </button>
                        <button
                          onClick={() => setIsCreateItemModalOpen(true)}
                          className="p-3 bg-[#262626] hover:bg-[#404040] rounded text-center"
                        >
                          <FaUtensils className="text-[#10b981] mx-auto mb-1" />
                          <p className="text-[#f5f5f5] text-sm">Add Item</p>
                        </button>
                        <button
                          onClick={() => setIsCreateMenuModalOpen(true)}
                          className="p-3 bg-[#262626] hover:bg-[#404040] rounded text-center"
                        >
                          <MdRestaurantMenu className="text-[#f59e0b] mx-auto mb-1" />
                          <p className="text-[#f5f5f5] text-sm">Create Menu</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="container mx-auto px-6 md:px-4">
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#f5f5f5]">
              All Admins ({allAdmins.length})
            </h3>
            <div className="flex items-center gap-3">
              {isLoadingAdmins && (
                <div className="text-[#60a5fa] text-sm">Loading...</div>
              )}
              <button
                onClick={fetchAllAdmins}
                disabled={isLoadingAdmins}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isLoadingAdmins
                    ? "bg-[#404040] text-[#606060] cursor-not-allowed"
                    : "bg-[#60a5fa] hover:bg-[#3b82f6] text-white"
                }`}
              >
                {isLoadingAdmins ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {adminsError && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-300 text-sm">{adminsError}</p>
            </div>
          )}

          {isLoadingAdmins ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#60a5fa] mx-auto"></div>
              <p className="text-[#a0a0a0] mt-4">Loading administrators...</p>
            </div>
          ) : allAdmins.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allAdmins.map((admin) => (
                <div
                  key={admin._id}
                  className="bg-[#262626] p-6 rounded-lg cursor-pointer hover:bg-[#404040] transition-colors border border-[#404040] hover:border-[#60a5fa]"
                  onClick={() => {
                    setSelectedAdmin(admin);
                    // Pre-fetch data for the selected admin
                    fetchCategoriesForAdmin(admin._id);
                    fetchItemsForAdmin(admin._id);
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-[#f5f5f5] font-bold text-lg">
                        {admin.name}
                      </h4>
                      <p className="text-[#a0a0a0] text-sm">{admin.email}</p>
                      <p className="text-[#60a5fa] text-sm">
                        {admin.role || "Admin"}
                      </p>
                    </div>
                    <span className="px-2 py-1 rounded text-xs bg-green-900 text-green-300">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-[#a0a0a0] text-sm">Phone:</span>
                      <span className="text-[#f5f5f5] text-sm">
                        {admin.phone || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#a0a0a0] text-sm">Admin ID:</span>
                      <span className="text-[#f5f5f5] text-sm text-xs">
                        {admin._id?.slice(-8) || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#a0a0a0] text-sm">Joined:</span>
                      <span className="text-[#60a5fa] text-sm font-medium">
                        {admin.createdAt
                          ? new Date(admin.createdAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <button className="w-full py-2 bg-[#60a5fa] hover:bg-[#3b82f6] rounded text-white text-sm font-medium">
                      View Details
                    </button>
                  </div>

                  <p className="text-[#606060] text-xs mt-3 text-center">
                    Click to view categories and menu items
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FaUsers className="text-[#404040] text-6xl mx-auto mb-4" />
              <p className="text-[#a0a0a0] text-lg">No administrators found</p>
              <p className="text-[#606060] text-sm mt-2">
                Create your first admin user in the Setup Wizard
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#f5f5f5] flex items-center gap-3">
                <FaUserPlus className="text-[#60a5fa]" />
                Super Admin Dashboard
              </h1>
              <p className="text-[#a0a0a0] mt-2">
                Manage your restaurant network and administrators
              </p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogoutClick}
              className="flex items-center gap-2 px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-lg font-medium transition-colors duration-200"
            >
              <FaSignOutAlt className="text-sm" />
              Logout
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#1a1a1a] rounded-lg mb-6">
          <div className="border-b border-[#404040]">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedAdmin(null);
                    setAdminDetailView("Analytics");
                    // Fetch fresh data when switching to All Admins
                    if (tab === "All Admins") {
                      fetchAllAdmins();
                    }
                  }}
                  className={`py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? "border-[#60a5fa] text-[#60a5fa]"
                      : "border-transparent text-[#a0a0a0] hover:text-[#f5f5f5] hover:border-[#606060]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "Setup Wizard" && <SetupWizardTab />}
        {activeTab === "All Admins" && <AllAdminsTab />}

        {/* Modals */}
        {showLogoutModal && <LogoutModal />}
        {showDeleteCategoryModal && <DeleteCategoryModal />}
        {showDeleteItemModal && <DeleteItemModal />}
        {showDeleteMenuModal && <DeleteMenuModal />}
        {editingItem && <EditItemModal />}

        <CreateUserModal
          isOpen={isCreateUserModalOpen}
          onClose={handleCloseUserModal}
          onSuccess={handleStepCompletion}
          allAdmins={allAdmins}
          createdUser={createdUser}
        />

        <CreateCategoryModal
          isOpen={isCreateCategoryModalOpen}
          onClose={handleCloseCategoryModal}
          onSuccess={handleStepCompletion}
          allAdmins={allAdmins}
          createdUser={createdUser}
          createdCategories={createdCategories}
          isLoadingAdmins={isLoadingAdmins}
          selectedAdmin={selectedAdmin}
          onCategoryCreated={fetchCategoriesForAdmin}
          isSetupWizard={activeTab === "Setup Wizard"}
          isSettings={
            selectedAdmin &&
            (adminDetailView === "Settings" || adminDetailView === "Categories")
          }
        />

        <CreateItemModal
          isOpen={isCreateItemModalOpen}
          onClose={handleCloseItemModal}
          onSuccess={handleStepCompletion}
          allAdmins={allAdmins}
          createdUser={createdUser}
          isLoadingAdmins={isLoadingAdmins}
          selectedAdmin={selectedAdmin}
          onItemCreated={fetchItemsForAdmin}
          isSetupWizard={activeTab === "Setup Wizard"}
          isSettings={
            selectedAdmin &&
            (adminDetailView === "Settings" || adminDetailView === "Items")
          }
          adminCategories={adminCategories}
          isLoadingCategories={isLoadingCategories}
        />

        <CreateMenuModal
          isOpen={isCreateMenuModalOpen}
          onClose={handleCloseMenuModal}
          onSuccess={handleStepCompletion}
          onMenuCreated={fetchMenuForAdmin}
          allAdmins={allAdmins}
          createdUser={createdUser}
          isLoadingAdmins={isLoadingAdmins}
          selectedAdmin={selectedAdmin}
          isSetupWizard={activeTab === "Setup Wizard"}
          isSettings={
            selectedAdmin &&
            (adminDetailView === "Settings" || adminDetailView === "Menu")
          }
        />

        {/* Edit Modals */}
        {editingCategory && (
          <EditCategoryModal
            isOpen={true}
            categoryData={editingCategory}
            onSubmit={handleUpdateCategory}
            onCancel={() => setEditingCategory(null)}
            isLoading={isUpdatingCategory}
          />
        )}

        {editingItem && (
          <EditItemModal
            isOpen={true}
            itemData={editingItem}
            onSubmit={handleUpdateItem}
            onCancel={() => setEditingItem(null)}
            isLoading={isUpdatingItem}
            categories={adminCategories}
          />
        )}

        {editingMenu && (
          <EditMenuModal
            menuData={editingMenu}
            onSubmit={handleUpdateMenu}
            onCancel={handleCancelMenuEdit}
            isLoading={isUpdatingMenu}
            onAddItem={handleAddItemFromMenuEdit}
            availableItems={adminItems}
            newlyAddedItemId={newlyAddedItemId}
            enableImmediateRemoval={true}
            onItemRemoved={handleItemRemovedFromMenu}
          />
        )}

        {/* Add Item Modal when called from Menu Edit */}
        {showAddItemInMenuEdit && selectedAdmin && (
          <CreateItemModal
            isOpen={showAddItemInMenuEdit}
            userId={selectedAdmin._id}
            categories={adminCategories}
            onSuccess={handleItemAddedDuringMenuEdit}
            onClose={handleCloseAddItemFromMenuEdit}
            allAdmins={allAdmins}
            selectedAdmin={selectedAdmin}
            isSettings={true}
            adminCategories={adminCategories}
            isLoadingCategories={isLoadingCategories}
          />
        )}

        {/* Create Voucher Modal */}
        {isCreateVoucherModalOpen && (
          <CreateVoucherModal
            isOpen={isCreateVoucherModalOpen}
            onClose={() => setIsCreateVoucherModalOpen(false)}
            onSuccess={handleVoucherCreated}
            allAdmins={allAdmins}
            selectedAdmin={selectedAdmin}
            isLoadingAdmins={isLoadingAdmins}
          />
        )}

        {/* Edit Voucher Modal */}
        {editingVoucher && (
          <EditVoucherModal
            isOpen={!!editingVoucher}
            onClose={() => setEditingVoucher(null)}
            onSuccess={handleVoucherUpdated}
            voucherData={editingVoucher}
            selectedAdmin={selectedAdmin}
          />
        )}

        {/* Delete Voucher Confirmation Modal */}
        {showDeleteVoucherModal && voucherToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <FaExclamationTriangle className="text-red-500 text-xl" />
                <h3 className="text-lg font-bold text-[#f5f5f5]">
                  Delete Voucher
                </h3>
              </div>
              <p className="text-[#a0a0a0] mb-6">
                Are you sure you want to delete voucher code #
                {voucherToDelete.code}? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDeleteVoucher}
                  disabled={isDeletingVoucher}
                  className="px-4 py-2 bg-[#404040] hover:bg-[#505050] text-[#f5f5f5] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVoucher}
                  disabled={isDeletingVoucher}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                >
                  {isDeletingVoucher ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Deal Modal */}
        {isCreateDealModalOpen && (
          <CreateDealModal
            isOpen={isCreateDealModalOpen}
            onClose={() => setIsCreateDealModalOpen(false)}
            onDealCreated={handleDealCreated}
            preSelectedAdmin={selectedAdmin}
          />
        )}

        {/* Edit Deal Modal */}
        {editingDeal && (
          <EditDealModal
            isOpen={!!editingDeal}
            onClose={() => setEditingDeal(null)}
            onDealUpdated={handleDealUpdated}
            deal={editingDeal}
          />
        )}

        {/* Delete Deal Confirmation Modal */}
        {showDeleteDealModal && dealToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] p-6 rounded-lg max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <FaExclamationTriangle className="text-red-500 text-xl" />
                <h3 className="text-lg font-bold text-[#f5f5f5]">
                  Delete Deal
                </h3>
              </div>
              <p className="text-[#a0a0a0] mb-6">
                Are you sure you want to delete the deal "{dealToDelete.name}"?
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCancelDeleteDeal}
                  disabled={isDeletingDeal}
                  className="px-4 py-2 bg-[#404040] hover:bg-[#505050] text-[#f5f5f5] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDeal}
                  disabled={isDeletingDeal}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2"
                >
                  {isDeletingDeal ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrderForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-[#60a5fa] text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Order Details</h2>
                    <p className="text-blue-100 text-sm">
                      Order #
                      {selectedOrderForDetails._id?.slice(-8).toUpperCase() ||
                        "N/A"}{" "}
                      - {selectedOrderForDetails.orderType || "DINE"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Export Button */}
                    <button
                      onClick={() =>
                        handleExportSingleOrder(selectedOrderForDetails)
                      }
                      disabled={isExportingSingleOrder}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {isExportingSingleOrder ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-4 h-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                            />
                          </svg>
                          Export Excel
                        </>
                      )}
                    </button>

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedOrderForDetails(null)}
                      className="text-white hover:text-gray-200 text-2xl transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {(() => {
                  const order = selectedOrderForDetails;

                  // Calculate order totals like in PrintReceiptsModal
                  let totalOriginalAmount = 0;
                  let totalItemDiscount = 0;
                  let totalTaxAmount = 0;
                  let totalFinalAmount = 0;

                  const processedItems =
                    order.items?.map((item) => {
                      const basePrice =
                        item.basePrice || item.originalPrice || item.price || 0;
                      const options = item.options || [];
                      const optionsPrice = options.reduce(
                        (sum, opt) => sum + (opt.price || 0),
                        0
                      );
                      const discount = item.discount || item.itemDiscount || 0;
                      const quantity = item.quantity || 1;

                      // Determine tax rate based on payment method
                      const paymentMethod =
                        order.paymentMethod || order.paymentType || "CASH";
                      const taxRates = item.tax || { card: "0", cash: "0" };
                      const taxRate =
                        paymentMethod === "CARD"
                          ? parseFloat(taxRates.card || "0")
                          : parseFloat(taxRates.cash || "0");

                      // Calculate original amount before discounts
                      const originalAmount = basePrice + optionsPrice;

                      // Calculate tax on original amount
                      const taxAmount = (originalAmount * taxRate) / 100;

                      // Final calculation: basePrice + options - discount + tax
                      const finalPrice = originalAmount - discount + taxAmount;

                      totalOriginalAmount += originalAmount * quantity;
                      totalItemDiscount += discount * quantity;
                      totalTaxAmount += taxAmount * quantity;
                      totalFinalAmount += finalPrice * quantity;

                      return {
                        ...item,
                        basePrice,
                        optionsPrice,
                        originalAmount,
                        taxAmount,
                        finalPrice,
                        taxRate,
                      };
                    }) || [];

                  const voucherDiscount = order.voucherDiscount || 0;
                  const finalOrderTotal = totalFinalAmount - voucherDiscount;
                  const subtotal = totalOriginalAmount - totalItemDiscount;

                  return (
                    <div className="space-y-6">
                      {/* Order Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#262626] p-4 rounded-lg">
                          <h3 className="text-[#f5f5f5] font-semibold mb-3">
                            Order Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">Order ID:</span>
                              <span className="text-[#f5f5f5]">
                                #{order._id?.slice(-8).toUpperCase() || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">
                                Order Type:
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  order.orderType === "DINE"
                                    ? "bg-blue-900 text-blue-300"
                                    : order.orderType === "DELIVERY"
                                    ? "bg-green-900 text-green-300"
                                    : order.orderType === "PICKUP"
                                    ? "bg-orange-900 text-orange-300"
                                    : "bg-gray-900 text-gray-300"
                                }`}
                              >
                                {order.orderType || "DINE"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">
                                Order Status:
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  order.orderStatus === "COMPLETED"
                                    ? "bg-green-900 text-green-300"
                                    : order.orderStatus === "IN_PROGRESS"
                                    ? "bg-yellow-900 text-yellow-300"
                                    : "bg-blue-900 text-blue-300"
                                }`}
                              >
                                {order.orderStatus || "COMPLETED"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">
                                Payment Status:
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  order.paymentStatus === "PAID"
                                    ? "bg-green-900 text-green-300"
                                    : "bg-red-900 text-red-300"
                                }`}
                              >
                                {order.paymentStatus || "UNPAID"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">
                                Payment Method:
                              </span>
                              <span className="text-[#f5f5f5]">
                                {order.paymentMethod ||
                                  order.paymentType ||
                                  "CASH"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">
                                Date & Time:
                              </span>
                              <span className="text-[#f5f5f5]">
                                {order.createdAt
                                  ? new Date(order.createdAt).toLocaleString()
                                  : new Date().toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#262626] p-4 rounded-lg">
                          <h3 className="text-[#f5f5f5] font-semibold mb-3">
                            Customer Information
                          </h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">
                                Customer Name:
                              </span>
                              <span className="text-[#f5f5f5]">
                                {order.customerInfo?.name || "Walk-in Customer"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">Phone:</span>
                              <span className="text-[#f5f5f5]">
                                {order.customerInfo?.phone || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">Address:</span>
                              <span className="text-[#f5f5f5] text-right max-w-[200px] break-words">
                                {order.customerInfo?.address || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#a0a0a0]">Table:</span>
                              <span className="text-[#f5f5f5]">
                                {order.customerInfo?.table ||
                                  order.tableNo ||
                                  "N/A"}
                              </span>
                            </div>
                            {order.voucherCode && (
                              <div className="flex justify-between">
                                <span className="text-[#a0a0a0]">
                                  Voucher Code:
                                </span>
                                <span className="text-[#10b981]">
                                  {order.voucherCode}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-[#262626] p-4 rounded-lg">
                        <h3 className="text-[#f5f5f5] font-semibold mb-4">
                          Order Items ({processedItems.length})
                        </h3>
                        <div className="space-y-4">
                          {processedItems.map((item, index) => (
                            <div
                              key={index}
                              className="border-b border-[#404040] pb-4 last:border-b-0"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <h4 className="text-[#f5f5f5] font-medium">
                                    {item.name}
                                  </h4>
                                  {item.menuName &&
                                    item.menuName !== "General Items" && (
                                      <p className="text-[#a0a0a0] text-sm">
                                        {item.menuName}
                                      </p>
                                    )}
                                </div>
                                <div className="text-right">
                                  <div className="text-[#f5f5f5] font-semibold">
                                    x{item.quantity}
                                  </div>
                                  <div className="text-[#10b981] font-bold">
                                    Rs
                                    {(item.finalPrice * item.quantity).toFixed(
                                      2
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                <div>
                                  <span className="text-[#a0a0a0]">
                                    Base Price:
                                  </span>
                                  <div className="text-[#f5f5f5]">
                                    Rs{item.basePrice.toFixed(2)}
                                  </div>
                                </div>
                                {item.optionsPrice > 0 && (
                                  <div>
                                    <span className="text-[#a0a0a0]">
                                      Options:
                                    </span>
                                    <div className="text-[#f5f5f5]">
                                      Rs{item.optionsPrice.toFixed(2)}
                                    </div>
                                  </div>
                                )}
                                {item.itemDiscount > 0 && (
                                  <div>
                                    <span className="text-[#a0a0a0]">
                                      Discount:
                                    </span>
                                    <div className="text-[#10b981]">
                                      -Rs{item.itemDiscount.toFixed(2)}
                                    </div>
                                  </div>
                                )}
                                <div>
                                  <span className="text-[#a0a0a0]">
                                    Tax ({item.taxRate}%):
                                  </span>
                                  <div className="text-[#f59e0b]">
                                    Rs{item.taxAmount.toFixed(2)}
                                  </div>
                                </div>
                              </div>

                              {item.options && item.options.length > 0 && (
                                <div className="mt-2">
                                  <span className="text-[#a0a0a0] text-xs">
                                    Options:{" "}
                                  </span>
                                  <span className="text-[#f5f5f5] text-xs">
                                    {item.options
                                      .map((opt) =>
                                        typeof opt === "string"
                                          ? opt
                                          : `${opt.name} (+Rs${opt.price || 0})`
                                      )
                                      .join(", ")}
                                  </span>
                                </div>
                              )}

                              {item.notes && (
                                <div className="mt-2">
                                  <span className="text-[#a0a0a0] text-xs">
                                    Notes:{" "}
                                  </span>
                                  <span className="text-[#f5f5f5] text-xs">
                                    {item.notes}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-[#262626] p-4 rounded-lg">
                        <h3 className="text-[#f5f5f5] font-semibold mb-4">
                          Order Summary
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-[#a0a0a0]">
                              Original Total:
                            </span>
                            <span className="text-[#f5f5f5]">
                              Rs{totalOriginalAmount.toFixed(2)}
                            </span>
                          </div>
                          {totalItemDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#a0a0a0]">
                                Item Discounts:
                              </span>
                              <span className="text-[#10b981]">
                                -Rs{totalItemDiscount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-[#a0a0a0]">Subtotal:</span>
                            <span className="text-[#f5f5f5]">
                              Rs{subtotal.toFixed(2)}
                            </span>
                          </div>
                          {voucherDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#a0a0a0]">
                                Voucher Discount:
                              </span>
                              <span className="text-[#10b981]">
                                -Rs{voucherDiscount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {totalTaxAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#a0a0a0]">
                                Tax (
                                {order.paymentMethod ||
                                  order.paymentType ||
                                  "CASH"}
                                ):
                              </span>
                              <span className="text-[#f59e0b]">
                                +Rs{totalTaxAmount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="border-t border-[#404040] pt-2 mt-2">
                            <div className="flex justify-between font-bold text-lg">
                              <span className="text-[#f5f5f5]">
                                FINAL TOTAL:
                              </span>
                              <span className="text-[#10b981]">
                                Rs{finalOrderTotal.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          {totalItemDiscount + voucherDiscount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-[#a0a0a0]">
                                Total Savings:
                              </span>
                              <span className="text-[#10b981] font-semibold">
                                Rs
                                {(totalItemDiscount + voucherDiscount).toFixed(
                                  2
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Footer */}
              <div className="bg-[#262626] p-4 border-t border-[#404040]">
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedOrderForDetails(null)}
                    className="px-6 py-2 bg-[#60a5fa] text-white rounded hover:bg-[#3b82f6] transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdmin;

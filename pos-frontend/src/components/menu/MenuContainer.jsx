import React, { useState, useEffect } from "react";
import { menus } from "../../constants";
import { GrRadialSelected } from "react-icons/gr";
import { FaShoppingCart } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addItems } from "../../redux/slices/cartSlice";
import { getCategories, getItemsByCategory, getMenus } from "../../https";
import ItemOptionsModal from "./ItemOptionsModal";

const MenuContainer = () => {
  const [categoriesData, setCategoriesData] = useState([]);
  const [menusData, setMenusData] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [menusLoading, setMenusLoading] = useState(false);
  const [itemCount, setItemCount] = useState({});
  const [viewMode, setViewMode] = useState('categories'); // 'categories', 'categoryItems', 'menus', 'menuItems'
  const [menuItemsData, setMenuItemsData] = useState({}); // Store items for each menu
  const [menuItemsLoading, setMenuItemsLoading] = useState({}); // Track loading for each menu
  const dispatch = useDispatch();
  
  // Options modal state
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [selectedItemQuantity, setSelectedItemQuantity] = useState(1);

  // Generate consistent, user-friendly colors for categories and menus
  const getConsistentColor = (identifier) => {
    const colorPalette = [
      { bg: "#4F46E5", text: "#E0E7FF" }, // Indigo
      { bg: "#059669", text: "#D1FAE5" }, // Emerald
      { bg: "#DC2626", text: "#FEE2E2" }, // Red
      { bg: "#7C3AED", text: "#EDE9FE" }, // Violet
      { bg: "#EA580C", text: "#FED7AA" }, // Orange
      { bg: "#0891B2", text: "#CFFAFE" }, // Cyan
      { bg: "#BE185D", text: "#FCE7F3" }, // Pink
      { bg: "#65A30D", text: "#ECFCCB" }, // Lime
      { bg: "#7C2D12", text: "#FEF3C7" }, // Amber
      { bg: "#1E40AF", text: "#DBEAFE" }, // Blue
      { bg: "#166534", text: "#DCFCE7" }, // Green
      { bg: "#B91C1C", text: "#FEE2E2" }, // Rose
      { bg: "#6366F1", text: "#E0E7FF" }, // Indigo-400
      { bg: "#10B981", text: "#D1FAE5" }, // Emerald-500
      { bg: "#F59E0B", text: "#FEF3C7" }, // Yellow
      { bg: "#8B5CF6", text: "#EDE9FE" }, // Purple
      { bg: "#EF4444", text: "#FEE2E2" }, // Red-500
      { bg: "#06B6D4", text: "#CFFAFE" }, // Cyan-500
      { bg: "#84CC16", text: "#ECFCCB" }, // Lime-500
      { bg: "#F97316", text: "#FED7AA" }  // Orange-500
    ];
    
    // Create a simple hash from the identifier
    let hash = 0;
    const str = identifier.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Use absolute value and modulo to get consistent index
    const colorIndex = Math.abs(hash) % colorPalette.length;
    return colorPalette[colorIndex];
  };

  // Fetch categories and menus on component mount
  useEffect(() => {
    fetchCategories();
    fetchMenus();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await getCategories();
      if (response.data.success) {
        const categoriesApiData = response.data.data;
        
        // Fetch item count for each category (with a small delay to avoid overwhelming the API)
        const categoriesWithItemCounts = await Promise.all(
          categoriesApiData.map(async (category, index) => {
            try {
              // Add a small delay between requests to avoid overwhelming the API
              if (index > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
              
              const itemsResponse = await getItemsByCategory(category._id);
              const itemCount = itemsResponse.data.success ? (itemsResponse.data.data || []).length : 0;
              
              const colors = getConsistentColor(category._id || category.name);
              return {
                ...category,
                bgColor: category.bgColor || colors.bg,
                textColor: category.textColor || colors.text,
                itemCount: itemCount
              };
            } catch (error) {
              console.error(`Error fetching items for category ${category.name}:`, error);
              const colors = getConsistentColor(category._id || category.name);
              return {
                ...category,
                bgColor: category.bgColor || colors.bg,
                textColor: category.textColor || colors.text,
                itemCount: 0
              };
            }
          })
        );
        
        setCategoriesData(categoriesWithItemCounts);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategoriesData([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchMenus = async () => {
    try {
      setMenusLoading(true);
      const response = await getMenus();
      if (response.data.success) {
        const menusApiData = response.data.data;
        
        // Assign consistent colors to menus that don't have bgColor
        const menusWithColors = menusApiData.map(menu => {
          const colors = getConsistentColor(menu._id || menu.name);
          return {
            ...menu,
            bgColor: menu.bgColor || colors.bg,
            textColor: menu.textColor || colors.text,
            itemCount: menu.itemsID ? menu.itemsID.length : 0
          };
        });
        
        setMenusData(menusWithColors);
        
        // Load items for all menus
        menusWithColors.forEach(menu => {
          loadMenuItems(menu);
        });
      }
    } catch (error) {
      console.error("Error fetching menus:", error);
      // Fallback to constants if API fails
      const menusWithColors = menus.map(menu => {
        const colors = getConsistentColor(menu.id || menu.name);
        return {
          ...menu,
          bgColor: menu.bgColor || colors.bg,
          textColor: menu.textColor || colors.text,
          itemCount: menu.items ? menu.items.length : 0
        };
      });
      setMenusData(menusWithColors);
      
      // Load items for all menus
      menusWithColors.forEach(menu => {
        loadMenuItems(menu);
      });
    } finally {
      setMenusLoading(false);
    }
  };

  const loadMenuItems = async (menu) => {
    const menuId = menu._id || menu.id;
    
    try {
      setMenuItemsLoading(prev => ({ ...prev, [menuId]: true }));
      
      let itemsToShow = [];
      if (menu.itemsID && menu.itemsID.length > 0) {
        itemsToShow = menu.itemsID;
      } else if (menu.items) {
        itemsToShow = menu.items;
      }
      
      setMenuItemsData(prev => ({
        ...prev,
        [menuId]: itemsToShow
      }));
    } catch (error) {
      console.error("Error loading menu items:", error);
      setMenuItemsData(prev => ({
        ...prev,
        [menuId]: []
      }));
    } finally {
      setMenuItemsLoading(prev => ({ ...prev, [menuId]: false }));
    }
  };

  const handleCategorySelect = async (category) => {
    console.log("Category selected:", category);
    try {
      setLoading(true);
      setSelectedCategory(category);
      setItemCount({});
      
      const response = await getItemsByCategory(category._id);
      console.log("Category items response:", response);
      
      if (response.data.success) {
        const itemsData = response.data.data || [];
        console.log("Items data:", itemsData);
        setItems(itemsData);
      } else {
        console.log("API returned success: false");
        setItems([]);
      }
      
      setViewMode('categoryItems');
    } catch (error) {
      console.error("Error fetching items for category:", error);
      setItems([]);
      setViewMode('categoryItems');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuSelect = (menu) => {
    console.log("Menu selected:", menu);
    setSelectedMenu(menu);
    setItemCount({});
    
    // If menu has itemsID (from API), show those items
    if (menu.itemsID && menu.itemsID.length > 0) {
      console.log("Using menu.itemsID:", menu.itemsID);
      setItems(menu.itemsID);
    } else if (menu.items) {
      // Fallback for constants data
      console.log("Using menu.items:", menu.items);
      setItems(menu.items);
    } else {
      console.log("No items found in menu");
      setItems([]);
    }
    
    setViewMode('menuItems');
  };

  const handleBackToMain = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSelectedMenu(null);
    setItems([]);
    setItemCount({});
  };

  const increment = (id) => {
    const currentCount = itemCount[id] || 0;
    if (currentCount >= 4) return;
    setItemCount(prev => ({
      ...prev,
      [id]: currentCount + 1
    }));
  };

  const decrement = (id) => {
    const currentCount = itemCount[id] || 0;
    if (currentCount <= 0) return;
    setItemCount(prev => ({
      ...prev,
      [id]: currentCount - 1
    }));
  };

  const handleAddToCart = async (item, quantity, itemKey) => {
    const itemId = item._id || item.id;
    const currentCount = quantity || itemCount[itemKey] || itemCount[itemId] || 0;
    
    if (currentCount === 0) return;

    // Check if item has options - if so, open options modal
    if (item.options && item.options.length > 0) {
      setSelectedItemForOptions(item);
      setSelectedItemQuantity(currentCount);
      setShowOptionsModal(true);
      return;
    }

    // If no options, proceed with normal add to cart
    addItemToCart(item, currentCount, itemKey);
  };

  const addItemToCart = async (item, quantity, itemKey) => {
    const itemId = item._id || item.id;
    const { name, price } = item;
    
    // Determine menu information for the item
    let menuId = null;
    let menuName = null;
    
    console.log('Adding to cart - viewMode:', viewMode);
    console.log('Adding to cart - selectedMenu:', selectedMenu);
    console.log('Adding to cart - selectedCategory:', selectedCategory);
    console.log('Adding to cart - item:', item);
    
    if (selectedMenu && viewMode === 'menuItems') {
      // Item from menu selection (individual menu view)
      menuId = selectedMenu._id;
      menuName = selectedMenu.name;
      console.log(`Using selected menu: ${menuName} (${menuId})`);
    } else if (selectedCategory && viewMode === 'categoryItems') {
      // Item from category selection - find which menu contains this item
      console.log('Looking for item in menus:', itemId, menusData);
      
      const menuContainingItem = menusData.find(menu => {
        console.log(`Checking menu ${menu.name}:`, menu.itemsID);
        return menu.itemsID && menu.itemsID.some(menuItem => {
          const menuItemId = menuItem._id || menuItem.id;
          console.log(`Comparing ${menuItemId} with ${itemId}`);
          return menuItemId === itemId;
        });
      });
      
      console.log('Found menu containing item:', menuContainingItem);
      
      if (menuContainingItem) {
        menuId = menuContainingItem._id;
        menuName = menuContainingItem.name;
        console.log(`Using found menu: ${menuName} (${menuId})`);
      } else {
        // Fallback - use a default menu name but keep the structure
        menuName = 'General Items';
        console.log('No menu found for item, using fallback');
      }
    } else if (viewMode === 'categories') {
      // Item from main grid view - need to find which menu contains this item
      console.log('Adding from main grid view, looking for menu containing item:', itemId);
      
      // Find the menu that contains this item by checking itemKey
      const menuIdFromKey = itemKey.split('-')[0]; // itemKey format: "menuId-itemId"
      const menuContainingItem = menusData.find(menu => 
        (menu._id || menu.id) === menuIdFromKey
      );
      
      console.log('Found menu from itemKey:', menuContainingItem);
      
      if (menuContainingItem) {
        menuId = menuContainingItem._id || menuContainingItem.id;
        menuName = menuContainingItem.name;
        console.log(`Using menu from grid: ${menuName} (${menuId})`);
      } else {
        // Alternative: search through all menus to find the item
        const foundMenu = menusData.find(menu => 
          menu.itemsID && menu.itemsID.some(menuItem => 
            (menuItem._id || menuItem.id) === itemId
          )
        );
        
        if (foundMenu) {
          menuId = foundMenu._id || foundMenu.id;
          menuName = foundMenu.name;
          console.log(`Using found menu: ${menuName} (${menuId})`);
        } else {
          menuName = 'General Items';
          console.log('No menu found for grid item, using fallback');
        }
      }
    } else {
      // Fallback case
      console.log('Warning: Unhandled view mode or state, using fallback');
      menuName = 'General Items';
    }
    
    console.log(`Final menu info - menuId: ${menuId}, menuName: ${menuName}`);
    
    // Calculate final price including options
    let finalPrice = price * quantity;
    let itemName = name;
    let selectedOptions = [];
    
    // If item has selected options (from modal), include them
    if (item.selectedOptions && item.selectedOptions.length > 0) {
      selectedOptions = item.selectedOptions;
      const optionsPrice = selectedOptions.reduce((total, option) => total + (option.price * quantity), 0);
      finalPrice = price * quantity + optionsPrice;
      
      // Add options to item name for display
      const optionNames = selectedOptions.map(opt => opt.name).join(', ');
      itemName = `${name} (${optionNames})`;
    }
    
    const newObj = {
      id: new Date(),
      itemId: itemId,
      name: itemName,
      originalName: name,
      pricePerQuantity: item.totalPrice ? item.totalPrice / quantity : price,
      quantity: quantity,
      price: item.totalPrice || finalPrice,
      menuId: menuId,
      categoryId: selectedCategory?._id || null,
      menuName: menuName,
      categoryName: selectedCategory?.name || null,
      selectedOptions: selectedOptions,
      basePrice: price
    };

    console.log('Adding item to cart:', newObj);
    dispatch(addItems(newObj));
    
    // Reset the count for this specific item after adding to cart
    if (itemKey) {
      setItemCount(prev => ({
        ...prev,
        [itemKey]: 0
      }));
    } else {
      setItemCount(prev => ({
        ...prev,
        [itemId]: 0
      }));
    }
  };

  // Handle add to cart from options modal
  const handleAddToCartFromModal = (itemWithOptions, quantity) => {
    const itemKey = itemWithOptions._id || itemWithOptions.id;
    addItemToCart(itemWithOptions, quantity, itemKey);
    
    // Reset the count for this specific item after adding to cart
    setItemCount(prev => ({
      ...prev,
      [itemKey]: 0
    }));
  };

  // Close options modal
  const handleCloseOptionsModal = () => {
    setShowOptionsModal(false);
    setSelectedItemForOptions(null);
    setSelectedItemQuantity(1);
  };

  return (
    <>
      {(loading || categoriesLoading || menusLoading) && (
        <div className="flex justify-center items-center p-8">
          <div className="text-[#f5f5f5] text-lg">Loading...</div>
        </div>
      )}
      
      {viewMode === 'categories' ? (
        // Main View - Categories and Menus
        <>
          {/* Categories Section */}
          <div className="px-4 sm:px-6 md:px-10 py-2">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-2">Categories</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 px-4 sm:px-6 md:px-10 py-4 w-full">
            {categoriesData.map((category) => {
              return (
                <div
                  key={category._id}
                  className="flex flex-col items-start justify-between p-3 md:p-4 rounded-lg h-[80px] sm:h-[90px] md:h-[100px] cursor-pointer transition-transform hover:scale-105"
                  style={{ backgroundColor: category.bgColor || "#2a2a2a" }}
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="flex items-center justify-between w-full">
                    <h1 
                      className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate pr-2"
                      style={{ color: category.textColor || "#f5f5f5" }}
                    >
                      <span className="hidden sm:inline">{category.name}</span>
                      <span className="sm:hidden">{category.name.length > 8 ? category.name.substring(0, 8) + '...' : category.name}</span>
                    </h1>
                  </div>
                  <p 
                    className="text-xs sm:text-sm font-semibold opacity-80"
                    style={{ color: category.textColor || "#ababab" }}
                  >
                    {category.itemCount || 0} Items
                  </p>
                </div>
              );
            })}
          </div>

          {/* Menus Section */}
          <div className="px-4 sm:px-6 md:px-10 py-2 mt-6">
            <h2 className="text-[#f5f5f5] text-lg font-semibold mb-2">Menus</h2>
          </div>
          <div className="px-4 sm:px-6 md:px-10 py-4 w-full space-y-8">
            {menusData.map((menu) => {
              const menuId = menu._id || menu.id;
              const menuItems = menuItemsData[menuId] || [];
              const isLoadingItems = menuItemsLoading[menuId];
              
              return (
                <div key={menuId} className="w-full">
                  {/* Menu Header */}
                  <div className="mb-4">
                    <div
                      className="flex flex-col items-start justify-between p-3 md:p-4 rounded-lg h-[80px] sm:h-[90px] md:h-[100px] transition-transform hover:scale-105"
                      style={{ backgroundColor: menu.bgColor || "#2a2a2a" }}
                    >
                      <div className="flex items-center justify-between w-full">
                        <h1 
                          className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate pr-2"
                          style={{ color: menu.textColor || "#f5f5f5" }}
                        >
                          {menu.icon && <span className="mr-1 text-sm sm:text-base">{menu.icon}</span>} 
                          <span className="hidden sm:inline">{menu.name}</span>
                          <span className="sm:hidden">{menu.name.length > 8 ? menu.name.substring(0, 8) + '...' : menu.name}</span>
                        </h1>
                      </div>
                      <p 
                        className="text-xs sm:text-sm font-semibold opacity-80"
                        style={{ color: menu.textColor || "#ababab" }}
                      >
                        {menu.itemCount || 0} Items
                      </p>
                    </div>
                  </div>

                  {/* Menu Items Grid */}
                  <div className="mb-8">
                    {isLoadingItems ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="text-[#f5f5f5] text-sm">Loading menu items...</div>
                      </div>
                    ) : menuItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                        {menuItems.map((item) => {
                          const itemKey = `${menuId}-${item._id || item.id}`;
                          const currentCount = itemCount[itemKey] || 0;
                          return (
                            <div
                              key={itemKey}
                              className="bg-[#1f1f1f] rounded-lg p-3 sm:p-4 border border-[#3a3a3a] hover:bg-[#2a2a2a] transition-colors min-h-[180px] sm:min-h-[200px] md:min-h-[220px]"
                            >
                              <div className="flex flex-col h-full">
                                {/* Item Image */}
                                {item.image && (
                                  <div className="w-full h-24 sm:h-28 md:h-32 mb-3 rounded-lg overflow-hidden bg-[#2a2a2a]">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {/* Item Details */}
                                <div className="flex-1 flex flex-col">
                                  <h3 className="text-[#f5f5f5] font-semibold text-sm md:text-base mb-1 truncate">
                                    {item.name}
                                  </h3>
                                  <p className="text-[#ababab] text-xs md:text-sm mb-2 flex-1 line-clamp-2">
                                    {item.description || "Delicious menu item"}
                                  </p>
                                  
                                  {/* Price and Controls */}
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[#f59e0b] font-bold text-sm md:text-base">
                                        Rs{item.price}
                                      </span>
                                    </div>
                                    
                                    {/* Add to Cart Controls */}
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-1 sm:gap-2">
                                        {currentCount > 0 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setItemCount(prev => ({
                                                ...prev,
                                                [itemKey]: Math.max(0, currentCount - 1)
                                              }));
                                            }}
                                            className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#dc2626] text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold hover:bg-[#b91c1c] transition-colors touch-manipulation"
                                          >
                                            -
                                          </button>
                                        )}
                                        
                                        {currentCount > 0 && (
                                          <span className="text-[#f5f5f5] font-semibold text-sm md:text-base min-w-[20px] text-center">
                                            {currentCount}
                                          </span>
                                        )}
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setItemCount(prev => ({
                                              ...prev,
                                              [itemKey]: currentCount + 1
                                            }));
                                          }}
                                          className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-[#16a34a] text-white rounded-full flex items-center justify-center text-xs md:text-sm font-bold hover:bg-[#15803d] transition-colors touch-manipulation"
                                        >
                                          +
                                        </button>
                                      </div>
                                      
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddToCart(item, currentCount, itemKey);
                                        }}
                                        disabled={currentCount === 0}
                                        className={`relative p-2 sm:p-2.5 md:p-3 rounded-lg transition-colors touch-manipulation ${
                                          currentCount > 0
                                            ? 'bg-[#f59e0b] text-white hover:bg-[#d97706]'
                                            : 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'
                                        }`}
                                      >
                                        <FaShoppingCart size={12} className="sm:text-sm md:text-base" />
                                        {currentCount > 0 && (
                                          <span className="absolute -top-1 -right-1 bg-[#16a34a] text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold text-[10px] sm:text-xs">
                                            {currentCount}
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-[#ababab] text-sm">No items available in this menu</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        // Items View (Category Items or Menu Items)
        <>
          <div className="px-4 sm:px-6 md:px-10 py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToMain}
                className="text-[#f59e0b] hover:text-[#d97706] transition-colors text-sm font-medium"
              >
                ← Back to Main
              </button>
              <h2 className="text-[#f5f5f5] text-lg font-semibold">
                {viewMode === 'categoryItems' 
                  ? `${selectedCategory?.name || 'Category'} Items`
                  : `${selectedMenu?.name || 'Menu'} Items`
                }
              </h2>
            </div>
          </div>
          
          <hr className="border-[#2a2a2a] border-t-2 mx-4 sm:mx-6 md:mx-10" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 px-4 sm:px-6 md:px-10 py-4 w-full">
            {items.length === 0 && !loading ? (
              <div className="col-span-full text-center text-[#ababab] p-8">
                No items found in this {viewMode === 'categoryItems' ? 'category' : 'menu'}
              </div>
            ) : (
              items.map((item) => {
                return (
                  <div
                    key={item._id || item.id}
                    className="flex flex-col items-start justify-between p-3 md:p-4 rounded-lg h-auto min-h-[160px] sm:min-h-[170px] md:min-h-[180px] cursor-pointer hover:bg-[#2a2a2a] bg-[#1a1a1a] transition-colors"
                  >
                    <div className="flex items-start justify-between w-full mb-3">
                      <div className="flex-1 pr-2">
                        <h1 className="text-[#f5f5f5] text-sm sm:text-base md:text-lg font-semibold overflow-hidden">
                          <span className="block truncate">{item.name}</span>
                        </h1>
                        {item.options && item.options.length > 0 && (
                          <p className="text-xs text-[#02ca3a] mt-1 font-medium">
                            📋 {item.options.length} option{item.options.length > 1 ? 's' : ''} available
                          </p>
                        )}
                        {item.description && (
                          <p className="text-xs text-[#ababab] mt-1 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <button 
                        onClick={() => handleAddToCart(item, itemCount[item._id || item.id], item._id || item.id)} 
                        disabled={(itemCount[item._id || item.id] || 0) === 0}
                        className={`${
                          (itemCount[item._id || item.id] || 0) > 0 
                            ? 'bg-[#2e4a40] text-[#02ca3a] hover:bg-[#3a5a50]' 
                            : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                        } p-2 sm:p-3 rounded-lg flex-shrink-0 transition-colors relative touch-manipulation`}
                      >
                        <FaShoppingCart size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
                        {(itemCount[item._id || item.id] || 0) > 0 && (
                          <span className="absolute -top-1 -right-1 bg-[#02ca3a] text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold text-[10px] sm:text-xs">
                            {itemCount[item._id || item.id]}
                          </span>
                        )}
                      </button>
                    </div>
                    
                    {/* Price and Controls Section */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full mt-auto gap-3 sm:gap-2">
                      <p className="text-[#f5f5f5] text-lg sm:text-xl md:text-2xl font-bold">
                        Rs{item.price}
                      </p>
                      <div className="flex items-center justify-between bg-[#1f1f1f] px-3 sm:px-4 py-2 sm:py-3 rounded-lg gap-3 sm:gap-4 md:gap-6 min-w-[110px] sm:min-w-[130px] w-full sm:w-auto">
                        <button
                          onClick={() => decrement(item._id || item.id)}
                          disabled={(itemCount[item._id || item.id] || 0) === 0}
                          className={`text-lg sm:text-xl md:text-2xl transition-colors w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center ${
                            (itemCount[item._id || item.id] || 0) === 0
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-yellow-500 hover:text-yellow-400'
                          }`}
                        >
                          &minus;
                        </button>
                        <span className={`text-sm sm:text-base md:text-lg font-medium min-w-[20px] text-center ${
                          (itemCount[item._id || item.id] || 0) > 0 ? 'text-yellow-400' : 'text-white'
                        }`}>
                          {itemCount[item._id || item.id] || 0}
                        </span>
                        <button
                          onClick={() => increment(item._id || item.id)}
                          disabled={(itemCount[item._id || item.id] || 0) >= 4}
                          className={`text-lg sm:text-xl md:text-2xl transition-colors w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center ${
                            (itemCount[item._id || item.id] || 0) >= 4
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-yellow-500 hover:text-yellow-400'
                          }`}
                        >
                          &#43;
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
      
      {/* Options Modal */}
      <ItemOptionsModal
        item={selectedItemForOptions}
        isOpen={showOptionsModal}
        onClose={handleCloseOptionsModal}
        onAddToCart={handleAddToCartFromModal}
        quantity={selectedItemQuantity}
      />
    </>
  );
};

export default MenuContainer;

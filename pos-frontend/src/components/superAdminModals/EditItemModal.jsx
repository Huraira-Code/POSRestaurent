import React, { useState, useEffect, useCallback } from 'react';

const EditItemModal = ({ itemData, onSubmit, onCancel, isLoading, categories = [] }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    discount: '',
    categoryId: '',
    status: '',
    tax: {
      cash: '',
      card: ''
    },
    options: []
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updatedItems, setUpdatedItems] = useState([]);
  const [isAddingOption, setIsAddingOption] = useState(false);

  // Update form data when itemData changes - but only initialize once
  useEffect(() => {
    if (itemData && !isInitialized) {
      console.log('EditItemModal: Initializing form data with itemData:', itemData);
      console.log('Existing options:', itemData.options);
      
      // Add unique IDs to options only if they don't have them
      const optionsWithIds = itemData.options ? itemData.options.map((option, index) => {
        // If option already has an ID that looks like our generated format, keep it
        if (option.id && option.id.startsWith('option-')) {
          return { ...option };
        }
        // Otherwise, generate a new ID
        return {
          ...option,
          id: `option-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
        };
      }) : [];
      
      console.log('Options with IDs (initialization):', optionsWithIds);
      console.log('Options count after processing:', optionsWithIds.length);
      
      setFormData({
        name: itemData.name || '',
        price: itemData.price || '',
        description: itemData.description || '',
        discount: itemData.discount || '',
        categoryId: itemData.categoryId || '',
        status: itemData.status || '',
        tax: {
          cash: itemData.tax?.cash || '',
          card: itemData.tax?.card || ''
        },
        options: optionsWithIds
      });
      
      setIsInitialized(true);
    }
  }, [itemData, isInitialized]);

  // Reset initialization when modal closes/reopens
  useEffect(() => {
    if (!itemData) {
      setIsInitialized(false);
    }
  }, [itemData]);

  const handleInputChange = (field, value) => {
    // Handle nested tax object fields
    if (field === 'taxCash' || field === 'taxCard') {
      const taxField = field === 'taxCash' ? 'cash' : 'card';
      setFormData(prev => ({
        ...prev,
        tax: {
          ...prev.tax,
          [taxField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (updateError) {
      setUpdateError('');
    }
  };

  const handleOptionChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updatedOptions = [...prev.options];
      if (updatedOptions[index]) {
        updatedOptions[index] = {
          ...updatedOptions[index],
          [field]: value
        };
        console.log(`Updated option ${index} ${field}:`, value, 'Total options:', updatedOptions.length);
      }
      return {
        ...prev,
        options: updatedOptions
      };
    });
  }, []);

  const addOption = useCallback(() => {
    // Prevent rapid successive clicks
    if (isAddingOption) {
      console.log('Already adding option, ignoring click');
      return;
    }
    
    setIsAddingOption(true);
    
    const newOption = { 
      id: `option-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '', 
      price: '' 
    };
    
    setFormData(prev => {
      const newOptions = [...prev.options, newOption];
      console.log('Adding new option. Current options:', prev.options.length, 'New options:', newOptions.length);
      return {
        ...prev,
        options: newOptions
      };
    });
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsAddingOption(false);
    }, 100);
  }, [isAddingOption]);

  const removeOption = useCallback((index) => {
    setFormData(prev => {
      const filteredOptions = prev.options.filter((_, i) => i !== index);
      console.log(`Removing option at index ${index}. Before:`, prev.options.length, 'After:', filteredOptions.length);
      return {
        ...prev,
        options: filteredOptions
      };
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim() && formData.price && !isNaN(parseFloat(formData.price)) && formData.categoryId && formData.status) {
      setUpdateError('');
      setUpdateSuccess('');
      
      // Filter out any empty options
      const validOptions = formData.options.filter(option => 
        option.name.trim() && option.price && !isNaN(parseFloat(option.price))
      );
      
      const updateData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        description: formData.description.trim(),
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        categoryId: formData.categoryId,
        status: formData.status,
        tax: {
          cash: parseFloat(formData.tax.cash) || 0,
          card: parseFloat(formData.tax.card) || 0
        },
        options: validOptions.map(option => ({
          name: option.name.trim(),
          price: parseFloat(option.price)
        }))
      };
      
      // Add to updated items list immediately
      setUpdatedItems(prev => [...prev, { 
        originalName: itemData?.name, 
        newName: formData.name.trim(),
        price: parseFloat(formData.price),
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      // Show success message
      setUpdateSuccess(`Item "${itemData?.name}" successfully updated to "${formData.name.trim()}"!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateSuccess('');
      }, 3000);
      
      // Call the parent's onSubmit function
      try {
        onSubmit(updateData);
      } catch (error) {
        console.error('Error updating item:', error);
        setUpdateError(error.message || 'Failed to update item');
        // Remove from updated list if there was an error
        setUpdatedItems(prev => prev.slice(0, -1));
        setUpdateSuccess('');
      }
    } else {
      setUpdateError('Please fill in all required fields: name, price, category, and status.');
    }
  };

  const handlePriceChange = (e) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleInputChange('price', value);
    }
  };

  const handleOptionPriceChange = (index, e) => {
    const value = e.target.value;
    // Allow empty string, numbers, and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleOptionChange(index, 'price', value);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1a1a1a] p-8 rounded-lg w-[500px] max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#f5f5f5] mb-6">Edit Item</h2>
        
        {/* Success/Error Messages */}
        {updateError && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-100 text-sm">{updateError}</p>
          </div>
        )}
        
        {updateSuccess && (
          <div className="mb-4 p-3 bg-green-900 border border-green-700 rounded-lg">
            <p className="text-green-100 text-sm">{updateSuccess}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-[#f5f5f5] text-sm font-medium mb-2">Item Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none"
              placeholder="Enter item name"
              required
            />
          </div>
          
          <div>
            <label className="block text-[#f5f5f5] text-sm font-medium mb-2">Price *</label>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={formData.price}
              onChange={handlePriceChange}
              disabled={isLoading}
              className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none"
              placeholder="Enter price"
              required
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-2">Tax Rates *</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#a0a0a0] text-xs font-medium mb-1">Cash Tax (%)</label>
                  <input 
                    type="text"
                    value={formData.tax.cash}
                    onChange={(e) => handleInputChange('taxCash', e.target.value)}
                    className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none"
                    placeholder="0.00"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[#a0a0a0] text-xs font-medium mb-1">Card Tax (%)</label>
                  <input 
                    type="text"
                    value={formData.tax.card}
                    onChange={(e) => handleInputChange('taxCard', e.target.value)}
                    className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none"
                    placeholder="0.00"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[#f5f5f5] text-sm font-medium mb-2">Discount Amount</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={formData.discount}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleInputChange('discount', value);
                  }
                }}
                disabled={isLoading}
                className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none"
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[#f5f5f5] text-sm font-medium mb-2">Category *</label>
            <select 
              value={formData.categoryId}
              onChange={(e) => handleInputChange('categoryId', e.target.value)}
              className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none"
              disabled={isLoading}
              required
            >
              <option value="">Select category...</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[#f5f5f5] text-sm font-medium mb-2">Status *</label>
            <select 
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none"
              disabled={isLoading}
              required
            >
              <option value="">Select status...</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[#f5f5f5] text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isLoading}
              className="w-full p-3 bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#404040] focus:border-[#60a5fa] focus:outline-none resize-none"
              rows="3"
              placeholder="Enter item description"
            />
          </div>

          {/* Options Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[#f5f5f5] text-sm font-medium">
                Options (Optional)
              </label>
              <button
                type="button"
                onClick={addOption}
                disabled={isLoading || isAddingOption}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  isLoading || isAddingOption
                    ? 'bg-[#404040] text-[#606060] cursor-not-allowed'
                    : 'bg-[#60a5fa] hover:bg-[#3b82f6] text-white'
                }`}
              >
                {isAddingOption ? 'Adding...' : 'Add Option'}
              </button>
            </div>
            
            {formData.options.length > 0 && (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {formData.options.map((option, index) => (
                  <div key={`option-${option.id || index}`} className="flex gap-2 p-3 bg-[#262626] rounded-lg border border-[#404040]">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option.name || ''}
                        onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                        disabled={isLoading}
                        className="w-full p-2 bg-[#1a1a1a] text-[#f5f5f5] rounded border border-[#404040] focus:border-[#60a5fa] focus:outline-none text-sm"
                        placeholder="Option name"
                      />
                    </div>
                    <div className="w-20">
                      <input
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={option.price || ''}
                        onChange={(e) => handleOptionPriceChange(index, e)}
                        disabled={isLoading}
                        className="w-full p-2 bg-[#1a1a1a] text-[#f5f5f5] rounded border border-[#404040] focus:border-[#60a5fa] focus:outline-none text-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      disabled={isLoading}
                      className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                        isLoading
                          ? 'bg-[#404040] text-[#606060] cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700 text-white'
                      }`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {formData.options.length === 0 && (
              <p className="text-sm text-[#606060] italic">No options added yet</p>
            )}
          </div>
        </div>
        
        {/* Show updated items if any */}
        {updatedItems.length > 0 && (
          <div className="mt-4 p-4 bg-[#262626] rounded-lg">
            <h3 className="text-[#f5f5f5] text-sm font-medium mb-3">
              Updated Items in this Session ({updatedItems.length}):
            </h3>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {updatedItems.map((update, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-800 text-blue-200 rounded">
                      {update.originalName}
                    </span>
                    <span className="text-[#a0a0a0]">→</span>
                    <span className="px-2 py-1 bg-green-800 text-green-200 rounded">
                      {update.newName} - Rs{update.price}
                    </span>
                  </div>
                  <span className="text-[#606060]">{update.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading 
                ? 'bg-[#404040] text-[#606060] cursor-not-allowed' 
                : 'bg-[#404040] text-[#f5f5f5] hover:bg-[#505050]'
            }`}
          >
            {updatedItems.length > 0 ? 'Done' : 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim() || !formData.price || isNaN(parseFloat(formData.price))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isLoading || !formData.name.trim() || !formData.price || isNaN(parseFloat(formData.price))
                ? 'bg-[#3b82f6] opacity-50 cursor-not-allowed text-white'
                : 'bg-[#60a5fa] hover:bg-[#3b82f6] text-white'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </div>
            ) : updatedItems.length > 0 ? (
              'Update Another'
            ) : (
              'Update Item'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;

import { useEffect, useCallback } from 'react';
import { useDataManagementStore } from '../store/dataManagement.store';
import { DataManagementService, OptionItem } from '../services/data-management.service';

export const useDataManagement = (type?: string) => {
  const { 
    setTypes, 
    setIsLoading, 
    setError, 
    setItems, 
    addItem, 
    updateItem, 
    removeItem, 
    dataSets, 
    loadingStates, 
    errors 
  } = useDataManagementStore();

  const fetchTypes = useCallback(async () => {
    // Only fetch types generically
    try {
      const types = await DataManagementService.getTypes();
      setTypes(types);
    } catch (err: any) {
      console.error('Failed to fetch types', err);
    }
  }, [setTypes]);

  const fetchItems = useCallback(async (fetchType: string) => {
    setIsLoading(fetchType, true);
    setError(fetchType, null);
    try {
      const items = await DataManagementService.getDataSet(fetchType);
      setItems(fetchType, Array.isArray(items) ? items : ((items as any)?.data || []));
    } catch (err: any) {
      setError(fetchType, err.message || `Failed to fetch items for ${fetchType}`);
      setItems(fetchType, []);
    } finally {
      setIsLoading(fetchType, false);
    }
  }, [setIsLoading, setError, setItems]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  useEffect(() => {
    if (type) {
      fetchItems(type);
    }
  }, [type, fetchItems]);

  const handleCreate = async (data: Partial<OptionItem>) => {
    if (!type) return;
    try {
      setIsLoading(type, true);
      const newItem = await DataManagementService.createDataSetItem(type, data);
      addItem(type, newItem);
    } catch (err: any) {
      setError(type, err.message || 'Failed to create item');
    } finally {
      setIsLoading(type, false);
    }
  };

  const handleUpdate = async (id: string, data: Partial<OptionItem>) => {
    if (!type) return;
    try {
      setIsLoading(type, true);
      const updatedItem = await DataManagementService.updateDataSetItem(type, id, data);
      updateItem(type, id, updatedItem);
    } catch (err: any) {
      setError(type, err.message || 'Failed to update item');
    } finally {
      setIsLoading(type, false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!type) return;
    try {
      setIsLoading(type, true);
      await DataManagementService.deleteDataSetItem(type, id);
      removeItem(type, id);
    } catch (err: any) {
      setError(type, err.message || 'Failed to delete item');
    } finally {
      setIsLoading(type, false);
    }
  };

  return {
    // Scoped state for the provided type
    items: type ? (dataSets[type] || []) : [],
    isLoading: type ? (loadingStates[type] || false) : false,
    error: type ? (errors[type] || null) : null,
    // Scoped handlers
    handleCreate,
    handleUpdate,
    handleDelete,
    fetchItems
  };
};

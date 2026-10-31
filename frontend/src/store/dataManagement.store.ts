import { create } from 'zustand';
import { OptionItem } from '../services/data-management.service';

interface DataManagementState {
  types: string[];
  dataSets: Record<string, OptionItem[]>;
  loadingStates: Record<string, boolean>;
  errors: Record<string, string | null>;
  
  setTypes: (types: string[]) => void;
  setItems: (type: string, items: OptionItem[]) => void;
  setIsLoading: (type: string, isLoading: boolean) => void;
  setError: (type: string, error: string | null) => void;
  
  addItem: (type: string, item: OptionItem) => void;
  updateItem: (type: string, id: string, item: OptionItem) => void;
  removeItem: (type: string, id: string) => void;
}

export const useDataManagementStore = create<DataManagementState>((set) => ({
  types: [],
  dataSets: {},
  loadingStates: {},
  errors: {},
  
  setTypes: (types) => set({ types }),
  setItems: (type, items) => set((state) => ({ 
    dataSets: { ...state.dataSets, [type]: items } 
  })),
  setIsLoading: (type, isLoading) => set((state) => ({ 
    loadingStates: { ...state.loadingStates, [type]: isLoading } 
  })),
  setError: (type, error) => set((state) => ({ 
    errors: { ...state.errors, [type]: error } 
  })),
  
  addItem: (type, item) => set((state) => ({ 
    dataSets: { 
      ...state.dataSets, 
      [type]: [...(state.dataSets[type] || []), item] 
    } 
  })),
  updateItem: (type, id, item) => set((state) => ({
    dataSets: {
      ...state.dataSets,
      [type]: (state.dataSets[type] || []).map((i) => i.id === id ? { ...i, ...item } : i)
    }
  })),
  removeItem: (type, id) => set((state) => ({
    dataSets: {
      ...state.dataSets,
      [type]: (state.dataSets[type] || []).filter((i) => i.id !== id)
    }
  }))
}));

import { api } from '../config/axios';

const API_BASE = '/enums'; // Assuming backend router is mounted at this path

export interface OptionItem {
  id: string;
  name: string;
  [key: string]: any;
}

export const DataManagementService = {
  getTypes: async (): Promise<string[]> => {
    const response = await api.get(`${API_BASE}/types`);
    return response.data.data;
  },

  getDataSet: async (type: string): Promise<OptionItem[]> => {
    const response = await api.get(`${API_BASE}/data-set/${type}`);
    return response.data.data;
  },

  createDataSetItem: async (type: string, data: Partial<OptionItem>): Promise<OptionItem> => {
    const response = await api.post(`${API_BASE}/data-set/${type}`, data);
    return response.data.data;
  },

  updateDataSetItem: async (type: string, id: string, data: Partial<OptionItem>): Promise<OptionItem> => {
    const response = await api.put(`${API_BASE}/data-set/${type}/${id}`, data);
    return response.data.data;
  },

  deleteDataSetItem: async (type: string, id: string): Promise<void> => {
    await api.delete(`${API_BASE}/data-set/${type}/${id}`);
  }
};

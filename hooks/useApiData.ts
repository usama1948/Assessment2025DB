// hooks/useApiData.ts
import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';

export function useApiData<T extends { id: number }>(resource: string) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const items = await api.getAll<T>(resource);
            setData(items);
        } catch (err: any) {
            console.error(`Failed to refresh data for ${resource}`, err);
            setError(err.message || `فشل في جلب البيانات من ${resource}`);
        } finally {
            setLoading(false);
        }
    }, [resource]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const addItem = useCallback(async (item: Omit<T, 'id' | 'dateAdded'>): Promise<boolean> => {
        setError(null); // Clear previous error
        try {
            const newItem = await api.add<T, Omit<T, 'id' | 'dateAdded'>>(resource, item);
            setData(prev => [newItem, ...prev]);
            return true;
        } catch (err: any) {
            console.error(`Failed to add item to ${resource}`, err);
            setError(err.message || `فشل في إضافة العنصر إلى ${resource}`);
            return false;
        }
    }, [resource]);

    const addMultipleItems = useCallback(async (items: Omit<T, 'id' | 'dateAdded'>[]): Promise<boolean> => {
        setError(null); // Clear previous error
        try {
            await api.addMultiple(resource, items);
            await refreshData(); // Refresh data from server after batch import
            return true;
        } catch (err: any) {
            console.error(`Failed to add multiple items to ${resource}`, err);
            setError(err.message || `فشل في إضافة العناصر إلى ${resource}`);
            return false;
        }
    }, [resource, refreshData]);

    const updateItem = useCallback(async (item: T): Promise<boolean> => {
        setError(null); // Clear previous error
        try {
            const updatedItem = await api.update<T>(resource, item.id, item);
            setData(prev => prev.map(d => (d.id === updatedItem.id ? updatedItem : d)));
            return true;
        } catch (err: any) {
            console.error(`Failed to update item in ${resource}`, err);
            setError(err.message || `فشل في تحديث العنصر في ${resource}`);
            return false;
        }
    }, [resource]);

    const removeItem = useCallback(async (id: number): Promise<boolean> => {
         setError(null); // Clear previous error
         try {
            await api.remove(resource, id);
            setData(prev => prev.filter(d => d.id !== id));
            return true;
        } catch (err: any) {
            console.error(`Failed to remove item from ${resource}`, err);
            setError(err.message || `فشل في حذف العنصر من ${resource}`);
            return false;
        }
    }, [resource]);

    return { data, loading, error, refreshData, addItem, addMultipleItems, updateItem, removeItem };
}

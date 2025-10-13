
import { useState, useEffect, useCallback } from 'react';
import { getAll, add, addMultiple, update, remove } from '../utils/db';

export function useIndexedDBStore<T extends { id: number }>(storeName: string) {
    const [data, setData] = useState<T[]>([]);

    const refreshData = useCallback(async () => {
        try {
            const items = await getAll<T>(storeName);
            setData(items);
        } catch (error) {
            console.error(`Failed to refresh data for ${storeName}`, error);
        }
    }, [storeName]);

    useEffect(() => {
        refreshData();
    }, [refreshData]);

    const addItem = useCallback(async (item: T) => {
        await add(storeName, item);
        await refreshData();
    }, [storeName, refreshData]);

    const addMultipleItems = useCallback(async (items: T[]) => {
        await addMultiple(storeName, items);
        await refreshData();
    }, [storeName, refreshData]);

    const updateItem = useCallback(async (item: T) => {
        await update(storeName, item);
        await refreshData();
    }, [storeName, refreshData]);

    const removeItem = useCallback(async (id: number) => {
        await remove(storeName, id);
        await refreshData();
    }, [storeName, refreshData]);

    return { data, addItem, addMultipleItems, updateItem, removeItem };
}

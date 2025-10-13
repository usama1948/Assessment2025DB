
const DB_NAME = 'SchoolManagementDB';
const DB_VERSION = 1;

const STORES = [
    'schools',
    'timssResults',
    'pisaResults',
    'pirlsResults',
    'nationalTestResults',
    'assessmentTestResults',
    'unifiedTestResults',
    'literacyNumeracyResults',
    'aloResults',
    'managedUsers'
];

let dbPromise: Promise<IDBDatabase> | null = null;

const initDB = (): Promise<IDBDatabase> => {
    if (dbPromise) {
        return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject('Error opening database');
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const dbInstance = (event.target as IDBOpenDBRequest).result;
            STORES.forEach(storeName => {
                if (!dbInstance.objectStoreNames.contains(storeName)) {
                    // Use `id` as the key path, but don't auto-increment as we provide it.
                    dbInstance.createObjectStore(storeName, { keyPath: 'id', autoIncrement: false });
                }
            });
        };
    });
    return dbPromise;
};

export const getAll = <T>(storeName: string): Promise<T[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        } catch (error) {
            reject(error);
        }
    });
};

export const add = <T>(storeName: string, item: T): Promise<IDBValidKey> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(item);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        } catch (error) {
            reject(error);
        }
    });
};

export const addMultiple = <T>(storeName: string, items: T[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);

            items.forEach(item => store.add(item));
        } catch (error) {
            reject(error);
        }
    });
};

export const update = <T>(storeName: string, item: T): Promise<IDBValidKey> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        } catch (error) {
            reject(error);
        }
    });
};

export const remove = (storeName: string, id: number): Promise<void> => {
     return new Promise(async (resolve, reject) => {
        try {
            const db = await initDB();
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        } catch (error) {
            reject(error);
        }
    });
};
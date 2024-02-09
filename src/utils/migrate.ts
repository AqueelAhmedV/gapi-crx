
type AreaName = keyof Pick<typeof chrome.storage, "sync" | "local" | "managed" | "session">;

type StorageArea = typeof chrome.storage.managed

export function migrateStorageArea(a1: AreaName, a2: AreaName, ...keys: string[]) {
    let storage1: StorageArea = chrome.storage[a1]
    let storage2: StorageArea = chrome.storage[a2]
    
    storage1.get(keys)
    .then(storage2.set)
    .then(() => {
        console.log(`Migrate ${keys.join(', ')} \nfrom 'chrome.${a1}' to 'chrome.${a2}' successful`)
    })
    .catch((err) => {
        console.log('Migrate error: ', err)
    })
}

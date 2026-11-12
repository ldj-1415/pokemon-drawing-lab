const DB_NAME = 'pokemon-drawing-lab-gallery';
const DB_VERSION = 1;
const META_STORE = 'meta';
const FILE_STORE = 'files';

let databasePromise = null;

export function isGallerySupported() {
  return typeof indexedDB !== 'undefined';
}

export function describeGalleryError(error) {
  if (!error) return '图库操作失败。';
  if (error.name === 'QuotaExceededError') {
    return '浏览器存储空间不足，无法保存这张图片。请删除一些图库图片后重试。';
  }
  if (error.name === 'ConstraintError') {
    return '这张图片已经存在于图库中，无需重复上传。';
  }
  if (error.name === 'SecurityError') {
    return '浏览器阻止了本地图库存储，请检查隐私模式或站点存储权限。';
  }
  if (error.name === 'VersionError') {
    return '图库数据库版本不兼容，请刷新页面后重试。';
  }
  if (error.name === 'AbortError') {
    return '图库事务被中止，请重试。';
  }
  return error.message || '图库操作失败。';
}

export function openGalleryDb() {
  if (!isGallerySupported()) {
    return Promise.reject(new Error('当前浏览器不支持 IndexedDB，无法保存图库图片。'));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      databasePromise = null;
      reject(error);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(META_STORE)) {
        const metaStore = database.createObjectStore(META_STORE, { keyPath: 'id' });
        metaStore.createIndex('by_hash', 'hash', { unique: true });
        metaStore.createIndex('by_usage', 'usage', { unique: false });
        metaStore.createIndex('by_createdAt', 'createdAt', { unique: false });
      }
      if (!database.objectStoreNames.contains(FILE_STORE)) {
        database.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };

    request.onerror = () => {
      databasePromise = null;
      reject(request.error);
    };

    request.onblocked = () => {
      // The open request can stay pending until the old connection closes.
      console.warn('[Pokémon Drawing Lab] 图库数据库升级被其他页面占用。');
    };
  });

  return databasePromise;
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error || new Error('图库事务被中止'));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllGalleryMeta() {
  const database = await openGalleryDb();
  const transaction = database.transaction(META_STORE, 'readonly');
  const result = await requestResult(transaction.objectStore(META_STORE).getAll());
  return (result || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getGalleryMeta(id) {
  if (!id) return null;
  const database = await openGalleryDb();
  const transaction = database.transaction(META_STORE, 'readonly');
  return requestResult(transaction.objectStore(META_STORE).get(id));
}

export async function findGalleryImageByHash(hash) {
  if (!hash) return null;
  const database = await openGalleryDb();
  const transaction = database.transaction(META_STORE, 'readonly');
  return requestResult(transaction.objectStore(META_STORE).index('by_hash').get(hash));
}

export async function saveGalleryImageRecord({ meta, file }) {
  const database = await openGalleryDb();
  const transaction = database.transaction([META_STORE, FILE_STORE], 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(META_STORE).add(meta);
  transaction.objectStore(FILE_STORE).add({
    id: meta.id,
    blob: file,
    mimeType: meta.mimeType,
    size: meta.size,
  });
  await done;
  return meta;
}

export async function updateGalleryMeta(meta) {
  const database = await openGalleryDb();
  const transaction = database.transaction(META_STORE, 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(META_STORE).put(meta);
  await done;
  return meta;
}

export async function deleteGalleryImageRecord(id) {
  const database = await openGalleryDb();
  const transaction = database.transaction([META_STORE, FILE_STORE], 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(META_STORE).delete(id);
  transaction.objectStore(FILE_STORE).delete(id);
  await done;
  return true;
}

export async function getGalleryImageBlob(id) {
  if (!id) return null;
  const database = await openGalleryDb();
  const transaction = database.transaction(FILE_STORE, 'readonly');
  const record = await requestResult(transaction.objectStore(FILE_STORE).get(id));
  return record?.blob || null;
}

export async function getGalleryRecordCounts() {
  const database = await openGalleryDb();
  const transaction = database.transaction([META_STORE, FILE_STORE], 'readonly');
  const [metaCount, fileCount] = await Promise.all([
    requestResult(transaction.objectStore(META_STORE).count()),
    requestResult(transaction.objectStore(FILE_STORE).count()),
  ]);
  return { metaCount, fileCount };
}

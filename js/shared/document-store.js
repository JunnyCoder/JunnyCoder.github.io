// /js/shared/document-store.js
const STORE_KEY = 'my-site.documents';
const CURRENT_EXPORT_KEY = 'my-site.current-export';

export const DocumentStore = {
  save(document) {
    const docs = this.list();
    docs[document.id] = document;
    localStorage.setItem(STORE_KEY, JSON.stringify(docs));
  },
  
  load(id) {
    const docs = this.list();
    return docs[id] || null;
  },

  list() {
    const data = localStorage.getItem(STORE_KEY);
    return data ? JSON.parse(data) : {};
  },

  remove(id) {
    const docs = this.list();
    delete docs[id];
    localStorage.setItem(STORE_KEY, JSON.stringify(docs));
  },

  clear() {
    localStorage.removeItem(STORE_KEY);
  },

  // PDF 에디터로 넘길 현재 작업 ID 지정
  setCurrentExport(id) {
    localStorage.setItem(CURRENT_EXPORT_KEY, id);
  },

  getCurrentExport() {
    const id = localStorage.getItem(CURRENT_EXPORT_KEY);
    return id ? this.load(id) : null;
  }
};
/* ==========================================================================
   Happy Minds — PracticeStore (student Learning Space)
   The chapter practice modules (practice-chapters.js) save their progress
   with getItem / setItem / removeItem, like browser storage. PracticeStore
   keeps those values for the signed-in student in their account instead,
   so progress follows the student to any device and isn't shared with
   another child on the same computer.

   Stored as the student's 'chapter1Practice' record (the database name it
   already had for practice): { v: 2, store: { key: value, … } }.
   ========================================================================== */

const PracticeStore = (() => {
    const DOC = 'chapter1Practice';
    let studentId = null;
    let store = {};

    function persist() {
        if (!studentId) return;
        HMCloud.save(DOC, { v: 2, store }, studentId);
    }

    return {
        // Call when the student signs in.
        bind(id) {
            studentId = id;
            const saved = HMCloud.get(DOC, id);
            store = saved && saved.v === 2 && saved.store ? { ...saved.store } : {};
        },
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
        },
        setItem(key, value) {
            store[key] = String(value);
            persist();
        },
        removeItem(key) {
            if (!(key in store)) return;
            delete store[key];
            persist();
        }
    };
})();

const products = new Map();

module.exports = {
    initializeApp: jest.fn(),
    credential: {
        cert: jest.fn(() => ({}))
    },
    firestore: () => ({
        collection: () => ({
            get: async () => ({
                docs: [...products.entries()].map(([id, data]) => ({
                    id,
                    data: () => data
                }))
            }),
            add: async (data) => {
                const id = `mock-${Math.random().toString(36).slice(2, 10)}`;
                products.set(id, data);
                return { id };
            },
            doc: (id) => ({
                get: async () => ({
                    exists: products.has(id),
                    id,
                    data: () => products.get(id)
                }),
                update: async (data) => products.set(id, data),
                delete: async () => products.delete(id)
            })
        })
    }),
    __reset: () => products.clear()
};

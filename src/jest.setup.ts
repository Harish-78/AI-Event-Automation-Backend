const mockSql = jest.fn((...args) => {
    // Check if it's a tagged template literal call
    const isTaggedTemplate = Array.isArray(args[0]) && Array.isArray((args[0] as any).raw);

    if (isTaggedTemplate) {
        // Return a promise that resolves to an empty array by default
        const p = Promise.resolve([]);
        (p as any)._isQuery = true;
        return p;
    }

    // If it's a function call like sql(obj, columns)
    // return something that can be correctly handled in a template
    return "mocked_fragment";
}) as any;

mockSql.join = jest.fn((chunks, sep) => chunks.join(sep));

jest.mock("./config/db.config", () => mockSql);

jest.mock("./logger/logger", () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
    },
}));

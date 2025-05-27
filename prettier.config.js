const prettierConfig = {
    // Settings for Prettier.
    singleQuote: true,
    jsxSingleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    tabWidth: 4,

    // Settings for prettier-plugin-sort-imports.
    //  (see https://github.com/trivago/prettier-plugin-sort-imports).
    // plugins: ['@trivago/prettier-plugin-sort-imports'],
    importOrder: [
        '^[./]', // Separate local imports into their own group.
    ],
    importOrderSeparation: true, // Put blank lines between import groups.
    importOrderSortSpecifiers: true, // Not sure what this does.
};

export default prettierConfig;

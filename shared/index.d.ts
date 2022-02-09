function genImportId(bank) {
    const random = Math.floor(1000 + Math.random() * 1000).toString(16);
    return `${bank}-${random}-${Date.now().toString(16)}`;
}

export { genImportId };

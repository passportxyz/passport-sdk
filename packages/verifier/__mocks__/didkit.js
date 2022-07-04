// --- Generate & Verify methods
module.exports = {
  verifyCredential: jest.fn(() =>
    Promise.resolve(
      JSON.stringify({
        checks: [],
        warnings: [],
        errors: [],
      })
    )
  ),
};

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BookShelfDapp", (m) => {
  const bookshelf = m.contract("BookShelf", []);

  return { bookshelf };
});
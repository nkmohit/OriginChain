const SupplyChain = artifacts.require("SupplyChain");

const STAGE = {
  Init: "0",
  RawMaterialSupply: "1",
  Manufacture: "2",
  Distribution: "3",
  Retail: "4",
  sold: "5",
};

async function assertReverts(promise) {
  try {
    await promise;
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    if (
      message.includes("revert") ||
      message.includes("VM Exception") ||
      message.includes("invalid opcode")
    ) {
      return;
    }
    throw error;
  }
  assert.fail("expected the transaction to revert");
}

contract("SupplyChain", (accounts) => {
  const [
    owner,
    rawMaterialSupplier,
    manufacturer,
    distributor,
    retailer,
    otherRetailer,
    stranger,
  ] = accounts;

  let chain;

  beforeEach(async () => {
    chain = await SupplyChain.new();
    await chain.addRMS(rawMaterialSupplier, "Valley Farm", "Punjab", {
      from: owner,
    });
    await chain.addManufacturer(manufacturer, "Grain Mill", "Ludhiana", {
      from: owner,
    });
    await chain.addDistributor(distributor, "North Hub", "Delhi", {
      from: owner,
    });
    await chain.addRetailer(retailer, "City Shop", "Mumbai", { from: owner });
    await chain.addRetailer(otherRetailer, "Other Shop", "Pune", {
      from: owner,
    });
  });

  async function stageOf(productId) {
    const product = await chain.ProductStock(productId);
    return product.stage.toString();
  }

  it("rejects a role that is not authorized for the step", async () => {
    await assertReverts(
      chain.addRMS(stranger, "Unapproved Farm", "Nowhere", { from: stranger })
    );
    await assertReverts(
      chain.addProduct("Wheat", "Whole grain", { from: stranger })
    );

    await chain.addProduct("Wheat", "Whole grain", { from: owner });

    await assertReverts(chain.RMSsupply(1, { from: stranger }));
    await assertReverts(chain.RMSsupply(1, { from: manufacturer }));
    await assertReverts(chain.Manufacturing(1, { from: rawMaterialSupplier }));
    await assertReverts(chain.Distribute(1, { from: manufacturer }));
    await assertReverts(chain.Retail(1, { from: distributor }));
    await assertReverts(chain.sold(1, { from: retailer }));

    assert.equal(await stageOf(1), STAGE.Init);
  });

  it("advances a product through each stage in order", async () => {
    await chain.addProduct("Rice", "Basmati", { from: owner });

    assert.equal((await chain.productCtr()).toString(), "1");
    const ordered = await chain.ProductStock(1);
    assert.equal(ordered.name, "Rice");
    assert.equal(ordered.description, "Basmati");
    assert.equal(ordered.stage.toString(), STAGE.Init);
    assert.equal(await chain.showStage(1), "Product Ordered");

    await assertReverts(chain.Manufacturing(1, { from: manufacturer }));
    await assertReverts(chain.Distribute(1, { from: distributor }));
    await assertReverts(chain.Retail(1, { from: retailer }));
    await assertReverts(chain.sold(1, { from: retailer }));
    assert.equal(await stageOf(1), STAGE.Init);

    await chain.RMSsupply(1, { from: rawMaterialSupplier });
    assert.equal(await stageOf(1), STAGE.RawMaterialSupply);
    assert.equal(await chain.showStage(1), "Raw Material Supply Stage");
    await assertReverts(chain.Distribute(1, { from: distributor }));

    await chain.Manufacturing(1, { from: manufacturer });
    assert.equal(await stageOf(1), STAGE.Manufacture);
    assert.equal(await chain.showStage(1), "Manufacturing Stage");
    await assertReverts(chain.Retail(1, { from: retailer }));

    await chain.Distribute(1, { from: distributor });
    assert.equal(await stageOf(1), STAGE.Distribution);
    assert.equal(await chain.showStage(1), "Distribution Stage");
    await assertReverts(chain.sold(1, { from: retailer }));

    await chain.Retail(1, { from: retailer });
    assert.equal(await stageOf(1), STAGE.Retail);
    assert.equal(await chain.showStage(1), "Retail Stage");

    const atRetail = await chain.ProductStock(1);
    assert.equal(atRetail.RMSid.toString(), "1");
    assert.equal(atRetail.MANid.toString(), "1");
    assert.equal(atRetail.DISid.toString(), "1");
    assert.equal(atRetail.RETid.toString(), "1");

    await assertReverts(chain.sold(1, { from: otherRetailer }));
    assert.equal(await stageOf(1), STAGE.Retail);

    await chain.sold(1, { from: retailer });
    assert.equal(await stageOf(1), STAGE.sold);
    assert.equal(await chain.showStage(1), "Product Sold");

    await assertReverts(chain.RMSsupply(1, { from: rawMaterialSupplier }));
    await assertReverts(chain.sold(1, { from: retailer }));
  });
});

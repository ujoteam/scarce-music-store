import '@babel/polyfill';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import sigUtil from 'eth-sig-util';

import LicenseCore from './LicenseCore.json';
import LicenseSale from './LicenseSale.json';
import LicenseInventory from './LicenseInventory.json';
import LicenseOwnership from './LicenseOwnership.json';
import ERC20 from './ERC20.json';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ethUtil = require('ethereumjs-util');

class UjoLicensing {
  constructor(provider) {
    this.provider = provider || new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    this.contractInstances = {};

    /**
     * Adds a 5% boost to the gas for web3 calls as to ensure tx's go through
     *
     * @param {string} estimatedGas amount of gas required from `estimateGas`
     */
    this.boostGas = estimatedGas => {
      const gasBoost = new BigNumber(estimatedGas, 10).div(new BigNumber('20')).integerValue(BigNumber.ROUND_DOWN);
      return new BigNumber(estimatedGas, 10).plus(gasBoost).integerValue(BigNumber.ROUND_DOWN);
    };

    // TODO: in the future it should accept a signer not an index!
    this.signData = async (data, index) => this.provider.getSigner(index).signMessage(data);

    this.recoverAddressFromSignedData = (data, sig) => {
      const msg = ethUtil.bufferToHex(Buffer.from(data, 'utf8'));
      const params = { data: msg, sig };
      let address;
      try {
        console.log(params);
        address = sigUtil.recoverPersonalSignature(params);
      } catch (e) {
        console.log(e);
        return false;
      }
      return address;
    };

    this.normalizeProductValues = product => ({
      inventory: product.inventory.toNumber(),
      interval: product.interval.toNumber(),
      price: product.price.toNumber(),
      totalSupply: product.totalSupply.toNumber(),
      renewable: product.renewable,
    });
  }

  initializeContractIfNotExist(contractJSON, contractAddress, indexOfAccount = 0) {
    if (!this.contractInstances[indexOfAccount]) this.contractInstances[indexOfAccount] = {};
    const inStorage = this.contractInstances[indexOfAccount][contractAddress];
    if (inStorage) return inStorage;
    const ContractInstance = new ethers.Contract(
      contractAddress,
      contractJSON.abi,
      this.provider.getSigner(indexOfAccount),
    );
    this.contractInstances[indexOfAccount][contractAddress] = ContractInstance;
    return this.contractInstances[indexOfAccount][contractAddress];
  }

  // ////////////////////////////////////
  // // lots of getters for contracts
  // // might be helpful for debugging later
  // ////////////////////////////////////
  // const productIds = await ContractInstance.getAllProductIds();
  // console.log('getAllProductIds()', productIds);
  // const tokensOf = await ContractInstance.tokensOf(address);
  // console.log('tokensOf(address)', tokensOf);
  // const balanceOf = await ContractInstance.balanceOf(address);
  // console.log('balanceOf(address)', balanceOf);
  // const ownerOf = await ContractInstance.ownerOf("0");
  // console.log('ownerOf("0")', ownerOf);
  // const licenseProductId = await ContractInstance.licenseProductId("0");
  // console.log('licenseProductId("0")', licenseProductId);
  // ////////////////////////////////////

  // TODO - Need to deploy all the contracts here
  async deployNewStore(address, indexOfAccount) {
    console.log('Attempting to deploy from account', address);
    const saleFactory = new ethers.ContractFactory(
      LicenseSale.abi,
      LicenseSale.bytecode,
      this.provider.getSigner(indexOfAccount),
    );

    const inventoryFactory = new ethers.ContractFactory(
      LicenseInventory.abi,
      LicenseInventory.bytecode,
      this.provider.getSigner(indexOfAccount),
    );

    const ownershipFactory = new ethers.ContractFactory(
      LicenseOwnership.abi,
      LicenseOwnership.bytecode,
      this.provider.getSigner(indexOfAccount),
    );

    // TODO: ethers gasEstimation is waayyyy off - https://github.com/ethers-io/ethers.js/issues/194
    // const estimatedGas = await this.provider.estimateGas(factory.deploy)
    // let newGas = this.boostGas(estimatedGas);
    // newGas = ethers.utils.hexlify(Number(newGas));
    // const result = await factory.deploy({ gasLimit: newGas });

    const saleInstance = await saleFactory.deploy();
    const inventoryInstance = await inventoryFactory.deploy();
    const ownershipInstance = await ownershipFactory.deploy();

    // Have to await each contract's `deployed()` method to ensure that we don't proceed until
    // the contract deployment txs have actually been mined
    await Promise.all([
      saleInstance.deployed(),
      inventoryInstance.deployed(),
      ownershipInstance.deployed(),
    ])

    console.log('Sale Contract deployed to', saleInstance.address);
    console.log('Inventory Contract deployed to', inventoryInstance.address);
    console.log('Ownership Contract deployed to', ownershipInstance.address);

    await inventoryInstance.setSaleController(saleInstance.address)
    await saleInstance.setDAIContract(process.env.DAI_CONTRACT_ADDRESS)
    await saleInstance.setInventoryContract(inventoryInstance.address)
    await saleInstance.setOwnershipContract(ownershipInstance.address)
    await ownershipInstance.setSaleController(saleInstance.address)

    const result = {
      LicenseSale: saleInstance.address,
      LicenseInventory: inventoryInstance.address,
      LicenseOwnership: ownershipInstance.address,
    };

    console.log(result);
    return result;
  }

  async createProduct(id, price, inventory, address, contractAddress, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(LicenseInventory, contractAddress, indexOfAccount);
    const firstProduct = {
      id,
      price,
      initialInventory: inventory,
      supply: inventory,
      interval: 0,
    };

    // const estimatedGas = await this.provider.estimateGas(ContractInstance.createProduct);
    // console.log('estimateGas', estimatedGas)
    // // const estimatedGas = await this.provider.estimateGas(ContractInstance.createProduct(
    // //     firstProduct.id,
    // //     firstProduct.price,
    // //     firstProduct.initialInventory,
    // //     firstProduct.supply,
    // //     firstProduct.interval,
    // //   ));
    // const gas = this.boostGas(estimatedGas);

    const obj = await ContractInstance.createProduct(
      firstProduct.id,
      firstProduct.price,
      firstProduct.initialInventory,
      firstProduct.supply,
      firstProduct.interval,
    );

    let product = await ContractInstance.productInfo(firstProduct.id);
    product = this.normalizeProductValues(product);

    return Object.assign({ productId: id }, product);
  }

  async getOwnedProductIds(userEthAddress, contractAddresses, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(LicenseOwnership, contractAddresses.LicenseOwnership, indexOfAccount);
    const tokensOf = await ContractInstance.tokensOf(userEthAddress);
    const LicenseSaleInstance = this.initializeContractIfNotExist(LicenseSale, contractAddresses.LicenseSale, indexOfAccount);
    const asyncDataFetch = async () =>
      Promise.all(tokensOf.map(async tokenIndex => LicenseSaleInstance.licenseProductId(tokenIndex)));
    const productIds = await asyncDataFetch();
    return productIds.map(bn => bn.toNumber());
  }

  // should probably just call getProductIds and map through each calling the
  // new getProductInfoForContract function below... v2
  async getProductsForContract(contractAddress, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(LicenseInventory, contractAddress, indexOfAccount);
    let productIds = await ContractInstance.getAllProductIds();
    productIds = productIds.map(bn => bn.toNumber());

    const asyncDataFetch = async () =>
      Promise.all(productIds.map(async productId => ContractInstance.productInfo(productId)));

    let productData = await asyncDataFetch();
    productData = productData.map(pd => this.normalizeProductValues(pd));

    const asyncSoldDataFetch = async () =>
      Promise.all(productIds.map(async productId => ContractInstance.totalSold(productId)));

    let soldData = await asyncSoldDataFetch();
    soldData = soldData.map(bn => bn.toNumber());

    return {
      productIds,
      productData,
      soldData,
    };
  }

  async getProductInfoForContract(contractAddress, productId, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(LicenseInventory, contractAddress, indexOfAccount);

    let productData = await ContractInstance.productInfo(productId);
    productData = this.normalizeProductValues(productData);
    let soldData = await ContractInstance.totalSold(productId);
    soldData = soldData.toNumber();

    return {
      productData,
      soldData,
    };
  }

  async buyProduct(productId, address, contractAddresses, indexOfAccount) {
      console.log('ULC buyProduct ~>', { productId, address, contractAddresses, DAI: process.env.DAI_CONTRACT_ADDRESS, indexOfAccount })
    const LicenseInventoryInstance = this.initializeContractIfNotExist(LicenseInventory, contractAddresses.LicenseInventory, indexOfAccount);
    const productInfo = await LicenseInventoryInstance.productInfo(productId);
    console.log('ULC productInfo ~>', productInfo)

    const LicenseSaleInstance = this.initializeContractIfNotExist(LicenseSale, contractAddresses.LicenseSale, indexOfAccount);

    // TODO - Import ERC20
    const ERC20Instance = this.initializeContractIfNotExist(ERC20, process.env.DAI_CONTRACT_ADDRESS, indexOfAccount);
    await ERC20Instance.approve(LicenseSaleInstance.address, productInfo.price);
    const license = await LicenseSaleInstance.purchase(productId, 1, address, ZERO_ADDRESS);

    // const gas = this.boostGas(estimatedGas);
    // const license = await ContractInstance.purchase(productId, 1, address, ZERO_ADDRESS)
    // .sendTransaction({
    //   // gas,
    //   from: address,
    //   value: productInfo.price,
    // });

    // TODO: need to error handle
    return license.value.toNumber();
  }
}

export default UjoLicensing;

import Web3 from 'web3';
import BigNumber from 'bignumber.js';
import sigUtil from 'eth-sig-util';

import LicenseContract from './LicenseCore.json';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ethUtil = require('ethereumjs-util');

class UjoLicensing {
  constructor(opts) {
    // if (typeof opts !== 'object') throw new Error(constructorError);

    this.contractInstances = {};
    this.web3 = {};

    this.init();
    /**
     * Adds a 5% boost to the gas for web3 calls as to ensure tx's go through
     *
     * @param {string} estimatedGas amount of gas required from `estimateGas`
     */
    this.boostGas = estimatedGas => {
      const gasBoost = new BigNumber(estimatedGas, 10).div(new BigNumber('20')).floor();
      return new BigNumber(estimatedGas, 10).add(gasBoost).floor();
    };
    this.signData = (data, address) => this.web3.eth.sign(data, address);
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
  }

  init() {
    // const provider = (web3 !== undefined) ? web3.currentProvider : new Web3.providers.HttpProvider('http://127.0.0.1:8545');
    const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
    const web3Provider = new Web3(provider);
    // window.web3 = web3Provider;
    this.web3 = web3Provider;
  }

  initializeContractIfNotExist(contractAddress) {
    const inStorage = this.contractInstances[contractAddress];
    if (inStorage) return inStorage;
    const ContractInstance = new this.web3.eth.Contract(LicenseContract.abi, contractAddress);
    this.contractInstances[contractAddress] = ContractInstance;
    return this.contractInstances[contractAddress];
  }

  // ////////////////////////////////////
  // // lots of getters for contracts
  // // might be helpful for debugging later
  // ////////////////////////////////////
  // const productIds = await ContractInstance.methods.getAllProductIds().call();
  // console.log('getAllProductIds()', productIds);
  // const tokensOf = await ContractInstance.methods.tokensOf(address).call();
  // console.log('tokensOf(address)', tokensOf);
  // const balanceOf = await ContractInstance.methods.balanceOf(address).call();
  // console.log('balanceOf(address)', balanceOf);
  // const ownerOf = await ContractInstance.methods.ownerOf("0").call();
  // console.log('ownerOf("0")', ownerOf);
  // const licenseProductId = await ContractInstance.methods.licenseProductId("0").call();
  // console.log('licenseProductId("0")', licenseProductId);
  // ////////////////////////////////////

  async deployNewStore(address) {
    const abi = new this.web3.eth.Contract(LicenseContract.abi);
    const estimatedGas = await abi
      .deploy({
        data: LicenseContract.bytecode,
      })
      .estimateGas();

    console.log('Attempting to deploy from account', address);
    console.log('Gas', estimatedGas);

    const result = await new this.web3.eth.Contract(LicenseContract.abi)
      .deploy({ data: LicenseContract.bytecode })
      .send({ gas: this.boostGas(estimatedGas), from: address });
    console.log('Contract deployed to', result.options.address);

    return result.options.address;
  }

  async createProduct(id, price, inventory, address, contractAddress) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress);
    const firstProduct = {
      id,
      price,
      initialInventory: inventory,
      supply: inventory,
      interval: 0,
    };

    const estimatedGas = await ContractInstance.methods
      .createProduct(
        firstProduct.id,
        firstProduct.price,
        firstProduct.initialInventory,
        firstProduct.supply,
        firstProduct.interval,
      )
      .estimateGas({
        from: address,
      });

    const gas = this.boostGas(estimatedGas);
    const obj = await ContractInstance.methods
      .createProduct(
        firstProduct.id,
        firstProduct.price,
        firstProduct.initialInventory,
        firstProduct.supply,
        firstProduct.interval,
      )
      .send({
        gas,
        from: address,
        to: contractAddress,
      });

    const product = await ContractInstance.methods.productInfo(firstProduct.id).call();
    return Object.assign({ productId: id }, product);
  }

  async getOwnedProductIds(address, contractAddress) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress);
    const tokensOf = await ContractInstance.methods.tokensOf(address).call();
    const asyncDataFetch = async () =>
      Promise.all(tokensOf.map(async tokenIndex => ContractInstance.methods.licenseProductId(tokenIndex).call()));
    return asyncDataFetch();
  }

  async getProductsForContract(contractAddress) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress);
    const productIds = await ContractInstance.methods.getAllProductIds().call();
    console.log(productIds);

    const asyncDataFetch = async () =>
      Promise.all(productIds.map(async productId => ContractInstance.methods.productInfo(productId).call()));

    const productData = await asyncDataFetch();

    const asyncSoldDataFetch = async () =>
      Promise.all(productIds.map(async productId => ContractInstance.methods.totalSold(productId).call()));

    const soldData = await asyncSoldDataFetch();

    return {
      productIds,
      productData,
      soldData,
    };
  }

  async buyProduct(productId, address, contractAddress) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress);

    const productInfo = await ContractInstance.methods.productInfo(productId).call();
    console.log('productInfo', productInfo);
    const estimatedGas = await ContractInstance.methods.purchase(productId, 1, address, ZERO_ADDRESS).estimateGas({
      from: address,
      value: productInfo.price, // price
    });

    const gas = this.boostGas(estimatedGas);
    const license = await ContractInstance.methods.purchase(productId, 1, address, ZERO_ADDRESS).send({
      gas,
      from: address,
      value: productInfo.price,
    });

    // console.log('license', license);
    // console.log(license.events.LicenseIssued.returnValues.licenseId);

    // const owner = await ContractInstance.methods.ownerOf(license.events.LicenseIssued.returnValues.licenseId).call();
    // console.log('owner', owner);
    // TODO: need to error handle
    return license.events.LicenseIssued.returnValues.licenseId;
  }

}

export default UjoLicensing;
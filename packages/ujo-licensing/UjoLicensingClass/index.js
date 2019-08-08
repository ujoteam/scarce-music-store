import "@babel/polyfill";
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import sigUtil from 'eth-sig-util';

import LicenseContract from './LicenseCore.json';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ethUtil = require('ethereumjs-util');

class UjoLicensing {
  constructor(opts) {
    // TODO: pass in RPCProvicer
    // if (typeof opts !== 'object') throw new Error(constructorError);

    this.contractInstances = {};
    this.provider = {};

    this.init();
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
    })
  }

  init() {
    // const provider = (web3 !== undefined) ? web3.currentProvider : new Web3.providers.HttpProvider('http://127.0.0.1:8545');
    this.provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
  }

  initializeContractIfNotExist(contractAddress, indexOfAccount) {
    if (!this.contractInstances[indexOfAccount]) this.contractInstances[indexOfAccount] = {};
    const inStorage = this.contractInstances[indexOfAccount][contractAddress];
    if (inStorage) return inStorage;
    const ContractInstance = new ethers.Contract(contractAddress, LicenseContract.abi, this.provider.getSigner(indexOfAccount));
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

  async deployNewStore(address, indexOfAccount) {
    console.log('Attempting to deploy from account', address);
    const factory = new ethers.ContractFactory(LicenseContract.abi, LicenseContract.bytecode, this.provider.getSigner(indexOfAccount));

    // TODO: ethers gasEstimation is waayyyy off - https://github.com/ethers-io/ethers.js/issues/194
    // const estimatedGas = await this.provider.estimateGas(factory.deploy)
    // let newGas = this.boostGas(estimatedGas);
    // newGas = ethers.utils.hexlify(Number(newGas));
    // const result = await factory.deploy({ gasLimit: newGas });

    const result = await factory.deploy();
    console.log('Contract deployed to', result.address);
    return result.address;
  }

  async createProduct(id, price, inventory, address, contractAddress, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress, indexOfAccount);
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

    const obj = await ContractInstance.createProduct(firstProduct.id, firstProduct.price, firstProduct.initialInventory, firstProduct.supply, firstProduct.interval);

    let product = await ContractInstance.productInfo(firstProduct.id);
    product = this.normalizeProductValues(product)

    return Object.assign({ productId: id }, product);
  }

  async getOwnedProductIds(address, contractAddress, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress, indexOfAccount);
    const tokensOf = await ContractInstance.tokensOf(address);
    const asyncDataFetch = async () =>
      Promise.all(tokensOf.map(async tokenIndex => ContractInstance.licenseProductId(tokenIndex)));
    const productIds = await asyncDataFetch();
    return productIds.map(bn => bn.toNumber());
  }

  async getProductsForContract(contractAddress, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress, indexOfAccount);
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

  async buyProduct(productId, address, contractAddress, indexOfAccount) {
    const ContractInstance = this.initializeContractIfNotExist(contractAddress, indexOfAccount);
    const productInfo = await ContractInstance.productInfo(productId);
    const license = await ContractInstance.purchase(productId, 1, address, ZERO_ADDRESS, { value: productInfo.price });

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
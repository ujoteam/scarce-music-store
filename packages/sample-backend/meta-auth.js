const NodeCache = require('node-cache');
const ethUtil = require('ethereumjs-util');
const sigUtil = require('eth-sig-util');
const uuidv4 = require('uuid/v4');
const crypto = require('crypto');

const secret = uuidv4();
const cache = new NodeCache({
  stdTTL: 600,
});

// TODO - Make into a method
function recoverAddressFromSignedData(data, sig) {
  const msg = ethUtil.bufferToHex(Buffer.from(data, 'utf8'));
  const params = { data: msg, sig };
  let address;
  try {
    address = sigUtil.recoverPersonalSignature(params);
  } catch (e) {
    console.log(e);
    return false;
  }
  return address;
}

// TODO This currently was designed to use Typed Data when creating and checking te challenge but the format is incorrect
class MetaAuth {
  constructor(options) {
    return (req, res, next) => {
      const DEFAULT_OPTIONS = {
        signature: 'MetaSignature',
        message: 'MetaMessage',
        address: 'MetaAddress',
        banner: '*** WARNING *** Ask the site to change the default banner *** WARNING ***',
      };

      this.options = Object.assign(DEFAULT_OPTIONS, options);

      // Address param is passed & isValidAddress
      if (req.params[this.options.address]) {
        const address = req.params[this.options.address];

        if (ethUtil.isValidAddress(address)) {
          const challenge = this.createChallenge(address);
          const json = {
            challenge,
          };
          req.metaAuth = json;
        }
      }

      // Challenge message returned with signature
      if (req.params[this.options.message] && req.params[this.options.signature]) {
        const recovered = this.checkChallenge(req.params[this.options.message], req.params[this.options.signature]);
        const token = {
          recovered,
        };
        req.metaAuth = token;
      }

      next();
    };
  }

  createChallenge(address) {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(address + uuidv4())
      .digest('hex');

    cache.set(address.toLowerCase(), hash);

    const challenge = [
      {
        type: 'string',
        name: 'banner',
        value: this.options.banner,
      },
      {
        type: 'string',
        name: 'challenge',
        value: hash,
      },
    ];

    return challenge;
  }

  checkChallenge(challenge, sig) {
    const data = [
      {
        type: 'string',
        name: 'banner',
        value: this.options.banner,
      },
      {
        type: 'string',
        name: 'challenge',
        value: challenge,
      },
    ];

    const recovered = recoverAddressFromSignedData(challenge, sig);

    // TODO - Use ethSignTyped Data
    // const recovered = sigUtil.recoverTypedSignature({
    //   data,
    //   sig,
    // });

    const storedChallenge = cache.get(recovered.toString().toLowerCase());

    // TODO fix
    // if (storedChallenge === challenge) {
    //   cache.del(recovered);
    //   return recovered;
    // }

    // return false;
    return recovered;
  }
}

module.exports = MetaAuth;

const crypto = require('crypto');
const algo = 'aes-256-ctr';

export const encrypt = {
  encrypt(plainText, password) {
    let cipher = crypto.createCipher(algo, password);
    let crypted = cipher.update(plainText, 'utf8', 'hex');
    crypted += cipher.final('hex');

    return crypted;
  },
  decrypt(cryptedText, password) {
    let decipher = crypto.createDecipher(algo, password);
    let dec = decipher.update(cryptedText, 'hex', 'utf8');
    dec += decipher.final('utf8');

    let separated = dec.split(',');

    return { key: separated[0], secret: separated[1] };
  }
};

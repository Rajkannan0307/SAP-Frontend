import CryptoJS from 'crypto-js';

export const encryptSessionData = (data) => {
  const cipherText = CryptoJS.AES.encrypt(JSON.stringify(data), 'your-secret-key').toString();
  return cipherText;
};

export const decryptSessionData = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, 'your-secret-key');
  const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  return decryptedData;
};
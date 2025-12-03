const crypto = require('crypto');

/**
 * Encodes a Buffer to a Base64URL-safe string.
 * @param {Buffer} buf The buffer to encode.
 * @returns {string} The Base64URL encoded string.
 */
function toBase64Url(buf) {
    return buf.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

const header = {
    "typ": "JWT",
    "alg": "HS256"
};

const headerBase64Url = toBase64Url(Buffer.from(JSON.stringify(header)));

const nowInSeconds = Math.floor(Date.now() / 1000);

const payload = {
    iss: 'localhost',
    iat: nowInSeconds,
    exp: nowInSeconds + (60 * 60), // Expires in 1 hour
    acl: ['coordenador', 'participante'],
    username: 'Pedro Missola',
    email: 'missolapedro@gmail.com'
};

const payloadBase64Url = toBase64Url(Buffer.from(JSON.stringify(payload)));

const key = '.grin-morio.2223';
const signatureInput = `${headerBase64Url}.${payloadBase64Url}`;

const signature = crypto.createHmac('sha256', key)
    .update(signatureInput)
    .digest();

const signatureBase64Url = toBase64Url(signature);

const token = `${signatureInput}.${signatureBase64Url}`;

console.log(token);
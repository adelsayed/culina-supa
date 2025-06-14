const fs = require("fs");
const jwt = require("jsonwebtoken");

const privateKey = fs.readFileSync("./AuthKey_TD3W877T32.p8");

const token = jwt.sign(
  {
    iss: "B4K875YZF6",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 15777000, // 6 months
    aud: "https://appleid.apple.com",
    sub: "auth.adel.com.supabase.service" // your Client ID
  },
  privateKey,
  {
    algorithm: "ES256",
    keyid: "TD3W877T32"
  }
);

console.log(token);

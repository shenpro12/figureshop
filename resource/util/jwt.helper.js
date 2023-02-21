const jwt = require("jsonwebtoken");

let generateTokenLogin = (user, secretSignature, tokenLife) => {
  return new Promise((resolve, reject) => {
    // Định nghĩa những thông tin của user lưu vào token
    const userData = {
      ID: user.ID,
      userName: user.username ? user.username : user.userName,
      name: user.name,
      phone: user.phone,
      location: user.location,
      avatar: user.avatar,
    };
    // Ký và tạo token
    jwt.sign(
      { ...userData },
      secretSignature,
      {
        algorithm: "HS256",
        expiresIn: tokenLife,
      },
      (error, token) => {
        if (error) {
          return reject(error);
        }
        resolve(token);
      }
    );
  });
};

let generateTokenForPassword = (user, secretSignature, tokenLife) => {
  return new Promise((resolve, reject) => {
    // Định nghĩa những thông tin của user lưu vào token
    const userData = {
      ID: user.ID,
      userName: user.username,
    };
    // Ký và tạo token
    jwt.sign(
      { ...userData },
      secretSignature,
      {
        algorithm: "HS256",
        expiresIn: tokenLife,
      },
      (error, token) => {
        if (error) {
          return reject(error);
        }
        resolve(token);
      }
    );
  });
};

let verifyToken = (token, secretKey) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        return reject(error);
      }
      resolve(decoded);
    });
  });
};

module.exports = {
  generateTokenLogin: generateTokenLogin,
  generateTokenForPassword: generateTokenForPassword,
  verifyToken: verifyToken,
};

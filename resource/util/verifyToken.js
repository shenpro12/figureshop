const jwtHelper = require("./jwt.helper");
const queryHelper = require("./query.helper");
let verifyToken = async (req, res, next) => {
  if (req.cookies._token) {
    try {
      let decoded = await jwtHelper.verifyToken(
        req.cookies._token.token,
        process.env.SECRETSIG
      );
      req.userData = decoded;
      next();
    } catch {
      try {
        let decoded = await jwtHelper.verifyToken(
          req.cookies._token.refeshToken,
          process.env.SECRETSIG
        );
        let checkRftk = await queryHelper.query(
          "select * from user_refeshtoken where refeshtoken=? and userID=?",
          [req.cookies._token.refeshToken, decoded.ID]
        );
        if (checkRftk.length) {
          let token = await jwtHelper.generateTokenLogin(
            decoded,
            process.env.SECRETSIG,
            process.env.ACCESSTOKEN_LIFE
          );
          res.cookie(
            "_token",
            { token, refeshToken: req.cookies._token.refeshToken },
            {
              expires: new Date(Date.now() + 2592000000),
              httpOnly: true,
              secure: true,
            }
          );
          req.userData = decoded;
          next();
        } else {
          await queryHelper.query(
            "delete from user_refeshtoken where refeshtoken=?",
            [req.cookies._token.refeshToken]
          );
          res.clearCookie("_token");
          res.json({
            status: false,
            message: "Phiên đăng nhập hết hạn!",
            type: "login",
          });
        }
      } catch {
        await queryHelper.query(
          "delete from user_refeshtoken where refeshtoken=?",
          [req.cookies._token.refeshToken]
        );
        res.clearCookie("_token");
        res.json({
          status: false,
          message: "Phiên đăng nhập hết hạn!",
          type: "login",
        });
      }
    }
  } else {
    res.json({ status: false, message: "Vui lòng đăng nhập!", type: "login" });
  }
};

module.exports = {
  verifyToken: verifyToken,
};

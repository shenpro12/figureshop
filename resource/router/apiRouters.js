const express = require("express");
const apiControllers = require("../controllers/apiControllers");
const verifyToken = require("../util/verifyToken");
const route = express.Router();

route.get("/product/figures/category/:query", apiControllers.figures_category);
route.get("/product/category/:id/:count", apiControllers.category);
route.get("/product/image/:id", apiControllers.image);
route.get("/product/figures/:query", apiControllers.figures);

route.get("/pages/content/:slug", apiControllers.pageContent);

route.post(
  "/cart/checkouts",
  verifyToken.verifyToken,
  apiControllers.checkouts
);
route.post("/order", verifyToken.verifyToken, apiControllers.order);
route.post("/discount/code/verify", apiControllers.discountCode_verify);

route.post(
  "/account/order/product",
  verifyToken.verifyToken,
  apiControllers.orderProduct
);
route.post("/account/resetpassword/:token", apiControllers.onResetpassword);
route.get("/account/resetpassword/:token", apiControllers.resetpassword_get);
route.post("/account/resetpassword", apiControllers.resetpassword);
route.get("/account/logout", verifyToken.verifyToken, apiControllers.logout);
route.get(
  "/account/verifyLoginStatus",
  verifyToken.verifyToken,
  apiControllers.verifyLoginStatus
);
route.post("/account/login", apiControllers.login);
route.post("/account/sigin", apiControllers.sigin);
route.post(
  "/account/updateProfile",
  verifyToken.verifyToken,
  apiControllers.updateProfile
);
route.get("/account/order", verifyToken.verifyToken, apiControllers.userOrder);

route.get("/blogs/:type/:id", apiControllers.blogContent);
route.get("/blogs", apiControllers.blogs);

module.exports = route;

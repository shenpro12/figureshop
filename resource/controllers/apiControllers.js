const queryHelper = require("../util/query.helper");
const jwtHelper = require("../util/jwt.helper");
const checkStockHelper = require("../util/checkStock.helper");
const provincesHelper = require("../util/provinces.helper");
const mammoth = require("mammoth");
const bcrypt = require("bcrypt");
const nodeMailer = require("nodemailer");
const path = require("../../blog-files");
class apiControllers {
  //GET api/product/figures/:query
  async figures(req, res) {
    let data = [];
    if (req.params.query == "all") {
      data = await queryHelper.query("select * from figures", []);
    }
    setTimeout(() => {
      res.json(data);
    }, 0);
  }
  //GET api/product/figures/category/:query
  async figures_category(req, res) {
    let data = await queryHelper.query(
      "select product_category.product_id from product_category inner join categories on product_category.category_id=categories.ID and categories.name=?",
      [req.params.query]
    );
    setTimeout(() => {
      res.json(data);
    }, 0);
  }
  //GET api/product/category/:id/:count
  async category(req, res) {
    let data = await queryHelper.query(
      "select a.product_id from (select * from product_category where product_id=?) as b, product_category as a where b.category_id=a.category_id and a.product_id!=? group by product_id",
      [req.params.id, req.params.id]
    );
    setTimeout(() => {
      res.json(data.reverse().slice(0, req.params.count));
    }, 0);
  }
  //GET api/product/image/:id
  async image(req, res) {
    let data = await queryHelper.query(
      "select uri from product_img where product_id=?",
      [req.params.id]
    );
    setTimeout(() => {
      res.json({ data, productId: req.params.id });
    }, 0);
  }
  //POST api/account/login
  async login(req, res) {
    setTimeout(async () => {
      let data = await queryHelper.query(
        "select * from account where username=?",
        [req.body.userName]
      );
      if (data.length) {
        if (bcrypt.compareSync(req.body.password, data[0].password)) {
          let token = await jwtHelper.generateTokenLogin(
            data[0],
            process.env.SECRETSIG,
            process.env.ACCESSTOKEN_LIFE
          );
          let refeshToken = await jwtHelper.generateTokenLogin(
            data[0],
            process.env.SECRETSIG,
            process.env.REFESHTOKEN_LIFE
          );
          await queryHelper.query(
            "insert into user_refeshtoken(userID,refeshtoken,createdAt) values(?,?,?)",
            [data[0].ID, refeshToken, new Date().toUTCString()]
          );
          res.cookie(
            "_token",
            { token, refeshToken },
            {
              expires: new Date(Date.now() + 2592000000),
              httpOnly: true,
              secure: true,
            }
          );
          res.json({
            status: true,
            userProfile: {
              ID: data[0].ID,
              userName: data[0].username,
              name: data[0].name,
              phone: data[0].phone,
              location: data[0].location,
              avatar: data[0].avatar,
            },
          });
          return;
        }
      }
      res.json({ status: false, message: "Th??ng tin ????ng nh???p sai!" });
    }, 3000);
  }
  //GET api/account/logout
  async logout(req, res) {
    setTimeout(async () => {
      try {
        await queryHelper.query(
          "delete from user_refeshtoken where refeshtoken=?",
          [req.cookies._token.refeshToken]
        );
        res.clearCookie("_token");
        res.json({ status: true });
      } catch {
        res.json({ status: false });
      }
    }, 3000);
  }
  //GET api/account/verifyLoginStatus
  async verifyLoginStatus(req, res) {
    //console.log(req.userData);
    setTimeout(() => {
      res.json({
        status: true,
        userProfile: {
          ID: req.userData.ID,
          userName: req.userData.userName,
          name: req.userData.name,
          phone: req.userData.phone,
          location: req.userData.location,
          avatar: req.userData.avatar,
        },
      });
    }, 0);
  }
  //POST api/account/sigin
  async sigin(req, res) {
    setTimeout(async () => {
      if (
        req.body.userName &&
        req.body.name &&
        req.body.password &&
        req.body.location &&
        req.body.phone
      ) {
        //check email
        if (!/^[A-Za-z0-9]{6,30}@gmail.com$/g.test(req.body.userName)) {
          res.json({
            status: false,
            message: "Email kh??ng h???p l???!",
          });
          return;
        }
        let user = await queryHelper.query(
          "select * from account where username=?",
          [req.body.userName]
        );
        if (user.length) {
          res.json({
            status: false,
            message: "Email ???? ???????c ????ng k??!",
          });
          return;
        }
        //check password
        if (
          !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/g.test(
            req.body.password
          )
        ) {
          res.json({
            status: false,
            message:
              "M???t kh???u ph???i c?? ????? d??i t???i thi???u 8 k?? t???, bao g???m s???, ch??? v?? 1 k?? t??? ?????c bi???t!",
          });
          return;
        }
        //check phone number
        if (
          !/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/g.test(
            req.body.phone
          )
        ) {
          res.json({
            status: false,
            message: "S??? ??i???n tho???i kh??ng h???p l???!",
          });
          return;
        }
        //pass all test case and create account
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);
        await queryHelper.query(
          "insert into account(username,password,name,phone,location,avatar) values(?,?,?,?,?,?)",
          [
            req.body.userName,
            hash,
            req.body.name,
            req.body.phone,
            req.body.location,
            "https://res.cloudinary.com/drdnqwdzd/image/upload/v1676940887/pngwing.com_4_asfzvw_dkguvn.png",
          ]
        );
        res.json({ status: true, message: "????ng k?? th??nh c??ng!" });
      } else {
        res.json({ status: false, message: "Vui l??ng nh???p ?????y ????? th??ng tin!" });
      }
    }, 3000);
  }
  //POST api/account/resetpassword
  async resetpassword(req, res) {
    setTimeout(async () => {
      if (!req.body.userName) {
        res.json({
          status: false,
          message: "Vui l??ng nh???p ?????y ????? th??ng tin!!",
        });
        return;
      }
      let user = await queryHelper.query(
        "select * from account where username=?",
        [req.body.userName]
      );
      if (user.length) {
        let token = await jwtHelper.generateTokenForPassword(
          user[0],
          process.env.SECRETSIG,
          process.env.PASSWORDTOKEN_LIFE
        );
        //
        let link = `${process.env.REQUEST_HOST}/api/account/resetpassword/${token}`;
        let transporter = nodeMailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
          },
        });

        let mailOptions = {
          from: process.env.EMAIL,
          to: req.body.userName,
          subject: "C???p nh???t m???t kh???u t??i kho???n FIgureShop",
          html: `<div
    style="
      width: max-content;
      text-align: center;
      padding: 60px 40px 5px 40px;
      margin: 0px auto;
      background: url('https://res.cloudinary.com/drdnqwdzd/image/upload/v1676940886/home_collection_1_banner_m4yzeq.webp')
        rgba(0, 0, 0, 0.9);
      background-size: cover;
      background-blend-mode: multiply;
      border-radius: 10px
    "
  >
    <img
      src="https://res.cloudinary.com/drdnqwdzd/image/upload/v1676940885/fslogo_ac9eoy.png"
      style="width: 70px; height: 70px; margin: 0px auto"
    />
    <h1
      style="
        margin-top: 20px;
        font-weight: 600;
        text-transform: uppercase;
        color: white;
      "
    >
      C???p nh???t m???t kh???u m???i
    </h1>
    <a
      href="${link}"
      style="
        margin-top: 50px;
        margin-bottom: 50px;
        color: red;
        display: block;
        font-size: 18px;
        text-decoration: none;
        font-weight: 700;
      "
      >Nh???n v??o ?????y ????? c???p nh???t m???t kh???u!</a
    >
    <p
      style="
        font-weight: 600;
        margin-bottom: 10px;
        color: white;
        font-size: 18px;
      "
    >
      Ch??m s??c kh??ch h??ng
    </p>
    <p
      style="
        font-weight: 600;
        color: rgba(255, 255, 255, 0.489);
        font-size: 17px;
        margin: 5px 0px;
      "
    >
      Phone:
      <span style="font-weight: 400; color: rgb(255, 255, 255)"
        >0362624976</span
      >
    </p>
    <p
      style="
        font-weight: 600;
        color: rgba(255, 255, 255, 0.489);
        font-size: 17px;
        margin: 5px 0px;
      "
    >
      Email:
      <span style="font-weight: 400; color: rgb(255, 255, 255)"
        >support.figureshop@gmail.com</span
      >
    </p>
    <p style="margin-top: 70px;margin-bottom:30px;color: rgba(255, 255, 255, 0.4)">
      N???u b???n kh??ng ph???i ng?????i g???i y??u c???u n??y, vui l??ng b??? qua tin nh???n!
    </p>
    <p
      style="margin-top: 30px; color: rgba(255, 255, 255, 0.4); font-size: 12px"
    >
      Copyright ?? 2022
      <span>Figure Shop. Powered by LEVANDAT</span>
    </p>
  </div>`,
        };

        transporter.sendMail(mailOptions, async function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);
            await queryHelper.query("insert into token(token) values(?)", [
              token,
            ]);
          }
        });
        //

        //
        res.json({
          status: true,
          message: "Vui l??ng ki???m tra Email ????? c???p nh???t m???t kh???u!",
        });
      } else {
        res.json({
          status: false,
          message: "T??i kho???n kh??ng t???n t???i!",
        });
      }
    }, 3000);
  }
  //GET api/account/resetpassword/:token
  async resetpassword_get(req, res) {
    try {
      let decoded = await jwtHelper.verifyToken(
        req.params.token,
        process.env.SECRETSIG
      );
      let token = await queryHelper.query("select * from token where token=?", [
        req.params.token,
      ]);
      if (token.length) {
        res.render("resetPassword", {
          token: req.params.token,
        });
      } else {
        res.render("fail", {
          token: req.params.token,
        });
      }
    } catch {
      await queryHelper.query("delete from token where token=?", [
        req.params.token,
      ]);
      res.render("fail", {
        token: req.params.token,
      });
    }
  }
  //POST api/account/resetpassword/:token
  async onResetpassword(req, res) {
    if (!req.body.password && !req.body.repeatPassword) {
      res.render("resetPassword", {
        token: req.params.token,
        status: "Vui l??ng nh???p ?????y ????? th??ng tin!",
      });
      return;
    }
    if (req.body.password != req.body.repeatPassword) {
      res.render("resetPassword", {
        token: req.params.token,
        status: "M???t kh???u kh??ng kh???p!",
      });
      return;
    }
    try {
      let decoded = await jwtHelper.verifyToken(
        req.params.token,
        process.env.SECRETSIG
      );
      let token = await queryHelper.query("select * from token where token=?", [
        req.params.token,
      ]);
      if (token.length) {
        if (
          !/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/g.test(
            req.body.password
          )
        ) {
          res.render("resetPassword", {
            token: req.params.token,
            status:
              "M???t kh???u ph???i c?? ????? d??i t???i thi???u 8 k?? t???, bao g???m s???, ch??? v?? 1 k?? t??? ?????c bi???t!",
          });
        } else {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync(req.body.password, salt);
          await queryHelper.query(
            "update account set password=? where username=?",
            [hash, decoded.userName]
          );
          await queryHelper.query("delete from token where token=?", [
            req.params.token,
          ]);
          res.render("success");
        }
      } else {
        res.render("fail");
      }
    } catch {
      await queryHelper.query("delete from token where token=?", [
        req.params.token,
      ]);
      res.render("fail");
    }
  }
  //POST api/account/updateProfile
  async updateProfile(req, res) {
    setTimeout(async () => {
      if (
        req.body.profile.name &&
        req.body.profile.phone &&
        req.body.profile.location
      ) {
        await queryHelper.query(
          "update account set name=?, phone=?, location=? where ID=?",
          [
            req.body.profile.name,
            req.body.profile.phone,
            req.body.profile.location,
            req.userData.ID,
          ]
        );
        //generate token
        // 1. delete refeshToken in database
        await queryHelper.query(
          "delete from user_refeshtoken where refeshtoken=?",
          [req.cookies._token.refeshToken]
        );
        res.clearCookie("_token");
        // 2. generate new token
        let userData = {
          ID: req.userData.ID,
          userName: req.userData.userName,
          name: req.body.profile.name,
          phone: req.body.profile.phone,
          location: req.body.profile.location,
          avatar: req.userData.avatar,
        };
        let token = await jwtHelper.generateTokenLogin(
          userData,
          process.env.SECRETSIG,
          process.env.ACCESSTOKEN_LIFE
        );
        let refeshToken = await jwtHelper.generateTokenLogin(
          userData,
          process.env.SECRETSIG,
          process.env.REFESHTOKEN_LIFE
        );
        await queryHelper.query(
          "insert into user_refeshtoken(userID,refeshtoken,createdAt) values(?,?,?)",
          [userData.ID, refeshToken, new Date().toUTCString()]
        );
        res.cookie(
          "_token",
          { token, refeshToken },
          {
            expires: new Date(Date.now() + 2592000000),
            httpOnly: true,
            secure: true,
          }
        );
        //
        res.json({ status: true, message: "Thay ?????i th??nh c??ng!" });
      } else {
        res.json({
          status: true,
          message: "Kh??ng ????? th??ng tin tr???ng khi c??p nh???t!",
        });
      }
    }, 0);
  }
  //POST api/cart/checkouts
  checkouts(req, res) {
    setTimeout(async () => {
      if (req.body.cart && req.body.cart.length) {
        let data = await checkStockHelper.checkStock(req.body.cart);
        res.json(data);
      } else {
        res.json({ status: false });
      }
    }, 0);
  }
  //POST api/order
  async order(req, res) {
    let orderData = req.body.orderInfo;
    //console.log(req.userData);
    if (
      orderData &&
      orderData.fullName &&
      orderData.phone &&
      orderData.location &&
      orderData.province &&
      orderData.district &&
      orderData.ward &&
      orderData.shippingMethod &&
      orderData.paymentMethod &&
      orderData.productDetail.length
    ) {
      let data = await await checkStockHelper.checkStock(
        orderData.productDetail
      );
      if (data.status) {
        //insert order to database//
        // 1.get product by cartData
        let productList = await queryHelper.query(
          `select * from figures where ID in (${orderData.productDetail.map(
            (item) => {
              return "?";
            }
          )})`,
          orderData.productDetail.map((i) => i.productId)
        );
        //
        for (let i = 0; i < productList.length; i++) {
          let category = await queryHelper.query(
            "select * from product_category where product_id=? and category_id=5",
            [productList[i].ID]
          );
          if (category.length && orderData.paymentMethod == "COD") {
            res.json({
              status: false,
              message:
                "C??c s???n ph???m c???n ?????t tr?????c kh??ng h??? tr??? ph????ng th???c thanh to??n COD. Vui l??ng l???a ch???n ph????ng th???c thanh to??n kh??c!",
            });
            return;
          }
        }
        // 2.caculate price by cartData
        let totalPrice = 0;
        productList.map((item) => {
          let total = orderData.productDetail.find(
            (i) => i.productId == item.ID
          ).total;
          totalPrice =
            totalPrice + item.price * ((100 - item.discount) / 100) * total;
        });
        // 3.reCaculate price via shippingMethod
        if (orderData.shippingMethod == "DELIVERY" && totalPrice < 1000000) {
          let provinceData = provincesHelper.getProvinceCode(
            orderData.province
          );
          if (provinceData) {
            if (provinceData.code > 50) {
              totalPrice += 40000;
            } else {
              totalPrice += 60000;
            }
          } else {
            res.json({
              status: false,
              message: "C?? l???i trong qu?? tr??nh ki???m tra!",
            });
            return;
          }
        }
        // 4.reCaculate price via discountCode
        if (orderData.discount) {
          let now = Date.now();
          let codeInfo = await queryHelper.query(
            "select * from discount_code where code=?",
            [orderData.discount]
          );
          if (codeInfo.length && parseInt(codeInfo[0].dueDate) > now) {
            totalPrice -= codeInfo[0].discount;
          }
        }
        //
        let insertOrder = await queryHelper.query(
          `insert into orders(userID, name, phone, location, province, ward, district, shippingMethod, paymentMethod, discountCode, totalPrice, createdAt, status, rejectInfo) values(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.userData.ID,
            orderData.fullName,
            orderData.phone,
            orderData.location,
            orderData.province,
            orderData.ward,
            orderData.district,
            orderData.shippingMethod,
            orderData.paymentMethod,
            orderData.discount,
            totalPrice,
            Date.now(),
            "pending",
            "",
          ]
        );
        //insert cart info
        await queryHelper.query(
          "insert into order_product(order_id, product_id, total) values ?",
          [
            orderData.productDetail.map((i) => [
              insertOrder.insertId,
              i.productId,
              i.total,
            ]),
          ]
        );
        //response
        res.json({ status: true, orderId: insertOrder.insertId });
      } else {
        res.json({ status: false, cartData: data.cartData });
      }
    } else {
      res.json({ status: false, message: "Vui l??ng ??i???n ?????y ????? th??ng tin!" });
    }
  }
  //POST api/discount/code/verify
  discountCode_verify(req, res) {
    setTimeout(async () => {
      let now = Date.now();
      let codeInfo = await queryHelper.query(
        "select * from discount_code where code=?",
        [req.body.discountCode]
      );
      if (codeInfo.length) {
        if (parseInt(codeInfo[0].dueDate) > now) {
          res.json({
            status: true,
            discount: codeInfo[0].discount,
          });
        } else {
          res.json({ status: false, message: "M?? h???t h???n!" });
        }
      } else {
        res.json({ status: false, message: "M?? kh??ng t???n t???i!" });
      }
    }, 0);
  }
  //GET api/account/order
  userOrder(req, res) {
    setTimeout(async () => {
      let data = await queryHelper.query(
        "select * from orders where userID=?",
        [req.userData.ID]
      );
      res.json({ status: true, orders: data.reverse() });
    }, 0);
  }
  //POST api/account/order/product
  orderProduct(req, res) {
    setTimeout(async () => {
      if (req.body.orderId) {
        let data = await queryHelper.query(
          "SELECT * FROM order_product as a inner join figures as b on a.product_id=b.ID where a.order_id=?",
          [req.body.orderId]
        );
        res.json({ status: true, productData: data });
      } else {
        res.json({ staus: false, message: "error" });
      }
    }, 0);
  }
  //GET api/pages/content
  async pageContent(req, res) {
    setTimeout(async () => {
      if (req.params.slug) {
        let data = await queryHelper.query(
          "select * from pages where LOWER(slug)=?",
          [req.params.slug.toLowerCase()]
        );
        if (data.length) {
          mammoth
            .convertToHtml({
              path: path.getFilePath(data[0].contentFile, "pages"),
            })
            .then(function (result) {
              res.json({
                status: true,
                html: result.value,
                title: data[0].title,
                description: data[0].description,
              });
            })
            .catch(function (err) {
              res.json({ status: false, message: err });
            })
            .done();
        } else {
          res.json({ status: false, message: "no data" });
        }
      } else {
        res.json({ status: false, message: "no data" });
      }
    }, 0);
  }
  //GET api/blogs
  async blogs(req, res) {
    let data = await queryHelper.query("select * from blogs", []);
    res.json({
      status: true,
      data: data
        .map((i) => ({
          ID: i.ID,
          title: i.title,
          description: i.description,
          createdAt: i.createdAt,
          thumb_url: i.thumb_url,
          type: i.type,
        }))
        .reverse(),
    });
  }
  //GET api/blogs/:id
  async blogContent(req, res) {
    setTimeout(async () => {
      if (req.params.id && req.params.type) {
        let data = await queryHelper.query(
          "select * from blogs where ID=? and type=?",
          [req.params.id, req.params.type]
        );
        //console.log(data);
        if (data.length) {
          mammoth
            .convertToHtml({
              path: path.getFilePath(data[0].contentFile, "blogs"),
            })
            .then(function (result) {
              res.json({
                status: true,
                html: result.value,
                title: data[0].title,
                type: data[0].type,
                createdAt: data[0].createdAt,
                description: data[0].description,
              });
            })
            .catch(function (err) {
              res.json({ status: false, message: err });
            })
            .done();
        } else {
          res.json({ status: false, message: "no data" });
        }
      } else {
        res.json({ status: false, message: "no data" });
      }
    }, 0);
  }
}
module.exports = new apiControllers();

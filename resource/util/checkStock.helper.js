const queryHelper = require("../util/query.helper");
class checkStockHelper {
  async checkStock(cartList) {
    let temp = cartList.map((item) => {
      return "?";
    });

    let sql = `select a.ID, a.product_id, a.stock, a.booked, case (select b.category_id from product_category as b where b.product_id=a.product_id and b.category_id=5) when 5 then 1 else 0 end as orther from stock as a where a.product_id in (${temp})`;
    let data = await queryHelper.query(
      sql,
      cartList.map((i) => i.productId)
    );
    let status = true;
    let cartData = [];

    if (data && data.length) {
      cartData = cartList.map((i) => {
        let stock = data.find((item) => item.product_id == i.productId);
        if (stock.orther) {
          return {
            exceeding: 0,
            productId: i.productId,
          };
        } else {
          if (stock.booked + i.total > stock.stock) {
            status = false;
            return {
              exceeding: stock.booked + i.total - stock.stock,
              productId: i.productId,
            };
          } else {
            return {
              exceeding: 0,
              productId: i.productId,
            };
          }
        }
      });
    }
    return { status, cartData };
  }
}
module.exports = new checkStockHelper();

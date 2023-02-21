const db = require("../../config/db");
class queryHelper {
  query(query, option) {
    return new Promise((resolve) => {
      db.query(query, option.length ? option : [], (err, results) => {
        if (err) {
          resolve({ status: false });
        } else {
          resolve(results);
        }
      });
    });
  }
}
module.exports = new queryHelper();

const apiRoutes = require("./apiRouters");
function route(app) {
  app.use("/api", apiRoutes);
}
module.exports = route;

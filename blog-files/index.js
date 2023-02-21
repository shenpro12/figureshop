class Path {
  getFilePath(name, route) {
    return __dirname + `/${route}/` + name;
  }
}
module.exports = new Path();

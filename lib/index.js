'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AdmZip = require('adm-zip');
var fs = require('fs');
var path = require('path');
var rp = require('request-promise');

function getFiles(outputPath, fileNames) {
  return fileNames.map(function (fileName) {
    return path.join(outputPath, fileName);
  });
}

var FilePushWebpackPlugin = function () {
  function FilePushWebpackPlugin(_ref) {
    var _ref$regex = _ref.regex,
        regex = _ref$regex === undefined ? null : _ref$regex,
        _ref$shouldRemoveFile = _ref.shouldRemoveFiles,
        shouldRemoveFiles = _ref$shouldRemoveFile === undefined ? true : _ref$shouldRemoveFile,
        _ref$url = _ref.url,
        url = _ref$url === undefined ? null : _ref$url,
        _ref$zipFileName = _ref.zipFileName,
        zipFileName = _ref$zipFileName === undefined ? 'temp.zip' : _ref$zipFileName,
        _ref$success = _ref.success,
        success = _ref$success === undefined ? null : _ref$success,
        _ref$fail = _ref.fail,
        fail = _ref$fail === undefined ? null : _ref$fail;

    _classCallCheck(this, FilePushWebpackPlugin);

    if (!url) {
      throw Error('url must not be null');
    }
    this.url = url;
    this.regex = regex;
    this.shouldRemoveFiles = shouldRemoveFiles;
    this.success = success;
    this.fail = fail;
    this.zipFileName = zipFileName;
  }

  _createClass(FilePushWebpackPlugin, [{
    key: 'apply',
    value: function apply(compiler) {
      var _this = this;

      this.outputPath = compiler.options.output.path;
      compiler.plugin('after-emit', function (compilation, callback) {
        var files = getFiles(_this.outputPath, Object.keys(compilation.assets));
        _this.makeZip(files);
        _this.push();
        if (_this.shouldRemoveFiles) {
          _this.deleteLocalFiles(files);
        }
        callback();
      });
    }
  }, {
    key: 'makeZip',
    value: function makeZip(files) {
      var zip = new AdmZip();
      // zip the files
      this.searchLocalFiles(files).forEach(function (file) {
        return zip.addLocalFile(file);
      });
      zip.writeZip(path.join(this.outputPath, this.zipFileName));
    }
  }, {
    key: 'push',
    value: function push() {
      var _this2 = this;

      var formData = {
        zipFile: fs.createReadStream(path.join(this.outputPath, this.zipFileName))
      };
      var option = {
        method: 'POST',
        uri: this.url,
        formData: formData
      };
      rp.post(option).then(function (res) {
        if (_this2.success) {
          _this2.success(res);
        }
      }).catch(function (err) {
        if (_this2.fail) {
          _this2.fail(err);
        }
      }).finally(function () {
        fs.unlinkSync(path.join(_this2.outputPath, _this2.zipFileName));
      });
    }
  }, {
    key: 'deleteLocalFiles',
    value: function deleteLocalFiles(files) {
      this.searchLocalFiles(files).forEach(fs.unlinkSync);
    }
  }, {
    key: 'searchLocalFiles',
    value: function searchLocalFiles(files) {
      var _this3 = this;

      return files.filter(function (assetKey) {
        if (_this3.regex) {
          return _this3.regex.test(assetKey);
        }
        return true;
      });
    }
  }]);

  return FilePushWebpackPlugin;
}();

module.exports = FilePushWebpackPlugin;
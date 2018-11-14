const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');

function getFiles(outputPath, fileNames) {
  return fileNames.map(fileName => path.join(outputPath, fileName));
}

class FilePushWebpackPlugin {
  constructor({
    // find files with a regex
    regex = null,
    // delete certain files after uploading zip-file
    shouldRemoveFiles = true,
    // the url which your zip-file will be sent to
    url = null,
    // zip-file name for upload
    zipFileName = 'temp.zip',
    // success callback
    success = null,
    // error callback,
    fail = null,
  }) {
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

  apply(compiler) {
    this.outputPath = compiler.options.output.path;
    compiler.plugin('after-emit', (compilation, callback) => {
      const files = getFiles(this.outputPath, Object.keys(compilation.assets));
      this.makeZip(files);
      this.push();
      if (this.shouldRemoveFiles) {
        this.deleteLocalFiles(files);
      }
      callback();
    });
  }

  makeZip(files) {
    const zip = new AdmZip();
    // zip the files
    this.searchLocalFiles(files)
      .forEach(file => zip.addLocalFile(file));
    zip.writeZip(path.join(this.outputPath, this.zipFileName));
  }

  push() {
    const formData = {
      zipFile: fs.createReadStream(path.join(this.outputPath, this.zipFileName)),
    };
    const option = {
      method: 'POST',
      uri: this.url,
      formData,
    };
    rp.post(option).then((res) => {
      if (this.success) {
        this.success(res);
      }
    }).catch((err) => {
      if (this.fail) {
        this.fail(err);
      }
    }).finally(() => {
      fs.unlinkSync(path.join(this.outputPath, this.zipFileName));
    });
  }

  deleteLocalFiles(files) {
    this.searchLocalFiles(files).forEach(fs.unlinkSync);
  }

  searchLocalFiles(files) {
    return (
      files.filter((assetKey) => {
        if (this.regex) {
          return this.regex.test(assetKey);
        }
        return true;
      })
    );
  }
}

module.exports = FilePushWebpackPlugin;

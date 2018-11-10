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
    // delete certain files after writing zip
    shouldRemoveFiles = true,
    // the url which your zip file will be sent to
    url = null,
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
  }

  apply(compiler) {
    const outputPath = compiler.options.output.path;
    compiler.plugin('after-emit', (compilation, callback) => {
      const files = getFiles(outputPath, Object.keys(compilation.assets));
      this.push(this.makeZip(files));
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
    return zip.toBuffer();
  }

  push(zipBuffer) {
    const option = {
      method: 'POST',
      uri: this.url,
      formData: {
        zipBuffer,
      },
    };
    rp.post(option).then((res) => {
      if (this.success) {
        this.success(res);
      }
    }).catch((err) => {
      if (this.fail) {
        this.fail(err);
      }
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

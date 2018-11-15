const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const rp = require('request-promise');

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
    // delete the temp zip-file
    deleteZipFile = true,
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
    this.deleteZipFile = deleteZipFile;
  }

  apply(compiler) {
    this.outputPath = compiler.options.output.path;
    compiler.plugin('after-emit', (compilation, callback) => {
      this.files = this.searchLocalFiles(this.outputPath, Object.keys(compilation.assets));
      this.makeZip();
      this.push();
      callback();
    });
  }

  makeZip() {
    const zip = new AdmZip();
    // zip the files
    this.files.forEach(file => zip.addLocalFile(file));
    zip.writeZip(path.join(this.outputPath, this.zipFileName));
  }

  push() {
    const zipPath = path.join(this.outputPath, this.zipFileName);
    const formData = {
      zipFile: fs.createReadStream(zipPath),
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
      if (this.deleteZipFile) {
        fs.unlinkSync(zipPath);
      }
      if (this.shouldRemoveFiles) {
        this.files.forEach(fs.unlinkSync);
      }
    });
  }

  searchLocalFiles(outputPath, fileNames) {
    return (
      fileNames.map(fileName => path.join(outputPath, fileName))
        .filter((assetKey) => {
          if (this.regex) {
            return this.regex.test(assetKey);
          }
          return true;
        })
    );
  }
}

module.exports = FilePushWebpackPlugin;

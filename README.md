This is webpack plugin for sending a zip file to server.

# Usage
## Example
```javascript
module.export = {
  ...
  plugins: [
    ...
    new FilePushWebpackPlugin({
      url: 'the url you want to send the zip',
      regex: /.*\.map$/,
      shouldRemoveFiles: true,
    }),
  ]
}
```
## Accepting Params
| param | detail | default value |
| :------------ | :------------- | :-------------: |
| regex | find files with a regex. | null |
| shouldRemoveFiles | delete certain files after uploading zip-file | true |
| url | the url which your zip-file will be sent to | null |
| zipFileName | name for zip file | temp.zip |
| success | success callback | null |
| fail | error callback | null |

## For Koa user
If you use koa as your node server, the example below may help you to get the zip-file.

Maybe you use [koa-body](https://github.com/dlau/koa-body) or others lib that can parse formdata.
And, you may need a tool to decompress your zip. I recommend the [adm-zip](https://github.com/cthackers/adm-zip) for your first choice.

I assume that you use `koa-body` and `adm-zip`.
```javascript
const router = require('koa-router')();
const koaBody = require('koa-body');
const fs = require('fs');
const admZip = require('adm-zip');

router.post('/xxx', koaBody({
  multipart: true,
  formidable: {
      maxFileSize: 2000*1024*1024,	// you decide
  }
}), async (ctx) => {
  // This Plugin will send the file with name 'zipFile'
  const { zipFile } = ctx.request.files;
  if (!zipFile) {
    throw Error('no zip');
  }
  try {
    const [filename] = zipFile.name.split('.');
    const zip = new admZip(zipFile.path);
    const dir = `./${filename}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    zip.extractAllTo(dir);
  } catch (e) {
    console.log(e);
  }
});
```

## For Express user
```javascript
const multipart = require('connect-multiparty');
const multipartMiddleware = multipart();
app.use('/xxx', multipartMiddleware, function(req, res) {
  const { zipFile } = req.files;
  if (!zipFile) {
    throw Error('no zip');
  }
  try {
    const { path: filePath, originalFilename } = zipFile;
    const [filename] = originalFilename.split('.');
    const zip = new admZip(filePath);
    const dir = path.join(__dirname, `${filename}`);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    zip.extractAllTo(dir);
    fs.unlinkSync(filePath);
  } catch (e) {
    console.log(e);
  }
  res.end();
});
```
# License
MIT.
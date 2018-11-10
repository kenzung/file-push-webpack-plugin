This is webpack plugin for sending a zip file to server.

# Usage
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

# License
MIT.
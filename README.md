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
| param | explaination | default value |
| :------------ | :------------- | :-------------: |
| regex | find files with a regex. | null |
| shouldRemoveFiles | delete certain files after uploading zip-file | true |
| url | the url which your zip-file will be sent to | null |
| success | success callback | null |
| fail | error callback | null |

# License
MIT.
// from here: https://github.com/Stuk/jszip-utils/blob/617af1d87590bc7087deb71fb3bbcec511d99078/lib/index.js
const getBinaryContent = (path, jwt, callback) => {
  /*
   * Here is the tricky part : getting the data.
   * In firefox/chrome/opera/... setting the mimeType to 'text/plain; charset=x-user-defined'
   * is enough, the result is in the standard xhr.responseText.
   * cf https://developer.mozilla.org/En/XMLHttpRequest/Using_XMLHttpRequest#Receiving_binary_data_in_older_browsers
   * In IE <= 9, we must use (the IE only) attribute responseBody
   * (for binary data, its content is different from responseText).
   * In IE 10, the 'charset=x-user-defined' trick doesn't work, only the
   * responseType will work :
   * http://msdn.microsoft.com/en-us/library/ie/hh673569%28v=vs.85%29.aspx#Binary_Object_upload_and_download
   *
   * I'd like to use jQuery to avoid this XHR madness, but it doesn't support
   * the responseType attribute : http://bugs.jquery.com/ticket/11461
   */
  try {
    const xhr = new window.XMLHttpRequest();

    xhr.open('GET', path, true);
    xhr.setRequestHeader('Authorization', `Bearer ${jwt}`)

    // recent browsers
    if ('responseType' in xhr) xhr.responseType = 'arraybuffer';
    // older browser
    if (xhr.overrideMimeType) xhr.overrideMimeType('text/plain; charset=x-user-defined');

    xhr.onreadystatechange = () => {
      let file;
      let err;
      // use `xhr` and not `this`... thanks IE
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          file = null;
          err = null;
          try {
            file = xhr.response || xhr.responseText;
          } catch (e) {
            err = new Error(e);
          }
          callback(err, file);
        } else {
          callback(new Error(`Ajax error for ${path} : ${this.status} ${this.statusText}`), null);
        }
      }
    };

    xhr.send();
  } catch (e) {
    callback(new Error(e), null);
  }
};

export default getBinaryContent;

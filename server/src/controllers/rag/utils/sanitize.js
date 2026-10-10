const re = /[^{\w\-\.}]/g;
function sanitizeFilename(filename) {
  return filename.replace(re, '_');
}

module.exports = { sanitizeFilename };
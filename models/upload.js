// Require the cloudinary library
const cloudinary = require('cloudinary').v2;

// Return "https" URLs by setting secure: true
cloudinary.config({
  cloud_name : 'diidlkybw',
  api_key : '729274545484816',
  api_secret : '88RjUYgLTSFcGq2ZOMddmRzn1vo'
});

// Log the configuration
console.log(cloudinary.config());

/////////////////////////
// Uploads an image file
/////////////////////////
const uploadFile = async (imagePath) => {

    try {
      // Upload the image
      const result = await cloudinary.uploader.upload(imagePath);
      console.log(result);
      return result;
    } catch (error) {
      console.log(error.message);
    }
};

module.exports = {
    uploadFile
}
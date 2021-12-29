const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const dotenv = require('dotenv');
var fs = require('fs');
 dotenv.config();
var s3
(async ()=>{
 // const keys=(await vault.nodevault.read('/CanvasDevops/data/AWS')).data.data
   aws.config.update({
    secretAccessKey: process.env.AWS_S3_SECRETACCESSKEY,
    accessKeyId: process.env.AWS_S3_ACCESSKEYID,
    region:  process.env.AWS_S3_REGION
  });
 s3 = new aws.S3();
const upload = multer({
  storage: multerS3({
    s3,
    bucket: 'canvas-devops-dev/kedb',
    key: function (req, file, cb) {
      req.file = file.originalname;
      cb(null, file.originalname);
    }
  })
}).single('image');
module.exports.upload = upload;
})()
module.exports.downloadd= async(filename)=> {
 // console.log("filenamee", filename);
  const { Body } = await s3.getObject({
    Key: filename,
    Bucket: 'canvas-devops-dev/kedb'
  }).promise()
  
  return Body
};
module.exports.del = async (filename)=> {
  const { Body } = await s3.deleteObject({
    Key: filename ,
    Bucket: 'canvas-devops-dev/kedb'  
  }).promise()
  return Body
};
import multer from "multer";
import fs from "fs";
import path from "path";


const tempDir = path.join("public", "temp");

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, tempDir)
  },
  filename: function(req, file, cb){
    cb(null, file.originalname)
  }
})

const upload = multer({storage})

export {upload}
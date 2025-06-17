import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import { apiError } from "./apiErrors.js";
import 'dotenv/config'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return console.log("Could not find the file.")
    // upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      public_id: `${Date.now()}/${localFilePath}`
    })
    // if(!response) throw new apiError(400, "failed to upload file")
    //for confirmation    
    console.log("file is uploaded on cloudinary", response.url)
    
    fs.unlinkSync(localFilePath)
    return response
    
  } catch (error) {
     if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload opration got failed
    console.error("❌ Cloudinary upload failed:", error);
    return null;
  }
}
const deleteFromCloudinary = async (publicId) =>{
  try {
    if (!publicId) return console.log("public id missing");

    await cloudinary.uploader.destroy(publicId, {invalidate: true})

    return true

  } catch (error) {
    console.error("❌ Cloudinary file delete failed:", error);
    return null;
  }

}

export { uploadOnCloudinary, deleteFromCloudinary };



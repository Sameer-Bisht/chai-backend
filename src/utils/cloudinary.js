import {v2 as cloudinary} from "cloudinary"
import fs from "fs" ; 
 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: CLOUDINARY_API_KEY , 
        api_secret: CLOUDINARY_API_SECRET
    });

    const uploadOnCloudinary = async (localFilePath) => {
        try{ 
            if(!localFilePath) return null ; 

            //upload the file on cloudinary 
            cloudinary.uploader.upload(localFilePath, {
                resource_type: "auto",

            })
            //file has been uploaded successfully 
            console.log("File Is  Uploaded On Cloudinary");
            
        }
        catch(error) { 
            fs.unlinkSync(localFilePath); //removes locally saved filed as upload failed 
        }
    }

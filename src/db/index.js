// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express"; 

// const app = express()   ;

// (async () => {
//     try{ 
//        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//        app.on("error", (error)=> { 
//         console.log("error", error);
//         throw error ;
//        })
//        app.listen(process.env.PORT , () => { 
//          console.log(`App is listening on port ${process.env.PORT}`)
//        })
//     }catch(error){ 
//         console.error("Error: ", error ); 
//         throw error; 


//     }
// })();


// the above code is an approach that can be used , we will use another approach

import mongoose from "mongoose"; 


import {DB_NAME} from "../constants.js"

const connectDB = async () => { 
    try { 
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) // mongoose actually gives a return object
       
        console.log(`\n Mongodb connected !! DB host : ${connectionInstance.connection.host}`);
    }catch(error){ 
            console.log("MONGODB connection error ", error);
            process.exit(1) ;
    }
}
export default connectDB; 

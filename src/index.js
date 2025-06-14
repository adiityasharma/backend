import { app } from "./app.js"
import connectDB from "./db/db.js"
import 'dotenv/config'



connectDB()
.then(()=>{
  app.listen(process.env.PORT || 3000, ()=>{
    console.log(`Server is started..`)
  })
})
.catch((err)=>{
  console.log("MongoDB connection failed. Error", err)
})

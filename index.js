const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174",
      "https://job-task-b88b4.web.app"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());


// MongoDB start here ----------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pbz3kui.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const productCollection = client.db("jobTask").collection("products");

    // Generate Tokens
    app.post("/jwt", async (req, res) => {
        const user = req.body;
        // console.log(user);
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
          expiresIn: "365d",
        });
        res
          .cookie("token", token, {
            httpOnly: true,
            // secure: false,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      });
  
      // Clear token on logout
      app.post("/logout", async (req, res) => {
        const user = req.body;
        // console.log('User logged out');
        res
          .clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            maxAge: 0,
          })
          .send({ message: true });
      });

    /*****************Start*****************************/
    // Get all product data from db
    app.get(`/products`, async (req, res) => {
        const cursor = productCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });
  
      // Get all product data from db for pagination
  
      app.get("/all-products", async (req, res) => {
        const size = parseInt(req.query.size);
        const page = parseInt(req.query.page) - 1;
        const filter = req.query.filter;
        const brand = req.query.brand;
        const sort = req.query.sort;
        const search = req.query.search;
        const price = req.query.price;
        const sort_newest = req.query.sort_newest;
  
        // console.log(size, page);
  
        let query = {
          name: { $regex: search, $options: "i" },
        };
  
        if (filter) query.category = filter;
        if (brand) query.brand = brand;
  
        // Handle price range filtering
        if (price) {
          const [minPrice, maxPrice] = price.split("-").map(Number);
          query.price = { $gte: minPrice, $lte: maxPrice };
        }
  
        // Handle sorting by price high to low and low to high
        let options = {};
        if (sort) options.sort = { price: sort === "asc" ? 1 : -1 };
  
        // Handle sorting by newest product first show
        if (sort_newest) {
          options.sort = { createdAt: sort_newest === "dsc" ? -1 : 1 };
        }
  
        const result = await productCollection
          .find(query, options)
          .skip(page * size)
          .limit(size)
          .toArray();
  
        res.send(result);
      });
  
      // Get all product data count from db
      app.get("/products-count", async (req, res) => {
        const filter = req.query.filter;
        const brand = req.query.brand;
        const price = req.query.price;
        const search = req.query.search;
        let query = {
          name: { $regex: search, $options: "i" },
        };
        if (filter) query.category = filter;
        if (brand) query.brand_name = brand;
        if (price) {
          const [minPrice, maxPrice] = price.split("-").map(Number);
          query.price = { $gte: minPrice, $lte: maxPrice };
        }
        const count = await productCollection.countDocuments(query);
  
        res.send({ count });
      });
  
      /*******************end***************************** */

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send("Job Task server is running....")
})

app.listen(port, () =>{
    console.log(`Job Task server is running on port: ${port}`);
})
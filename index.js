const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
// app.use(multer());
app.use(express.json());




const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.yce8pf3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});



async function run() {
    try {
        const products = client.db('rentUsBd').collection('productCollection');
        const usersCollection = client.db('rentUsBd').collection('users');
        const feedbackData = client.db('rentUsBd').collection('feedback');

        // get data from server:
        app.get('/productCollection', async (req, res) => {
            console.log(req.query);
            const query = req.query;
            if (Object.keys(query).length) {
                let price = query.price;
                if (price == 'Low to High') {
                    price = 1
                } else {
                    price = -1
                }
                const city = query.city;
                const month = query.month;
                const rentType = query.rentType.split(',');
                const bedAmountStr = query.bedAmount.split(',');
                const bedAmount = bedAmountStr.map(bed => parseInt(bed))
                const washAmountStr = query.washAmount.split(',');
                const washAmount = washAmountStr.map(wash => parseInt(wash))

                console.log(rentType);
                console.log(bedAmount);
                console.log(washAmount);
                const findProducts = products.find({
                    city: city,
                    month: month,
                    category: { $in: rentType },
                    room: { $in: bedAmount },
                    bath: { $in: washAmount },
                }).sort({ rent: price })
                const result = await findProducts.toArray();
                console.log("result", result);
                res.send(result);

            } else {
                const sortProduct = products.find(query).sort({ _id: -1 });;
                const result = await sortProduct.toArray();
                res.send(result);
            }

        });

        app.get("/allProducts", async (req, res) => {
            const query = {}
            const product = await products.find(query).toArray()
            res.send(product)
        })


        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            console.log(query);
            const product = products.find(query);
            const findProduct = await product.toArray()
            console.log(findProduct);
            res.send(findProduct);
        });

        app.get('/sortProducts', async (req, res) => {
            const city = req.query.city;
            const area = req.query.area;
            const rent = req.query.rent;


            console.log(city, area, rent);
            const sortProducts = products.find({
                city: city,
                area: area,
                category: rent
            })
            // console.log(sortProducts);
            const result = await sortProducts.toArray()
            console.log(result);
            res.send(result)
        })

        app.get("/categoryWiseData", async (req, res) => {
            const title = req.query.title;
            const find = await products.find({ category: title }).toArray()
            console.log("category", find);
            res.send(find)
        })


        app.post('/productCollection', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await products.insertOne(user);
            res.send(result);
        });

        // User Information Post in Database :
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        // Get Users From Database:
        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });


        // Get Who is Admin : 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });


        // Get Who is Seller : 
        app.get('/users/seller/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' });
        });



        app.get('/dashboard/allsellers', async (req, res) => {
            const role = req.query.role;
            console.log(req.query.role);
            const users = await usersCollection.find({}).toArray()
            const result = users.filter(product => product.role === role)
            console.log("jsx".result);
            res.send(result)

        })

        app.get('/dashboard/allbuyers', async (req, res) => {
            const role = req.query.role;
            console.log(req.query.role);
            const users = await usersCollection.find({}).toArray()
            const result = users.filter(product => product.role === role)
            console.log("jsx".result);
            res.send(result)

        });


        // Delete Users :
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            console.log(id)
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            console.log(result)
            res.send(result)
        });


        // Get Products Collection in UI :
        app.get('/products', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            console.log(query);
            const product = await products.find(query).toArray();
            console.log(product);
            res.send(product);
        });


        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await products.deleteOne(filter);
            res.send(result);
        });



        app.get('/details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await products.findOne(query);
            res.send(service);
        });

        // Post Feedback Data
        app.post('/feedback', async (req, res) => {
            const feedback = req.body;
            console.log(feedback);
            const result = await feedbackData.insertOne(feedback);
            res.send(result);
        });

        // Get Feedback Data
        app.get('/feedback', async (req, res) => {
            const query = {};
            const result = await feedbackData.find(query).toArray();
            res.send(result);
        });

        // Delete Feedback Data
        app.delete('/feedback/:id', async (req, res) => {
            const id = req.params.id;
            const filteredFeedback = { _id: ObjectId(id) };
            const result = await feedbackData.deleteOne(filteredFeedback);
            res.send(result);
        });

    }
    finally {

    }
}
run().catch(console.log);



app.get('/', async (req, res) => {
    res.send('Home Rent server is running');
})

app.listen(port, () => console.log(`Home Rent running on ${port}`))
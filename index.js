const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.yce8pf3.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});

// const uri = `mongodb+srv://${process.env.db_user}:${process.env.db_pass}@cluster0.3exxtfz.mongodb.net/?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run() {
    try {
        const products = client.db('rentUsBd').collection('productCollection');
        const usersCollection = client.db('rentUsBd').collection('users');

        // get data from server:

        app.get('/productCollection', async (req, res) => {
            const query = {}
            const sortProduct = products.find(query).sort({ _id: -1 });;
            const result = await sortProduct.toArray();
            res.send(result);
        });


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

    }
    finally {

    }
}
run().catch(console.log);



app.get('/', async (req, res) => {
    res.send('Home Rent server is running');
})

app.listen(port, () => console.log(`Home Rent running on ${port}`))
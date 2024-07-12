const express = require("express");
const cors = require("cors");
const SSLCommerzPayment = require('sslcommerz-lts')
const multer = require("multer");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

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

const store_id = process.env.storeID;
const store_passwd = process.env.storePassword;
const is_live = false //true for live, false for sandbox

async function run() {
  try {
    const db = client.db("rentUsBd");
    const products = db.collection("productCollection");
    const usersCollection = db.collection("users");
    const feedbackData = db.collection("feedback");
    /*
        {
          _id: String
          participants: [
            {name: String, email: String},
            {name: String, email: String}
          ],
          propertyId: String
          createdBy: String // email
          createdAt: String
          updatedAt: String
        }
        */
    const ConversationCollection = db.collection("conversations");
    /*
        {
          _id: String
          conversationId: String
          isUpdated: Boolean
          message: String
          createdBy: String // email
          createdAt: String
          updatedAt: String
        }
        */
    const ConversationMessageCollection = db.collection(
      "conversation-messages"
    );



    const tran_id = new ObjectId().toString();

    app.post("/order", async (req, res) => {
      const order = req.body;

      const data = {
        total_amount: order.rent,
        currency: 'BDT',
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: 'http://localhost:3030/success',
        fail_url: 'http://localhost:3030/fail',
        cancel_url: 'http://localhost:3030/cancel',
        ipn_url: 'http://localhost:3030/ipn',
        shipping_method: 'Courier',
        product_name: 'Computer.',
        product_category: 'Electronic',
        product_profile: 'general',
        cus_name: order.name,
        cus_email: order.email,
        cus_add1: order.address,
        cus_add2: 'Dhaka',
        cus_city: 'Dhaka',
        cus_state: 'Dhaka',
        cus_postcode: '1000',
        cus_country: 'Bangladesh',
        cus_phone: order.phone,
        cus_fax: '01711111111',
        ship_name: 'Customer Name',
        ship_add1: 'Dhaka',
        ship_add2: 'Dhaka',
        ship_city: 'Dhaka',
        ship_state: 'Dhaka',
        ship_postcode: 1000,
        ship_country: 'Bangladesh',
      };


      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
      sslcz.init(data).then(apiResponse => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL
        res.send({ url: GatewayPageURL })
      });
    });








    // get data from server:
    app.get("/productCollection", async (req, res) => {
      const query = req.query;
      if (Object.keys(query).length) {
        let price = query.price;
        if (price == "Low to High") {
          price = 1;
        } else {
          price = -1;
        }
        const city = query.city;
        const month = query.month;
        const area = query.area;
        const rentType = query.rentType.split(",");
        const bedAmountStr = query.bedAmount.split(",");
        const bedAmount = bedAmountStr.map((bed) => parseInt(bed));
        const washAmountStr = query.washAmount.split(",");
        const washAmount = washAmountStr.map((wash) => parseInt(wash));

        const findProducts = products
          .find({
            city: city,
            area: area,
            month: month,
            category: { $in: rentType },
            room: { $in: bedAmount },
            bath: { $in: washAmount },
          })
          .sort({ rent: price });
        const result = await findProducts.toArray();
        res.send(result);
      } else {
        const sortProduct = products.find(query).sort({ _id: -1 });
        const result = await sortProduct.toArray();
        res.send(result);
      }
    });

    app.get("/allProducts", async (req, res) => {
      const query = {};
      const product = await products.find(query).toArray();
      res.send(product);
    });

    app.get("/products", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const product = products.find(query);
      const findProduct = await product.toArray();
      res.send(findProduct);
    });

    app.get("/sortProducts", async (req, res) => {
      const city = req.query.city;
      const area = req.query.area;
      const rent = req.query.rent;

      console.log(city, area, rent);

      const sortProducts = products.find({
        city: city,
        area: area,
        category: rent,
      });
      const result = await sortProducts.toArray();
      res.send(result);
    });

    app.get("/categoryWiseData", async (req, res) => {
      const title = req.query.title;
      const find = await products.find({ category: title }).toArray();
      res.send(find);
    });

    app.post("/productCollection", async (req, res) => {
      const user = req.body;
      const result = await products.insertOne(user);
      res.send(result);
    });

    // User Information Post in Database :
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Get Users From Database:
    app.get("/users", async (req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    });

    // Get Who is Admin :
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });

    // Get Who is Seller :
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === "seller" });
    });
    // Get Who is Buyer :
    app.get("/users/buyer/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isBuyer: user?.role === "buyer" });
    });

    app.get("/dashboard/allsellers", async (req, res) => {
      const role = req.query.role;
      const users = await usersCollection.find({}).toArray();
      const result = users.filter((product) => product.role === role);
      res.send(result);
    });

    app.get("/dashboard/allbuyers", async (req, res) => {
      const role = req.query.role;
      const users = await usersCollection.find({}).toArray();
      const result = users.filter((product) => product.role === role);
      res.send(result);
    });

    // Delete Users :
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
      res.send(result);
    });










    // app.get("/products", async (req, res) => {
    //   const email = req.query.email;
    //   const query = { email: email };
    //   const product = await products.find(query).toArray();
    //   res.send(product);
    // });

    // app.delete('/products/:id', async (req, res) => {
    //   const id = req.params.id;
    //   const filter = { _id: ObjectId(id) };
    //   const result = await products.deleteOne(filter);
    //   res.send(result);
    // });

    // app.patch('/products/:id', async (req, res) => {
    //   try {
    //     const id = req.params.id;
    //     const filter = { _id: ObjectId(id) };
    //     const updateHome = await products.findByIdAndUpdate(filter, req.body, { new: true });
    //     res.send(updateHome);
    //   } catch (error) {
    //     res.status(404).send(error);
    //   }
    // });









    // House rent post details :
    app.get('/products', async (req, res) => {
      const email = req.query.email;
      try {
        const products = await products.find({ email }).toArray();
        res.send(products);
      } catch (error) {
        res.status(500).send(error);
      }
    });

    app.delete('/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const filter = { _id: ObjectId(id) };
        const result = await products.deleteOne(filter);
        res.send(result);
      } catch (error) {
        res.status(500).send(error);
      }
    });

    app.put('/products/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updateData = req.body;
        const filter = { _id: ObjectId(id) };
        const updateDoc = {
          $set: updateData,
        };
        const result = await products.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send(error);
      }
    });

    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const service = await products.findOne(query);
      res.send(service);
    });

    // Post Feedback Data
    app.post("/feedback", async (req, res) => {
      const feedback = req.body;
      const result = await feedbackData.insertOne(feedback);
      res.send(result);
    });

    // Get Feedback Data
    app.get("/feedback", async (req, res) => {
      const query = {};
      const result = await feedbackData.find(query).sort({ _id: -1 }).toArray();
      res.send(result);
    });

    // Delete Feedback Data
    app.delete("/feedback/:id", async (req, res) => {
      const id = req.params.id;
      const filteredFeedback = { _id: ObjectId(id) };
      const result = await feedbackData.deleteOne(filteredFeedback);
      res.send(result);
    });

    app.post("/conversations", async (req, res) => {
      try {
        const { email, propertyId } = req?.body || {};
        if (!(email && propertyId)) {
          return res
            .status(400)
            .json({
              error: "Missing required params!",
              fields: ["email", "propertyId"],
            });
        }

        const property =
          (await products.findOne({ _id: ObjectId(propertyId) })) || {};
        if (!property?._id) {
          return res
            .status(404)
            .json({
              error: "Could not find property!",
              fields: ["email", "propertyId"],
            });
        }

        const isPropertyOwner = !!(property?.email === email);
        if (!isPropertyOwner) {
          const conversation = await ConversationCollection.findOne({
            "participants.email": email,
            propertyId: ObjectId(propertyId),
          });

          if (!conversation?._id) {
            const { name: propertyOwner, email: receiverEmail } =
              property || {};
            if (!(receiverEmail && propertyOwner)) {
              return res.status(404).json({
                error: "Could not find property info!",
                fields: ["receiverEmail", "propertyOwner"],
              });
            }

            const senderUser = (await usersCollection.findOne({ email })) || {};
            if (!senderUser?._id) {
              return res
                .status(404)
                .json({ error: "Could not find sender user!" });
            }

            const { insertedId } =
              (await ConversationCollection.insertOne({
                participants: [
                  { name: senderUser?.name, email: senderUser?.email },
                  { name: propertyOwner, email: receiverEmail },
                ],
                propertyId: ObjectId(propertyId),
                createdBy: senderUser?.email,
                createdAt: new Date(),
                updatedAt: new Date(),
              })) || {};
            if (!insertedId) {
              return res
                .status(500)
                .json({ error: "Could not create conversation!" });
            }
          }
        }

        const conversations = await ConversationCollection.aggregate([
          {
            $match: {
              "participants.email": email,
              propertyId: ObjectId(propertyId),
            },
          },
          {
            $lookup: {
              from: "conversation-messages",
              localField: "_id",
              foreignField: "conversationId",
              as: "conversationMessages",
            },
          },
        ]).toArray();

        res.status(200).json({
          count: conversations?.length,
          conversations,
          message: "Successfully Fetched",
          success: true,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete("/conversations/:id", async (req, res) => {
      try {
        const conversation = await ConversationCollection.findOne({
          _id: req?.params?.id,
        });

        if (!conversation) {
          return res
            .status(400)
            .json({ error: "Could not find conversation!" });
        }

        const isDeleted = await ConversationCollection.deleteOne({
          _id: req?.params?.id,
        });

        res.status(200).json({
          conversation,
          message: !!isDeleted
            ? "Successfully Deleted"
            : "Could not delete the conversation!",
          success: !!isDeleted,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post("/conversations/messages", async (req, res, next) => {
      try {
        const { conversationId, message, senderEmail } = req.body || {};

        if (!(conversationId && message && senderEmail)) {
          return res.status(400).json({ error: "Invalid request!" });
        }

        const senderUser =
          (await usersCollection.findOne({ email: senderEmail })) || {};
        if (!senderUser) {
          return res.status(400).json({ error: "Could not find user!" });
        }

        const conversation =
          (await ConversationCollection.findOne({
            _id: ObjectId(conversationId),
          })) || {};
        if (!conversation?._id) {
          return res
            .status(400)
            .json({ error: "Could not find conversation!" });
        }

        const { insertedId } = await ConversationMessageCollection.insertOne({
          conversationId: ObjectId(conversationId),
          message,
          createdBy: senderUser?.email,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        const conversationMessage = await ConversationMessageCollection.findOne(
          { _id: insertedId }
        );

        res.status(200).json({
          conversationMessage,
          message: !!conversationMessage
            ? "Successfully Created"
            : "Could not create conversation message!",
          success: !!conversationMessage,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.get("/conversations/messages/:conversationId", async (req, res) => {
      try {
        const conversationMessages = await ConversationMessageCollection.find({
          conversationId: req?.params?.conversationId,
        }).toArray();

        res.status(200).json({
          count: conversationMessages?.length,
          conversationMessages,
          message: "Successfully Fetched",
          success: true,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.put("/conversations/messages/:id", async (req, res) => {
      try {
        const { message } = req?.body || {};
        if (!message) {
          return res.status(400).json({ error: "Invalid request!" });
        }

        const conversationMessage = await ConversationMessageCollection.findOne(
          {
            _id: req?.params?.id,
          }
        );

        if (!conversationMessage) {
          return res
            .status(400)
            .json({ error: "Could not find conversation message!" });
        }

        const updatedConversationMessage =
          await ConversationMessageCollection.update(
            { _id: req?.params?.id },
            { $set: { isUpdated: true, message, updatedAt: new Date() } }
          );

        res.status(200).json({
          conversationMessage: updatedConversationMessage,
          message: !!updatedConversationMessage
            ? "Successfully Updated"
            : "Could not update the conversation message!",
          success: !!updatedConversationMessage,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.delete("/conversations/messages/:id", async (req, res) => {
      try {
        const conversationMessage = await ConversationMessageCollection.findOne(
          {
            _id: req?.params?.id,
          }
        );

        if (!conversationMessage) {
          return res
            .status(400)
            .json({ error: "Could not find conversation message!" });
        }

        const isDeleted = await ConversationMessageCollection.remove({
          _id: req?.params?.id,
        });

        res.status(200).json({
          conversationMessage,
          message: !!isDeleted
            ? "Successfully Deleted"
            : "Could not delete the conversation message!",
          success: !!isDeleted,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  } finally {
  }
}

run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("Home Rent server is running");
});

app.listen(port, () => console.log(`Home Rent running on ${port}`));

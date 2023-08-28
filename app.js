
const { log } = require("console");
const express = require("express");
const mongoose = require("mongoose");
const _= require("lodash");
const dotenv= require("dotenv").config();
 
const app = express();
 
app.set("view engine", "ejs");
 
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
 
run();
async function run() {
  try {
    mongoose.connect(process.env.mongoDbUrl);
 
    const itemsSchema = new mongoose.Schema({
      name: String,
    });
 
    const Item = mongoose.model("Item", itemsSchema);
 
    var item1 = new Item({
      name: "WakeUp Early in the Morning",
    });
    var item2 = new Item({
      name: "Brush my teeth",
    });
    var item3 = new Item({
      name: "Learn to code",
    });
 
    var defaultItems = [item1, item2, item3];

    const listSchema= new mongoose.Schema({
      name:String,
      items:[itemsSchema]
    })

    const List= mongoose.model("List",listSchema);

 
    // mongoose.connection.close();
 
    app.get("/", async function (req, res) {
      const foundItems = await Item.find({}); 
      if (!(await Item.exists())) {
        await Item.insertMany(defaultItems);
        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    });

    app.get("/:customListName",async (req,res)=>{
      const customListName =_.capitalize(req.params.customListName);
     await List.findOne({name:customListName}).then((result)=>{
        if(!result){
          //create

          const list= new List({
            name:customListName,
            items:defaultItems
          })
          list.save();
          res.redirect("/"+customListName)

        }
         else{
          res.render("list",{listTitle:result.name ,newListItems:result.items})
        }}).catch((err)=>log(err))
    })
 
    app.post("/",async function (req, res) {
      let newItem= req.body.newItem;
      const listName= req.body.list;

      const item=new Item({
        name: newItem
      })
        if(listName==="Today"){
        await item.save();
          res.redirect("/")
        }else{
         List.findOne({name:listName}).then((found)=>{found.items.push(item);
         found.save();
          res.redirect("/"+listName)
        }).catch((err)=>console.log(err));
         
    }});
 
    app.post("/delete", async function (req, res) {
      const checkedItemId = req.body.checkbox;
      const listName= req.body.listName;
      if(listName==="Today"){

        if(checkedItemId!=undefined){
        await Item.findByIdAndRemove(checkedItemId).then(()=>  log("deleted successfully"))
        .catch((err)=> log(err));
             res.redirect("/");
         }

      }
      else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}}).then(()=>res.redirect("/"+listName)).catch((err)=>console.log(err))
      }
        });

    app.get("/about", function (req, res) {
      res.render("about");
    });
 
    app.listen(3000, function () {
      console.log("Server started on port 3000");
    });
  } catch (e) {
    console.log(e.message);
  }
}
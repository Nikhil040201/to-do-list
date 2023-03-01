const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const dotenv = require('dotenv');

const port = process.env.PORT;
const url = process.env.URL;

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(url, { useNewUrlParser: true });
mongoose.set('strictQuery', false);

const itemSchema = {
  name: {
    type: String,
    required: true
  }

}
const Item = mongoose.model("Item", itemSchema);

const coffee = new Item({
  name: "buy coffee"
});
const gym = new Item({
  name: "go to gym"
});
const meeting = new Item({
  name: "attend the meeting"
});

const defaultItems = [coffee, gym, meeting];
const listSchema = {
  name: String,
  items: [itemSchema]
};
const List = mongoose.model("List", listSchema);


app.get("/", function (req, res) {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length == 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        }
        else {
          console.log("successfully saved default items");
        }
      });
      res.redirect("/");
    }
    else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });


});
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/"+ customListName);
      } else {
        res.render("list", {listTitle:foundList.name, newListItems:foundList.items});
      }
    }
  });


});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, (err, foundList)=>{
     foundList.items.push(item);
     foundList.save();
     res.redirect("/"+ listName);
    });
  }
  
});
app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItem, function (err) {
      if (!err) {
        console.log("removed successfully");
      }
      res.redirect("/");
    });
  }else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}},(err, foundList)=>{
    if(!err){
      res.redirect("/"+listName);
    }
    });
  }
  
  
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(port, function () {
  console.log("Server started on port 3000");
});

const CatalogueInquiry = require("../../models/CatalogueInquiry/CatalogueInquiry")
const multer = require("multer");
const path = require('path')
const fs = require('fs')
const sharp = require('sharp'); // Add sharp import
// const ejs = require('ejs');
const handlebars = require('handlebars');
// require('web-streams-polyfill');

exports.createCatalogueInquiry = async(req,res)=>{
    try{ 
    const {categoryName, subCategoryName , startPrice , endPrice, quantity} = req.body

    const add = await new CatalogueInquiry({
        categoryName,
        startPrice,
        subCategoryName,
        endPrice,
        quantity,
      }).save();
  
      return res.status(200).json({ isOk: true, data: add, message: "Inquiry added successfully" });
    }
    catch(error)
    {
        return res.status(500).send(error);
    }

}
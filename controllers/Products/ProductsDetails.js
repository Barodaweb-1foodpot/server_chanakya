const ProductsDetails = require("../../models/Products/ProductsDetails");
const multer = require("multer");
const path = require('path')
const fs = require('fs')
const sharp = require('sharp'); // Add sharp import
// const ejs = require('ejs');
const handlebars = require('handlebars');
// require('web-streams-polyfill');
const puppeteer = require('puppeteer');

exports.getProductsDetails = async (req, res) => {
  try {
    const find = await ProductsDetails.findOne({ _id: req.params._id }).exec();
    res.json(find);
  } catch (error) {
    return res.status(500).send(error);
  }
};

exports.createProductsDetails = async (req, res) => {
  try {
    // Define upload directory for images
    const uploadDir = `${__basedir}/uploads/Products`;

    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Process image compression if file is uploaded
    let productImage = req.file ? await compressImage(req.file, uploadDir) : null;
    let {
      categoryName,
      subCategoryName,
      brandName,
      productName,
      SKU,
      price,
      additionalPercentage,
      newPrice,
      IsActive,
      isAvailable,
    } = req.body;

    // Check for existing product by SKU
    const alreadyExist = await ProductsDetails.findOne({ SKU: req.body.SKU }).exec();
    if (alreadyExist) {
      return res.status(200).json({ message: "SKU already exists", isOk: false });
    }

    // Create new product details
    const add = await new ProductsDetails({
      categoryName,
      subCategoryName,
      brandName,
      productImage,
      SKU,
      productName,
      price,
      IsActive,
      isAvailable,
      additionalPercentage,
      newPrice,
    }).save();

    res.status(200).json({ isOk: true, data: add, message: "" });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};


exports.listProductsDetails = async (req, res) => {
  try {
    const list = await ProductsDetails.find({ isAvailable: true, IsActive: true }).populate('brandName').populate('categoryName').populate('subCategoryName').exec();
    res.json(list);
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listProductByCategory = async (req, res) => {
  try {
    const list = await ProductsDetails.find({
      categoryName: req.params.categoryId,
      IsActive: true,
    })
      .sort({ createdAt: -1 })
      .exec();
    if (list) {
      res.status(200).json({ isOk: true, data: list, message: "" });
    } else {
      res.status(200).json({ isOk: false, message: "No data Found" });
    }
  } catch (error) {
    return res.status(400).send(error);
  }
};

exports.listProductsDetailsByParams = async (req, res) => {
  try {
    let { skip, per_page, sorton, sortdir, match, IsActive } = req.body;

    let query = [
      {
        $match: { IsActive: IsActive },
      },
      {
        $lookup: {
          from: "categorymasters",
          localField: "categoryName",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subcategorymasters",
          localField: "subCategoryName",
          foreignField: "_id",
          as: "SubCategoryDetail",
        },
      },
      {
        $unwind: {
          path: "$SubCategoryDetail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "brandmasters",
          localField: "brandName",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      {
        $unwind: {
          path: "$brandDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $match: {
          $or: [
            {
              productName: { $regex: match, $options: "i" },
            },
            {
              "category.categoryName": { $regex: match, $options: "i" },
            },
          ],
        },
      },

      {
        $facet: {
          stage1: [
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
              },
            },
          ],
          stage2: [
            {
              $skip: skip,
            },
            {
              $limit: per_page,
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$stage1",
        },
      },
      {
        $project: {
          count: "$stage1.count",
          data: "$stage2",
        },
      },
    ];


    if (sorton && sortdir) {
      let sort = {};
      sort[sorton] = sortdir == "desc" ? -1 : 1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    } else {
      let sort = {};
      sort["createdAt"] = -1;
      query = [
        {
          $sort: sort,
        },
      ].concat(query);
    }

    const list = await ProductsDetails.aggregate(query);

    res.json(list);
  } catch (error) {
    res.status(500).send(error);
  }
};

exports.updateProductsDetails = async (req, res) => {
  try {
    let productImage = req.file
      ? await compressImage(req.file, uploadDir)
      : null;
    let fieldvalues = { ...req.body };
    if (productImage != null) {
      fieldvalues.productImage = productImage;
    }

    const update = await ProductsDetails.findOneAndUpdate(
      { _id: req.params._id },
      fieldvalues,

      { new: true }
    );
    res.json(update);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.removeProductsDetails = async (req, res) => {
  try {
    const del = await ProductsDetails.findOneAndRemove({
      _id: req.params._id,
    });
    res.json(del);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.CategoryProductList = async (req, res) => {
  try {
    const { option, categoryid } = req.params;

    const list = await ProductsDetails.find({
      categoryName: categoryid,
      IsActive: true,
    })
      .sort({ createdAt: -1 })
      .exec();

    let sortedList;

    switch (option) {
      case "1": // Newest
        sortedList = list;
        break;
      case "2": // Price low to high
        sortedList = list.sort((a, b) => a.newPrice - b.newPrice);
        break;
      case "3": // Price high to low
        sortedList = list.sort((a, b) => b.newPrice - a.newPrice);

        break;
      case "4": // A to Z
        sortedList = list.sort((a, b) =>
          a.productName.localeCompare(b.productName)
        );
        break;
      case "5": // Z to A
        sortedList = list.sort((a, b) =>
          b.productName.localeCompare(a.productName)
        );
        break;
      default:
        // Default sorting, perhaps by createdAt descending
        sortedList = list;
    }

    if (sortedList) {
      res.status(200).json({ isOk: true, data: sortedList, message: "" });
    } else {
      res.status(200).json({ isOk: false, message: "No data Found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).send(error);
  }
};

exports.brandCount = async (req, res) => {
  let query = [
    {
      $group: {
        _id: "$brandName",
        count: { $sum: 1 }
      }
    },
    {
      $lookup: {
        localField: "_id",
        foreignField: "_id",
        as: "brandDetails"
      }
    },


    {
      $sort: { count: -1 }
    }
  ];


  try {
    const result = await ProductsDetails.aggregate(query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching brand counts." });
  }
};



exports.getUniquefilters = async (req, res) => {
  try {
    const uniqueValues = await ProductsDetails.aggregate([
      {
        $group: {
          _id: null,
          uniqueCategoryNames: { $addToSet: "$categoryName" }, // Collect unique category ids
          uniqueSubCategoryNames: { $addToSet: "$subCategoryName" }, // Collect unique subcategory ids
          uniqueBrandNames: { $addToSet: "$brandName" }, // Collect unique brand ids
          uniquePrices: { $addToSet: "$newPrice" }, // Collect unique prices
        }
      },
      {
        $lookup: {
          from: "categorymasters", // Collection name for CategoryMaster
          localField: "uniqueCategoryNames",
          foreignField: "_id",
          as: "categories"
        }
      },
      {
        $lookup: {
          from: "subcategorymasters", // Collection name for SubCategoryMaster
          localField: "uniqueSubCategoryNames",
          foreignField: "_id",
          as: "subCategories"
        }
      },
      {
        $lookup: {
          from: "brandmasters", // Collection name for BrandMaster
          localField: "uniqueBrandNames",
          foreignField: "_id",
          as: "brands"
        }
      },
      {
        $project: {
          _id: 0,
          categories: 1, // Include categories after lookup
          subCategories: 1, // Include subCategories after lookup
          brands: 1, // Include brands after lookup
          uniquePrices: 1
        }
      }
    ]);

    res.status(200).json(uniqueValues);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching unique product details." });
  }
};
const mongoose = require('mongoose');
exports.getFilteredProducts = async (req, res) => {
  try {
    const { activeBrandIndices, activeCategoriesIndices, activeSubCategoriesIndices, value } = req.body;
    console.log(req.body)
    // Build the query object
    const query = {};

    // Filter by brand if activeBrandIndices are provided
    if (activeBrandIndices && activeBrandIndices.length > 0) {
      query.brandName = { $in: activeBrandIndices.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filter by category if activeCategoriesIndices are provided
    if (activeCategoriesIndices && activeCategoriesIndices.length > 0) {
      query.categoryName = { $in: activeCategoriesIndices.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filter by subcategory if activeSubCategoriesIndices are provided
    if (activeSubCategoriesIndices && activeSubCategoriesIndices.length > 0) {
      query.subCategoryName = { $in: activeSubCategoriesIndices.map(id => new mongoose.Types.ObjectId(id)) };
    }

    // Filter by product IDs or SKU (assuming value is product ID or SKU)


    // Query for fetching the product details
    const products = await ProductsDetails.aggregate([
      {
        $match: {
          ...query, // Match the filtered criteria for brand, category, and subcategory
          newPrice: {
            $gte: value[0],  // value[0] is the minimum price
            $lte: value[1]   // value[1] is the maximum price
          }
        },
      },
      {
        $lookup: {
          from: 'categorymasters', // Collection for categories
          localField: 'categoryName',
          foreignField: '_id',
          as: 'categoryName',
        },
      },
      {
        $lookup: {
          from: 'subcategorymasters', // Collection for subcategories
          localField: 'subCategoryName',
          foreignField: '_id',
          as: 'subCategoryName',
        },
      },
      {
        $lookup: {
          from: 'brandmasters', // Collection for brands
          localField: 'brandName',
          foreignField: '_id',
          as: 'brandName',
        },
      },
      {
        $unwind: {
          path: "$categoryName",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$subCategoryName",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$brandName",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null, // Grouping all matched products
          uniqueBrandNames: { $addToSet: "$brandName._id" }, // Collect unique brand IDs
          uniqueBrandDetails: { $addToSet: "$brandName" },   // Collect unique brand details
          products: {
            $push: {
              productId: "$_id",
              productName: "$productName",
              productImage: "$productImage",
              price: "$price",
              newPrice: "$newPrice",
              additionalPercentage: "$additionalPercentage",
              productsubsmasterId: "$productsubsmasterId",
              categoryName: "$categoryName",
              subCategoryName: "$subCategoryName",
              brandName: "$brandName"
            }
          },
        },
      },
      {
        $project: {
          _id: 0, // Do not include _id in the result
          uniqueBrandNames: 1, // Return the unique brand IDs
          uniqueBrandDetails: 1, // Return the unique brand details
          products: 1, // Return the product details
        },
      }
    ]);



    res.status(200).json({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error });
  }
};



exports.getLastSKUNo = async (req, res) => {
  try {
    // Find the last bill sorted by created date
    const lastBill = await ProductsDetails.findOne().sort({ createdAt: -1 });

    if (!lastBill) {
      return res.status(200).json({ message: "No Product found" , isOk:false });
    }

    return res.status(200).json({ lastSKUNo: lastBill.SKU });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving the last SKU", error });
  }
};

async function compressImage(file, uploadDir) {
  // Ensure uploadDir is a string path
  const filePath = path.join(uploadDir, file.filename);
  const compressedPath = path.join(uploadDir, `compressed-${file.filename}`);

  try {
    let quality = 80;
    let compressed = false;

    do {
      await sharp(file.path) // Use file.path for the original file location
        .jpeg({ quality }) // Adjust the quality to reduce the size
        .toFile(compressedPath);

      const { size } = fs.statSync(compressedPath);
      if (size <= 100 * 1024 || quality <= 20) { // Check if size is under 100 KB or quality is too low
        compressed = true;
      } else {
        quality -= 10; // Reduce quality further if size is still too large
      }
    } while (!compressed);

    // Replace the original image with the compressed one
    fs.unlinkSync(filePath); // Remove the original uncompressed image
    fs.renameSync(compressedPath, filePath); // Rename compressed image to original image name

    return `uploads/Products/${file.filename}`; // Return the relative path of the product image
  } catch (error) {
    console.log('Error compressing image:', error);
    return null;
  }
}

exports.downloadPDF = async (req, res, next) => {
  try {
    const filters = req.body;  // Assuming this is the array sent from the frontend

    // Build an array of queries based on the filters
    const queryConditions = filters.map(filter => {
      // Start building the base query
      let query = {
        newPrice: { $gte: filter.startPrice || 0, $lte: filter.endPrice || Infinity },
        IsActive: true,
        isAvailable: true,
      };

      // Conditionally add category if it exists
      if (filter.category) {
        query.categoryName = filter.category;
      }

      // Conditionally add subcategory if it exists
      if (filter.subCategory) {
        query.subCategoryName = filter.subCategory;
      }

      // Attach discount to the query for later use
      query.discount = filter.discount;

      return query;
    });

    // console.log(queryConditions);

    // Use the $or operator to combine all filter conditions
    const products = await ProductsDetails.find({
      $or: queryConditions.map(condition => {
        const { discount, ...query } = condition; // Exclude discount for the query
        return query;
      })
    })
      .populate('brandName')
      .populate('categoryName')
      .populate('subCategoryName');

  

    // Now iterate over the products and attach the correct discount
    const updatedProducts = products.map(product => {
      // Find the matching filter condition
      const matchingCondition = queryConditions.find(condition => {
        return (
          product.newPrice >= condition.newPrice.$gte &&
          product.newPrice <= condition.newPrice.$lte &&
          (!condition.categoryName || product.categoryName.equals(condition.categoryName)) &&
          (!condition.subCategoryName || product.subCategoryName.equals(condition.subCategoryName))
        );
      });

      
      // Attach the discount to the product if a matching condition is found
      if (matchingCondition) {
        product.discount = matchingCondition.discount;  // Add the discount to the product
      }

      return product;
    });

    // console.log(updatedProducts);

    // Check if products are found
    if (!updatedProducts.length) { // Changed from products to updatedProducts
      return res.status(200).json({ message: 'No products found in the given price range.', products: updatedProducts, isOk: false });
    }

    // Prepare image URLs
    const logoUrl = `${process.env.REACT_APP_API_URL}/uploads/logo.png`;
    const logoBg = `${process.env.REACT_APP_API_URL}/uploads/number-shape.png`;

    // Read and compile the HTML template
    const templateHtml = fs.readFileSync(path.join(__dirname, 'templet.html'), 'utf8');
    const template = handlebars.compile(templateHtml, {
      strict: true,
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true
    });

    // Prepare products with full image URLs and discount rates
    const productsWithFullImageUrls = updatedProducts.map(product => ({
      ...product.toObject(), // Convert Mongoose Document to plain JavaScript object
      productImage: `${process.env.REACT_APP_API_URL}/${product.productImage}`,
      brandName: product.brandName.brandName, // Extract brand name string
      categoryName: product.categoryName.categoryName, // Extract category name string
      subCategoryName: product.subCategoryName.subCategoryName, // Extract sub-category name string
      discountrate: product.discount ? product.newPrice - ((product.newPrice * product.discount) / 100) : product.newPrice // Calculate discounted price if discount exists
    }));

    // Register a custom Handlebars helper to group products into rows of 5
    handlebars.registerHelper('grouped', function (items, groupSize) {
      const result = [];
      for (let i = 0; i < items.length; i += groupSize) {
        result.push(items.slice(i, i + groupSize));
      }
      return result;
    });

    // Generate HTML with template and data
    const html = template({
      logoUrl,
      logoBg,
      products: productsWithFullImageUrls // Use updated product objects with full URLs
    });
    // console.log(html)

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      timeout: 60000 // Increase timeout to 60 seconds
    });

    const page = await browser.newPage();

    // Set content to the HTML template
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.emulateMediaType('screen');

    // Define the upload directory and filename
    const uploadDir = `${__basedir}/uploads/Catalogue`// Adjust __dirname if necessary
    const filename = `catalogue-${Date.now()}.pdf`; // e.g., catalogue-2024-09-28.pdf
    const filePath = path.join(uploadDir, filename);

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
    }

    // Generate PDF and save it to the specified path
    await page.pdf({
      format: 'A4',
      path: filePath, // Save to the specified path
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: `
           <div style="font-size:10px; color:#fff; width:100%; padding:10px 20px; box-sizing:border-box; text-align:right; position:relative;">
          <span class="footer-part" style="font-size: 10px; font-family: Arial, sans-serif;">
              <span class="pageNumber number-page" style=" position: relative;
            right: 0px;
            bottom: 5px;
            font-size: 20px;
            color: white !important;
            font-weight:600 !;
             filter: brightness(0) saturate(100%) invert(100%) sepia(5%) saturate(21%) hue-rotate(154deg) brightness(105%) contrast(100%);
            "></span> 
          </span>
      </div>
      `,
       
      margin: {
        top:'100px',
        bottom: '40px' // Set a bottom margin to display the footer
      },
      pageRanges: '1-', // To generate all pages
    });
      

    console.log(`PDF saved successfully to: ${filename}`);

    await browser.close();
    
    res.status(200).json({ filename, isOk: true });
  }
  catch (err) {
    console.error('Error generating PDF:', err);
    next(err);
  }
};

exports.getProducts= async (req, res, next) => {
  const { startPrice , endPrice , category, subCategory, quantity  } = req.body; // Assuming these are the filters sent from the frontend

  // Build the query object based on the filter data
  const query = {
    newPrice: { $gte: startPrice, $lte: endPrice },
    IsActive: true,
    isAvailable: true,
    // quantity: { $gte: quantity }, // Check that the product has at least the specified quantity
  };

  // Conditionally add category and subCategory if they are provided
  if (category) {
    query.categoryName = category;
  }
  if (subCategory) {
    query.subCategoryName = subCategory;
  }
  // console.log(query)
  // Find products matching the query
  const products = await ProductsDetails.find(query)
    .populate('brandName')
    .populate('categoryName')
    .populate('subCategoryName');
  // console.log(products)
  // Check if products are found
  if (!products.length) {
    return res.status(200).json({ message: 'No products found in the given price range.', products, isOk: false });
  }

  return res.status(200).json({isOk:true, products})
}


exports.downloadPDFFromFrontend = async (req, res, next) => {
  try {
    const data = req.body;  // Assuming this is the array sent from the frontend

    // Build an array of queries based on the filters
    

    // console.log(queryConditions);

    // Use the $or operator to combine all filter conditions
    const products = await ProductsDetails.find({_id:data})
      .populate('brandName')
      .populate('categoryName')
      .populate('subCategoryName');

  

    // Now iterate over the products and attach the correct discount
    

    // Check if products are found
    if (!products.length) { // Changed from products to updatedProducts
      return res.status(200).json({ message: 'No products found in the given price range.', products, isOk: false });
    }

    // Prepare image URLs
    const logoUrl = `${process.env.REACT_APP_API_URL}/uploads/logo.png`;
    const logoBg = `${process.env.REACT_APP_API_URL}/uploads/number-shape.png`;

    // Read and compile the HTML template
    const templateHtml = fs.readFileSync(path.join(__dirname, 'templateFrontend.html'), 'utf8');
    const template = handlebars.compile(templateHtml, {
      strict: true,
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true
    });

    // Prepare products with full image URLs and discount rates
    const productsWithFullImageUrls = products.map(product => ({
      ...product.toObject(), // Convert Mongoose Document to plain JavaScript object
      productImage: `${process.env.REACT_APP_API_URL}/${product.productImage}`,
      brandName: product.brandName.brandName, // Extract brand name string
      categoryName: product.categoryName.categoryName, // Extract category name string
      subCategoryName: product.subCategoryName.subCategoryName, // Extract sub-category name string
      // discountrate: product.discount ? product.price - ((product.price * product.discount) / 100) : product.price // Calculate discounted price if discount exists
    }));

    // Register a custom Handlebars helper to group products into rows of 5
    handlebars.registerHelper('grouped', function (items, groupSize) {
      const result = [];
      for (let i = 0; i < items.length; i += groupSize) {
        result.push(items.slice(i, i + groupSize));
      }
      return result;
    });

    // Generate HTML with template and data
    const html = template({
      logoUrl,
      logoBg,
      products: productsWithFullImageUrls // Use updated product objects with full URLs
    });
    // console.log(html)

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
      timeout: 60000 // Increase timeout to 60 seconds
    });

    const page = await browser.newPage();

    // Set content to the HTML template
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.emulateMediaType('screen');

    // Define the upload directory and filename
    const uploadDir = `${__basedir}/uploads/Catalogue`// Adjust __dirname if necessary
    const filename = `catalogue-${Date.now()}.pdf`; // e.g., catalogue-2024-09-28.pdf
    const filePath = path.join(uploadDir, filename);

    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Create the directory if it doesn't exist
    }

    // Generate PDF and save it to the specified path
    await page.pdf({
      format: 'A4',
      path: filePath, // Save to the specified path
      printBackground: true,
      displayHeaderFooter: true,
      footerTemplate: `
           <div style="font-size:10px; color:#fff; width:100%; padding:10px 20px; box-sizing:border-box; text-align:right; position:relative;">
          <span class="footer-part" style="font-size: 10px; font-family: Arial, sans-serif;">
              <span class="pageNumber number-page" style=" position: relative;
            right: 0px;
            bottom: 5px;
            font-size: 20px;
            color: white !important;
            font-weight:600 !;
             filter: brightness(0) saturate(100%) invert(100%) sepia(5%) saturate(21%) hue-rotate(154deg) brightness(105%) contrast(100%);
            "></span> 
          </span>
      </div>
      `,
       
      margin: {
        top:'100px',
        bottom: '40px' // Set a bottom margin to display the footer
      },
      pageRanges: '1-', // To generate all pages
    });
      

    console.log(`PDF saved successfully to: ${filename}`);

    await browser.close();
    
    res.status(200).json({ filename, isOk: true });
  }
  catch (err) {
    console.error('Error generating PDF:', err);
    next(err);
  }
};


exports.deleteFile = async (req, res) => {
  const { fileName } = req.body; // assuming the file name is passed in the request body

  // Define the file path
  const uploadDir = `${__basedir}/uploads/Catalogue`
  console.log(uploadDir)
  console.log(fileName)
  const filePath = path.join(uploadDir, fileName);
  console.log(filePath)

  try {
    // Attempt to delete the file asynchronously
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error removing file: ${err}`);
        return;
      }
    
      console.log(`File ${filePath} has been successfully removed.`);
    });
    // Send success response
    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    // Handle errors, like if the file doesn't exist
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message,
    });
  }
};

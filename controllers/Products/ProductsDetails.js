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
    }).save();

    res.status(200).json({ isOk: true, data: add, message: "" });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err);
  }
};


exports.listProductsDetails = async (req, res) => {
  try {
    const list = await ProductsDetails.find({isAvailable: true , IsActive :true}).populate('brandName').populate('categoryName').populate('subCategoryName').exec();
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
        sortedList = list.sort((a, b) => a.price - b.price);
        break;
      case "3": // Price high to low
        sortedList = list.sort((a, b) => b.price - a.price);

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
          uniquePrices: { $addToSet: "$price" }, // Collect unique prices
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


async function compressImage(file, uploadDir) {
  // Ensure uploadDir is a string path
  const filePath = path.join(uploadDir, file.filename); 
  const compressedPath = path.join(uploadDir, `compressed-${file.filename}`);

  try {
    let quality = 80;
    let compressed = false;

    do {
      await sharp(file.path) // Use file.path for the original file location
        .resize({ width: 1920 }) // Resize image width to 1920px, maintaining aspect ratio
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
    const { startPrice, endPrice, discount } = req.body;
console.log(startPrice);
    // Fetch products within the given price range
    const products = await ProductsDetails.find({
      price: { $gte: startPrice, $lte: endPrice },
      IsActive:true,
      isAvailable:true
    })
      .populate('brandName')
      .populate('categoryName')
      .populate('subCategoryName');

    // Check if products are found
    if (!products.length) {
      return res.status(200).json({ message: 'No products found in the given price range.', products, isOk: false });
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
    const productsWithFullImageUrls = products.map(product => ({
      ...product.toObject(), // Convert Mongoose Document to plain JavaScript object
      productImage: `${process.env.REACT_APP_API_URL}/${product.productImage}`,
      brandName: product.brandName.brandName, // Extract brand name string
      categoryName: product.categoryName.categoryName, // Extract category name string
      subCategoryName: product.subCategoryName.subCategoryName, // Extract sub-category name string
      discountrate : product.price - ((product.price*discount)/100)
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
      discount,
      products: productsWithFullImageUrls // Use updated product objects with full URLs
    });
    console.log(html)

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
    const uploadDir  = `${__basedir}/uploads/Catalogue`// Adjust __dirname if necessary
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
    margin: {
        top: '50px',
        bottom: '50px',
        left: '20px',
        right: '20px'
    },
    displayHeaderFooter: true,
    // headerTemplate: `
    //     <div class="top-header">

    //                 <table style="width:100%;">
    //                     <tbody>
    //                         <tr>
    
    //                             <td style="width:22%; vertical-align:top; float: left;">
    
    //                                 <img src={{logoUrl}} style="width: 100%; height: auto;" />
    
    //                             </td>
    
    //                             <td style="width:3%; vertical-align:top; float: left;"></td>
    
    //                             <td style="width:75%; vertical-align:top; float: right;">
    
    //                                 <div class="address-part" style="text-align: right;">
    
    //                                     <h5 style="color: #a01b1e;">Chanakya - The Bag Studio</h5>
    
    //                                     <p>
    //                                         Address : Opp. Pratap Talkies, opp. Sursagar Lake (East), Vadodara, Gujarat
    //                                         390001, India <br>
    //                                         Address : Chanakya The bag Studio, vadivadi, near race course circle, race
    //                                         course road, Vadodara, Gujarat, India
    //                                     </p>
    
    //                                     <p>
    //                                         Contact No. : 919974017725 | 919974017727
    //                                     </p>
    
    //                                     <p>chanakyathebagstudio@gmail.com</p>
    
    //                                 </div>
    
    //                             </td>
    
    
    //                         </tr>
    //                     </tbody>
    //                 </table>
    
    //             </div>
    // `,
    // footerTemplate: `
    //      <div class="footer-content">

    //                 <table class="footer-part" style="width:100%">
    //                     <tr>
    //                         <td style="width:30%;">
    //                             <img src={{logoBg}} style="padding:10px; width:80px; height:auto;" />
    //                         </td>
        
    //                         <td style="width:55%; vertical-align: bottom; text-align:right">
    //                             <p style="color:#222; font-weight: 500; font-size: 10pt;">www.thebagsandgifts.shop</p>
    //                         </td>
        
    //                         <td style="width:5%; vertical-align: bottom; text-align:right; padding:0; position:relative;">
    //                             <img src="img/number-shape.png" style="width:60px; height:auto;" />
    //                             <span class="number-page">01</span>
    //                         </td>
    //                     </tr>
    //                 </table>

    //             </div>
    // `,
    // pageRanges: '1-' // Specify which pages to include in the footer
      });

    
  
      console.log(`PDF saved successfully to: ${filename}`);
      
      await browser.close();


      
    res.status(200).json({filename , isOk:true});
    }
    
    // Launch Puppeteer to generate the PDF
  //  res.send(tempfun(html))
   catch (err) {
    console.error('Error generating PDF:', err);
    next(err);
  }
};

// const puppeteer = require('puppeteer');
// const path = require('path'); // Import path module for path manipulation
// const fs = require('fs'); // Import fs module to check directory existence
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
          price: { 
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

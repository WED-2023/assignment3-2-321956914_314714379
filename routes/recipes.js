var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");
const DButils = require("./utils/DButils");

/**
 * This path searches for recipes in the spooncular api.
 */
router.get("/search", async (req, res) => {
    let user_id;
    try{
      if (req.session && req.session.user_id){
      user_id = req.session.user_id;
        }
      const { search, numresults = 5, cuisine, diet, intolerance } = req.query; 
      console.log("search request query:", req.query);
      const recipes = await recipes_utils.getSearchResults(search, numresults, cuisine, diet, intolerance,user_id);

      if (recipes.length === 0) {
        return res.status(404).send({ message: "No recipes found" });
      }

      const previews = await recipes_utils.getRecipesPreviewRandSearch(recipes,user_id);
      res.status(200).send(previews);
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


/**
 * This path returns 3 random recipes from the spooncular api
 */
router.get("/random", async (req, res) => {
  let user_id;
  try{
      if (req.session && req.session.user_id){
      user_id = req.session.user_id;
      }
      console.log("generating random recipes");
      const recipes = await recipes_utils.getRandomRecipes();
      const previews = await recipes_utils.getRecipesPreviewRandSearch(recipes,user_id);
      res.status(200).send(previews);
  }
  catch (error) {
      console.error("Error generating random recipes:", error);
      res.status(500).send({ message: "Internal Server Error" });
  }

});

/**
 * This path returns a full details of a recipe by its id from the spooncular api
 */
router.get("/:recipeid", async (req, res) => {
  let user_id;
  try {
    if (req.session && req.session.user_id){
      user_id = req.session.user_id;
    }
    console.log("getting recipe information for recipe id: " + req.params.recipeid);
    const recipe = await recipes_utils.getSpoonRecipeInformation(req.params.recipeid, user_id);
    console.log("recipe information returned successfully");
    res.status(200).send(recipe.data);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).send({ message: "Recipe not found" });
    }
    else {
    res.status(500).send({ message: "Internal Server Error" });
  }
}});

/**
 * This path returns a full details of a recipe by its id from the database.
 */
router.get("/me/:recipeid", async (req, res) => {
  console.log("checking session user_id: " + req.session.user_id);
    if (req.session && req.session.user_id) {
      DButils.execQuery("SELECT user_id FROM users").then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
        }
        else {
          return res.sendStatus(401);
        }
      })
    } else {
      return res.sendStatus(401);
    }
  let user_id = req.session.user_id;
  try {
    console.log("getting recipe information for recipe id from database: " + req.params.recipeid);
    const recipe = await recipes_utils.getLocalRecipeInformation(req.params.recipeid, user_id);
    console.log("recipe information returned successfully");
    res.status(200).send(recipe);
  } catch (error) {
    if (error.status === 404) {
      res.status(404).send({ message: "Recipe not found" });
    }
    else {
    res.status(500).send({ message: "Internal Server Error" });
  }
}}
);
  

/**
 * This path adds a new recipe to the database.
 */
router.post("/", async (req, res) => {
  console.log("checking session user_id: " + req.session.user_id);
    if (req.session && req.session.user_id) {
      DButils.execQuery("SELECT user_id FROM users").then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
        }
        else {
          return res.sendStatus(401);
        }
      })
    } else {
      return res.sendStatus(401);
    }

  try {
    const user_id = req.session.user_id;
    const {
      recipename,
      image,
      preparationTime,
      isVegetarian,
      isVegan,
      isGlutenFree,
      servingsAmount,
      summary,
      ingredients,
      instructions,
      familyrecipe,
      familyowner,
      whenmade
    } = req.body;

    // Validate that all required parameters are present
    if (
      !recipename ||
      !image ||
      preparationTime === undefined ||
      isVegetarian === undefined ||
      isVegan === undefined ||
      isGlutenFree === undefined ||
      servingsAmount === undefined ||
      !summary ||
      !ingredients ||
      !instructions
    ) {
      return res.status(400).send({ message: "Missing required parameters" });
    }

    console.log("validated parameters successfully");

    if (!Array.isArray(ingredients) || !ingredients.every(item => typeof item === "string")) {
      return res.status(400).send({ message: "ingredients must be an array of strings" });
    }

    if (!Array.isArray(instructions) || !instructions.every(item => typeof item === "string")) {
      return res.status(400).send({ message: "instructions must be an array of strings" });
    }
    
    console.log("validated ingredients and instructions successfully");

    // Build recipe object with correct types for DB
    const recipeData = {
      user_id,
      name: recipename,
      image,
      preparationTime,
      isVegetarian: isVegetarian ? 1 : 0,
      isVegan: isVegan ? 1 : 0,
      isGlutenFree: isGlutenFree ? 1 : 0,
      servingsAmount,
      summary,
      ingredients: JSON.stringify(ingredients),
      instructions: JSON.stringify(instructions),
      familyrecipe,
      familyowner,
      whenmade
    };


     await recipes_utils.addRecipeToDB(recipeData);
     res.status(201).send("The Recipe was successfully created");

  } catch (error) {
    console.error("Error adding recipe to DB:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});





module.exports = router;

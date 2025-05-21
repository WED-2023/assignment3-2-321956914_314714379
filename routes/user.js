var express = require("express");
var router = express.Router();
const DButils = require("./utils/DButils");
const user_utils = require("./utils/user_utils");
const recipe_utils = require("./utils/recipes_utils");

/**
 * Authenticate all incoming requests by middleware
 */
router.use(async function (req, res, next) {
  console.log("checking session user_id: " + req.session.user_id);
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users").then((users) => {
      if (users.find((x) => x.user_id === req.session.user_id)) {
        req.user_id = req.session.user_id;
        next();
      }
    }).catch(err => next(err));
  } else {
    res.sendStatus(401);
  }
});


/**
 * This path gets body with recipeId and save this recipe in the favorites list of the logged-in user
 */
router.post('/favorites', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeid;
    const source = req.body.source;
    if (!recipe_id) {
      return res.status(400).send("Recipe ID is required in the request body");
    }

    if(source !== "spoon" && source !== "local"){
      return res.status(400).send("Source has to be either 'spoon' or 'local'");
    }
    
    await user_utils.markAsFavorite(user_id, recipe_id,source);
    res.status(200).send("The Recipe successfully saved as favorite");
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).send("Recipe is already in favorites");
    }
    else {
      res.status(500).send({ message: "Internal Server Error" });
    }
  }
});

/**
 * This path returns the favorites recipes that were saved by the logged-in user
 */
router.get('/favorites', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const favorites = await user_utils.getFavoriteRecipes(user_id);
    if (favorites.length === 0) {
      return res.status(404).send("No favorite recipes found for this user");
    }
    const results = await recipe_utils.getRecipesPreview(favorites);
    res.status(200).send(results);
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * This path returns a list of all recipes that the currently authenticated user has created.
 */
router.get('/myrecipes', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const my_recipes_id = await user_utils.getMyRecipes(user_id);
    if (my_recipes_id.length === 0) {
      return res.status(404).send("No recipes found for this user");
    }
    const results = await recipe_utils.getRecipesPreview(my_recipes_id);
    res.status(200).send(results);
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * This path returns a list of all last viewed recipes by the currently authenticated user.
 */
router.get("/lastviewed", async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const last_viewed_recipes_id = await user_utils.getLastViewedRecipes(user_id);

    if (last_viewed_recipes_id.length === 0) {
      return res.status(404).send("No viewed recipes found for this user");
    }
    const results = await recipe_utils.getRecipesPreview(last_viewed_recipes_id);
    res.status(200).send(results);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

/**
 * This path returns the last search made by the currently authenticated user.
 */
router.get("/lastsearch", async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const last_search = await user_utils.getLastSearch(user_id);
    if (last_search === null) {
      return res.status(404).send("No search history found for this user");
    }
    res.status(200).send(last_search);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});



module.exports = router;

var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

router.get("/", (req, res) => res.send("im here"));


/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeId", async (req, res, next) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    next(error);
  }
});

/**
 * This path saves a new recipe to the database
 */
router.post('/favorites', async (req, res) => {
  try {
    const user_id = req.session.user_id;
    const recipe_id = req.body.recipeid;
    const source = req.body.source;
    if (!recipe_id) {
      return res.status(400).send("Recipe ID is required in the request body");
    }

    if(source !== "spoon" || source !== "local"){
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



module.exports = router;

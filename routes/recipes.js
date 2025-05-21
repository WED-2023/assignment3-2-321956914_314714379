var express = require("express");
var router = express.Router();
const recipes_utils = require("./utils/recipes_utils");

/**
 * This path returns 3 random recipes from the spooncular api
 */
router.get("/random", async (req, res) => {
  try{
      console.log("generating random recipes");
      const recipes = await recipes_utils.getRandomRecipes();
      res.status(200).send(recipes);
  }
  catch (error) {
      res.status(500).send({ message: "Internal Server Error" });
  }

});

/**
 * This path returns a full details of a recipe by its id
 */
router.get("/:recipeid", async (req, res) => {
  try {
    const recipe = await recipes_utils.getRecipeDetails(req.params.recipeId);
    res.send(recipe);
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

/**
 * This path adds a new recipe to the database.
 */

// add authentication for adding recipe 

router.post("/", async (req, res) => {
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
      instructions
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
      instructions: JSON.stringify(instructions)
    };


     await recipes_utils.addRecipeToDB(recipeData);
     res.status(201).send("The Recipe was successfully created");

  } catch (error) {
    console.error("Error adding recipe to DB:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});





module.exports = router;

const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
var mysql = require('mysql2');


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */
async function getSpoonRecipeInformation(recipe_id,user_id) {
    try{
        if(user_id){
            console.log("found connected user,adding recipe to viewed recipes");
            await DButils.execQuery(
        `INSERT INTO viewed_recipes (user_id, recipe_id, source) VALUES (${user_id}, ${recipe_id}, 'spoon')`
        );    }
    }

    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log("recipe already exists in viewed recipes, updating view time");
            await DButils.execQuery(
                `UPDATE viewed_recipes SET view_time = CURRENT_TIMESTAMP WHERE user_id = ${user_id} AND recipe_id = ${recipe_id} AND source = 'spoon'`
            );
        }
        else {
            console.log("error while adding recipe to viewed recipes: ", error);
        }
    }

    finally{
        return await axios.get(`${api_domain}/${recipe_id}/information`, {
            params: {
                includeNutrition: false,
                apiKey: process.env.spooncular_apiKey
            }
        });
    }

}


async function getLocalRecipeInformation(recipe_id,user_id) {
    try{
        if(user_id){
            console.log("found connected user,adding recipe to viewed recipes");
            await DButils.execQuery(
        `INSERT INTO viewed_recipes (user_id, recipe_id, source) VALUES (${user_id}, ${recipe_id}, 'local')`
        );    }
    }

    catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            console.log("recipe already exists in viewed recipes, updating view time");
            await DButils.execQuery(
                `UPDATE viewed_recipes SET view_time = CURRENT_TIMESTAMP WHERE user_id = ${user_id} AND recipe_id = ${recipe_id} AND source = 'local'`
            );
        }
        else {
            console.log("error while adding recipe to viewed recipes: ", error);
        }
    }

    finally{
        // Select the recipe from the recipes table
        const result = await DButils.execQuery(
            `SELECT * FROM recipes WHERE recipe_id = ${mysql.escape(recipe_id)}`
        );
        if (result.length === 0) {
            throw { status: 404, message: "Recipe not found" };
        }
        return result[0];
    }

}

async function getRecipesPreview(recipes,user_id) { // takes as input recipe ids with sources and user id.
    console.log("getting recipes preview");
    const previews = [];
    for (const recipe of recipes) {
        console.log("recipe: ", recipe);
        let recipeInfo;
        if (recipe.source === 'local') {
            console.log("getting recipe information from local database");
            recipeInfo = await DButils.execQuery(
            `SELECT * FROM recipes WHERE recipe_id = ${mysql.escape(recipe.recipeid)}`
        );

        } else if (recipe.source === 'spoon') {
            console.log("getting recipe information from spooncular api");
            const response = await axios.get(`${api_domain}/${recipe.recipeid}/information`, {
            params: {
                includeNutrition: false,
                apiKey: process.env.spooncular_apiKey
            }
        });
            recipeInfo = response.data;
        } else {
            console.log("error: recipe source is not valid " + recipe.source);
            continue;
        }

        console.log("recipeInfo: ", recipeInfo);

        let isFavorite = false;
        let isViewed = false;

        const fav = await DButils.execQuery(
            `SELECT * FROM favorite_recipes WHERE user_id = ${mysql.escape(user_id)} AND recipe_id = ${mysql.escape(recipe.recipeid)} AND source = ${mysql.escape(recipe.source)}`
        );
        isFavorite = fav.length > 0;

        const viewed = await DButils.execQuery(
            `SELECT * FROM viewed_recipes WHERE user_id = ${mysql.escape(user_id)} AND recipe_id = ${mysql.escape(recipe.recipeid)} AND source = ${mysql.escape(recipe.source)}`
        );
        isViewed = viewed.length > 0;
    

        previews.push({
            id: recipeInfo.id || recipeInfo[0].recipe_id,
            source: recipe.source,
            name: recipeInfo.title || recipeInfo[0].name,
            preparationTime: recipeInfo.readyInMinutes || recipeInfo[0].preparationTime,
            image: recipeInfo.image || recipeInfo[0].image,
            popularity: recipeInfo.aggregateLikes || recipeInfo[0].likes,
            isVegan: recipeInfo.vegan !== undefined ? recipeInfo.vegan : recipeInfo[0].isVegan === 1,
            isVegetarian: recipeInfo.vegetarian !== undefined ? recipeInfo.vegetarian : recipeInfo[0].isVegetarian === 1,
            isGlutenFree: recipeInfo.glutenFree !== undefined ? recipeInfo.glutenFree : recipeInfo[0].isGlutenFree === 1,
            isFavorite,
            isViewed,
        });
    }
    return previews;
}

// takes as input whole recipes , will be used in random and search previews. user id is to trach likes and views. previews do not update those.
// they are from spooncular api and are not saved in the database.
async function getRecipesPreviewGivenFullDetails(recipes,user_id) { 
    console.log("getting recipes preview for random or search");
    console.log("user id: ", user_id);
    if (user_id)
    {
        console.log("found connected user, checking if he liked or viewed the recipes");
    }

    else{
        console.log("user is not connected, setting isFavorite and isViewed to false");

    }
    const previews = [];
    const source = 'spoon'; // default source is spoon since the random is from the spoon api.
    for (const recipe of recipes) {
        let isFavorite = false;
        let isViewed = false;

        const fav = await DButils.execQuery(
            `SELECT * FROM favorite_recipes WHERE user_id = ${mysql.escape(user_id)} AND recipe_id = ${mysql.escape(recipe.id)} AND source = '${source}'`
        );
        isFavorite = fav.length > 0;

        const viewed = await DButils.execQuery(
            `SELECT * FROM viewed_recipes WHERE user_id = ${mysql.escape(user_id)} AND recipe_id = ${mysql.escape(recipe.id)} AND source = '${source}'`
        );
        isViewed = viewed.length > 0;
        // Check for missing fields and fetch from Spoonacular if needed ( happens after search)
        let needsFetch = false;
        let fetchedData = {};
        if (
            recipe.readyInMinutes === undefined ||
            recipe.aggregateLikes === undefined ||
            recipe.vegan === undefined ||
            recipe.vegetarian === undefined ||
            recipe.glutenFree === undefined
        ) {
            needsFetch = true;
        }

        if (needsFetch) {
            try {
            const response = await axios.get(`${api_domain}/${recipe.id}/information`, {
                params: {
                includeNutrition: false,
                apiKey: process.env.spooncular_apiKey
                }
            });
            fetchedData = response.data;
            } catch (err) {
            console.error("Failed to fetch missing recipe details from spoon:", err);
            }
        }

        // Fill missing fields from fetchedData if available
        recipe.readyInMinutes = recipe.readyInMinutes !== undefined ? recipe.readyInMinutes : fetchedData.readyInMinutes;
        recipe.aggregateLikes = recipe.aggregateLikes !== undefined ? recipe.aggregateLikes : fetchedData.aggregateLikes;
        recipe.vegan = recipe.vegan !== undefined ? recipe.vegan : fetchedData.vegan;
        recipe.vegetarian = recipe.vegetarian !== undefined ? recipe.vegetarian : fetchedData.vegetarian;
        recipe.glutenFree = recipe.glutenFree !== undefined ? recipe.glutenFree : fetchedData.glutenFree;
        previews.push({
            id: recipe.id,
            source: source,
            name: recipe.title,
            preparationTime: recipe.readyInMinutes,
            image: recipe.image,
            popularity: recipe.aggregateLikes,
            isVegan: recipe.vegan,
            isVegetarian: recipe.vegetarian,
            isGlutenFree: recipe.glutenFree,
            isFavorite,
            isViewed,
        });
    }
    return previews;
}

async function getRandomRecipes() {
    let response =  await axios.get(`${api_domain}/random`, {
        params: {
            number: 3,
            apiKey: process.env.spooncular_apiKey
        }
    });
    console.log("random recipes response returned successfully");
    const recipes = response.data.recipes;
    return recipes;   
}

async function addRecipeToDB(recipeData) {
    console.log("initialize adding recipe to DB");
    const query = `
        INSERT INTO recipes (
        user_id, name, image, preparationTime,
        isVegetarian, isVegan, isGlutenFree,
        servingsAmount, summary, ingredients, instructions
        ) VALUES (
        ${mysql.escape(recipeData.user_id)},
        ${mysql.escape(recipeData.name)},
        ${mysql.escape(recipeData.image)},
        ${mysql.escape(recipeData.preparationTime)},
        ${mysql.escape(recipeData.isVegetarian)},
        ${mysql.escape(recipeData.isVegan)},
        ${mysql.escape(recipeData.isGlutenFree)},
        ${mysql.escape(recipeData.servingsAmount)},
        ${mysql.escape(recipeData.summary)},
        ${mysql.escape(recipeData.ingredients)},
        ${mysql.escape(recipeData.instructions)}
        )
    `;
    console.log("query to add recipe to DB: ", query);
    
    console.log("adding recipe to DB");
    await DButils.execQuery(query);
    console.log("recipe added to DB successfully");
}

async function getSearchResults(search, numresults = 5, cuisine, diet, intolerance) {
    try {
      console.log("fetching search results from spoon api");
      const params = {
        query: search,
        number: numresults,
        apiKey: process.env.spooncular_apiKey,
      };
  
      // Add optional filters
      if (cuisine) params.cuisine = cuisine;
      if (diet) params.diet = diet;
      if (intolerance) params.intolerances = intolerance;
      console.log("filters added")
      const response = await axios.get(`${api_domain}/complexSearch`, { params });
      console.log("search results response returned successfully");
      console.log("response data: ", response.data);
      if( response.data.results.length === 0){
        console.log("no recipes found for the search");
        return [];
      }
      return response.data.results;

    } catch (error) {
      console.error("error while fetching search results:", error);
      throw error;
    }
  }

exports.addRecipeToDB = addRecipeToDB;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getSpoonRecipeInformation = getSpoonRecipeInformation;
exports.getLocalRecipeInformation = getLocalRecipeInformation;
exports.getRecipesPreviewGivenFullDetails = getRecipesPreviewGivenFullDetails;
exports.getSearchResults = getSearchResults;

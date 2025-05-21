const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
const DButils = require("./DButils");
var mysql = require('mysql2');


/**
 * Get recipes list from spooncular response and extract the relevant recipe data for preview
 * @param {*} recipes_info 
 */


async function getRecipeInformation(recipe_id) {
    return await axios.get(`${api_domain}/${recipe_id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipeDetails(recipe_id) {
    let recipe_info = await getRecipeInformation(recipe_id);
    let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

    return {
        id: id,
        title: title,
        readyInMinutes: readyInMinutes,
        image: image,
        popularity: aggregateLikes,
        vegan: vegan,
        vegetarian: vegetarian,
        glutenFree: glutenFree,
        
    }
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

async function getRecipesPreview(recipe_ids) {
    return recipe_ids;
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

exports.addRecipeToDB = addRecipeToDB;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getRecipeDetails = getRecipeDetails;




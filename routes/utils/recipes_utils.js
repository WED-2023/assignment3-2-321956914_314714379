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
        return result[0];
    }

}

async function getRecipesPreview(recipe_ids) { // it is needed to consider that there are 2 types of recipes: local and spoonacular.
    return recipe_ids;
}

// async function getRecipeDetails(recipe_id) {
//     let recipe_info = await getRecipeInformation(recipe_id);
//     let { id, title, readyInMinutes, image, aggregateLikes, vegan, vegetarian, glutenFree } = recipe_info.data;

//     return {
//         id: id,
//         title: title,
//         readyInMinutes: readyInMinutes,
//         image: image,
//         popularity: aggregateLikes,
//         vegan: vegan,
//         vegetarian: vegetarian,
//         glutenFree: glutenFree,
        
//     }
// }

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

exports.addRecipeToDB = addRecipeToDB;
exports.getRandomRecipes = getRandomRecipes;
exports.getRecipesPreview = getRecipesPreview;
exports.getSpoonRecipeInformation = getSpoonRecipeInformation;
exports.getLocalRecipeInformation = getLocalRecipeInformation;



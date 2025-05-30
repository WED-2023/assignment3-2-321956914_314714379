const DButils = require("./DButils");
const recipes_utils = require("./recipes_utils");

async function markAsFavorite(user_id, recipe_id, source) {
    await DButils.execQuery(`insert into favorite_recipes values ('${user_id}',${recipe_id},'${source}')`);
    if (source === 'local') {
        await DButils.execQuery(`update recipes set likes = likes + 1 where recipe_id = ${recipe_id}`);
    }
    if (source === 'spoon') {
        const existing = await DButils.execQuery(`SELECT * FROM favorite_spoon_recipes WHERE recipe_id=${recipe_id}`);
        if (existing.length > 0) {
            await DButils.execQuery(`UPDATE favorite_spoon_recipes SET likes = likes + 1 WHERE recipe_id=${recipe_id}`);
        } else {
            await DButils.execQuery(`INSERT INTO favorite_spoon_recipes (recipe_id, likes, source) VALUES (${recipe_id}, 1, 'spoon')`);
        }
    }
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id,source from favorite_recipes where user_id='${user_id}'`);
    console.log("successfully got the recipes id");
    let favorite_recipes_id_array = [];
    recipes_id.map((recipe) => favorite_recipes_id_array.push({"recipeid":recipe.recipe_id,"source":recipe.source})); 
    return favorite_recipes_id_array;
}

async function getMyRecipes(user_id) {
    const recipes = await DButils.execQuery(`select recipe_id from recipes where user_id='${user_id}'`);
    console.log("successfully got the recipes id");
    let my_recipes_array = [];
    recipes.map((recipe) => my_recipes_array.push({"recipeid":recipe.recipe_id, "source":"local"}));
    return my_recipes_array;
}

async function getFamilyRecipes(user_id) {
    const family_recipes = await DButils.execQuery(
        `SELECT * FROM family_recipes WHERE user_id='${user_id}'`
    );
    console.log("successfully got the family recipes");
    let family_recipes_array = [];
    family_recipes.map((recipe) => {
        recipe.source = "local";
        family_recipes_array.push(recipe);
    });
    return family_recipes_array;
}


async function getLastViewedRecipes(user_id) {
    const recipes = await DButils.execQuery(
        `SELECT recipe_id,source FROM viewed_recipes WHERE user_id='${user_id}' ORDER BY view_time DESC LIMIT 3`
    );
    console.log("successfully got the recipes id");
    let last_viewed_recipes_array = [];
    recipes.map((recipe) => last_viewed_recipes_array.push({"recipeid":recipe.recipe_id,"source":recipe.source}));
    return last_viewed_recipes_array;
}

async function getLastSearch(user_id) {
    const result = await DButils.execQuery(
        `SELECT search_result FROM user_searches WHERE user_id='${user_id}' ORDER BY search_time DESC LIMIT 1`
    );
    let searches = [];
    result.map((res) => searches.push({"searchresult":res.search_result}));
    if (searches.length === 0) {
        console.log("there is no last search result");
        return null;
    }
    console.log("successfully got the last search");
    results_array = []
    for (const element of searches[0].searchresult) { // convert it to an array
        results_array.push(element);
    }
    return await recipes_utils.getRecipesPreviewRandSearch(results_array,user_id);
}

exports.getLastSearch = getLastSearch;
exports.getLastViewedRecipes = getLastViewedRecipes;
exports.getMyRecipes = getMyRecipes;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;
exports.getFamilyRecipes = getFamilyRecipes;
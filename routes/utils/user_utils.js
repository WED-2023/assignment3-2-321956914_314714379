const DButils = require("./DButils");

async function markAsFavorite(user_id, recipe_id, source){
    await DButils.execQuery(`insert into favorite_recipes values ('${user_id}',${recipe_id},'${source}')`);
}

async function getFavoriteRecipes(user_id){
    const recipes_id = await DButils.execQuery(`select recipe_id,source from favorite_recipes where user_id='${user_id}'`);
    console.log("successfully got the recipes id");
    let favorite_recipes_id_array = [];
    recipes_id.map((recipe) => favorite_recipes_id_array.push([recipe.recipe_id,recipe.source])); //extracting the recipe ids into array
    return favorite_recipes_id_array;
}

async function getMyRecipes(user_id) {
    const recipes = await DButils.execQuery(`select recipe_id from recipes where user_id='${user_id}'`);
    console.log("successfully got the recipes id");
    let my_recipes_array = [];
    recipes.map((recipe) => my_recipes_array.push(recipe.recipe_id));
    return my_recipes_array;
}

async function getLastViewedRecipes(user_id) {
    const recipes = await DButils.execQuery(
        `SELECT recipe_id,source FROM viewed_recipes WHERE user_id='${user_id}' ORDER BY view_time DESC LIMIT 3`
    );
    console.log("successfully got the recipes id");
    let last_viewed_recipes_array = [];
    recipes.map((recipe) => last_viewed_recipes_array.push(recipe.recipe_id,recipe.source));
    return last_viewed_recipes_array;
}

async function getLastSearch(user_id) {
    const result = await DButils.execQuery(
        `SELECT search_query FROM user_searches WHERE user_id='${user_id}' ORDER BY search_time DESC LIMIT 1`
    );
    console.log("successfully got the last search query");
    let searches = [];
    result.map((res) => searches.push(res.search_query));
    console.log(searches)
    return searches.length > 0 ? searches[0] : null;
}

exports.getLastSearch = getLastSearch;
exports.getLastViewedRecipes = getLastViewedRecipes;
exports.getMyRecipes = getMyRecipes;
exports.markAsFavorite = markAsFavorite;
exports.getFavoriteRecipes = getFavoriteRecipes;

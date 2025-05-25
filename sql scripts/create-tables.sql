CREATE TABLE `users` (
    `user_id` int NOT NULL AUTO_INCREMENT COMMENT 'User ID generated automatically and incremented for each new user',
    `username` varchar(255) NOT NULL COMMENT 'Username for the user , it is unique identifier',
    `firstname` varchar(100) NOT NULL COMMENT 'First name of the user',
    `lastname` varchar(100) NOT NULL COMMENT 'Last name of the user',
    `country` varchar(100) NOT NULL COMMENT 'Country of the user',
    `password` varchar(255) NOT NULL COMMENT 'Hashed password of the user',
    `email` varchar(255) NOT NULL COMMENT 'Email address of the user',
    PRIMARY KEY (`user_id`),
    UNIQUE KEY `username` (`username`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Table to store user information after registration'

CREATE TABLE favorite_recipes (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  source ENUM('local', 'spoon') NOT NULL,
  PRIMARY KEY (user_id, recipe_id, source)
)

CREATE TABLE favorite_spoon_recipes(
  recipe_id INT NOT NULL,
  likes INT NOT NULL,
  source ENUM('local', 'spoon') NOT NULL,
  PRIMARY KEY (recipe_id)
)

CREATE TABLE viewed_recipes (
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  source ENUM('local', 'spoon') NOT NULL,
  view_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id, source)
)

CREATE TABLE family_recipes(
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  familyowner VARCHAR(100) NOT NULL,
  whenmade VARCHAR(100) NOT NULL,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id)
)

CREATE TABLE user_searches (
  user_id INT NOT NULL,
  search_result JSON NOT NULL,
  search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
)


CREATE TABLE recipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  image VARCHAR(255) NOT NULL,
  preparationTime INT NOT NULL,
  likes INT DEFAULT 0,
  isVegetarian BOOLEAN NOT NULL,
  isVegan BOOLEAN NOT NULL,
  isGlutenFree BOOLEAN NOT NULL,
  servingsAmount INT NOT NULL,
  summary TEXT NOT NULL,
  ingredients JSON NOT NULL,
  instructions JSON NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);


CREATE TABLE `users` (
    `id` int NOT NULL AUTO_INCREMENT COMMENT 'User ID generated automatically and incremented for each new user',
    `username` varchar(255) NOT NULL COMMENT 'Username for the user , it is unique identifier',
    `firstname` varchar(100) NOT NULL COMMENT 'First name of the user',
    `lastname` varchar(100) NOT NULL COMMENT 'Last name of the user',
    `country` varchar(100) NOT NULL COMMENT 'Country of the user',
    `password` varchar(255) NOT NULL COMMENT 'Hashed password of the user',
    `email` varchar(255) NOT NULL COMMENT 'Email address of the user',
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`),
    UNIQUE KEY `email` (`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'Table to store user information after registration'
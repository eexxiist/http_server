require("dotenv").config();
const winston = require("winston"),
    http = require("http"),
    url = require("url"),
    fs = require("fs"),
    path = require("path"),
    moment = require("moment"),
    { generateUUID } = require("./utils/user"),
    {
        getUserData,
        createUserNote,
        deleteUserNote,
        editUserNote,
        setAuthor,
        setLinks,
    } = require("./controller/userController"),
    { PORT: port, HOST: host } = process.env;

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }

    res.setHeader("Content-Type", "text/plain");

    const parsedUrl = url.parse(req.url, true),
        { query, pathname } = parsedUrl;

    if (pathname === "/api" && req.method === "GET") {
        // Method - GET
        // ROUTE: /api
        // @params id - String
        // @params (sort) -> type + direction - String + Boolean (true -> upper; false - lower)
        // @params amount -> Number
        // example: host:port/api?id=1&amount=10&type=Title&direction=true
        getUserData(req, res);
    } else if (pathname === "/api" && req.method === "POST") {
        // Method - POST
        // ROUTE: /api
        // @body: {title<String>, message<String>}
        // example: host:port/api
        createUserNote(req, res);
    } else if (pathname === "/api" && req.method === "DELETE") {
        // Method - DELETE
        // ROUTE: /api
        // @params id->String
        // example: host:port/api?id=8d7e9d7e-7d1e-4c7b-9d8d-8d7c1d7d8e8d
        deleteUserNote(req, res);
    } else if (pathname === "/api" && req.method === "PUT") {
        // Method - PUT
        // ROUTE: /api
        // @body: {title<String>, message<String>}
        // @params id->String
        // example: host:port/api?id=8d7e9d7e-7d1e-4c7b-9d8d-8d7c1d7d8e8d?message=
        editUserNote(req, res);
    } else if (pathname === "/api/author" && req.method === "POST") {
        // Method - POST
        // ROUTE: /api/author
        // @body: {name<String>, surname<String>}
        // @params id->String
        // example: host:port/api/author?id=8d7e9d7e-7d1e-4c7b-9d8d-8d7c1d7d8e8d
        setAuthor(req, res);
    } else if (pathname === "/api/link" && req.method === "PUT") {
        // Method - PUT
        // ROUTE: /api
        // @body: {sourceId<String>, targetId<String>}
        // @params amount -> Number
        // example: host:port/api/link?id=8d7e9d7e-7d1e-4c7b-9d8d-8d7c1d7d8e8d
        setLinks(req, res);
    }
});

server.listen(port, (error) => {
    error ? console.log(error) : console.log("Server create");
});

// 1. Запрос на добавление автора сообщения (name, surname, date - moment).
// Запрос на добавление по id (post);

// {
//     "title": "Note title",
//     "message": "Note message",
//     "author": {
//         "name": "Ivan",
//         "surname": "Ivan",
//         "date": "Ivan"
//     },
//     "id": "cc59e1ac-efe3-492f-8904-3b3ff2b48397"
// },

// 2. Дописать получение сообщений по дате или по имени.

// 3. Написать связывание записей. Запрос на связь записи с id 1 к записи id 2 означает что
// в записи 1 появится ссылка на запись 2 и в записе 1 на запись 2
// Если сообщение перепривязывается, то все старые связи этого сообщения удаляются

// {
//     "title": "Note title",
//     "message": "Note message",
//     "id": "1",
//     link: '3'
// }

// {
//     "title": "Note title",
//     "message": "Note message",
//     "id": "2",
// }

// {
//     "title": "Note title",
//     "message": "Note message",
//     "id": "3",
//     link: 1
// }

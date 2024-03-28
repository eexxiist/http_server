require("dotenv").config();
const winston = require("winston"),
    http = require("http"),
    url = require("url"),
    fs = require("fs"),
    port = process.env.PORT,
    { generateUUID } = require("./utils/user"),
    {getUserData, createUserNote, deleteUserNote, editUserNote} = require("./controller/userController")

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

    // Method - GET
    // ROUTE: /api
    // @params id - String
    // @params (sort) -> type + direction - String + Boolean (true -> upper; false - lower)
    // @params amount -> Number
    // example: host:port/api?id=1&amount=10&type=Title&direction=true

    if (pathname === "/api" && req.method === "GET") {
        getUserData(req, res)

    // Method - POST
    // ROUTE: /api
    // @body: {title<String>, message<String>}
    // example: host:port/api
    } else if (pathname === "/api" && req.method === "POST") {
        createUserNote(req, res)

    // Method - DELETE
    // ROUTE: /api
    // @params (sort) -> type + direction - String + Boolean (true -> upper; false - lower)
    // @params amount -> Number
    // example: host:port/api?id=8d7e9d7e-7d1e-4c7b-9d8d-8d7c1d7d8e8d
    } else if (pathname === "/api" && req.method === "DELETE") {
        deleteUserNote(req, res)

    // Method - PUT
    // ROUTE: /api
    // @params (sort) -> type + direction - String + Boolean (true -> upper; false - lower)
    // @params amount -> Number
    // example: host:port/api?id=8d7e9d7e-7d1e-4c7b-9d8d-8d7c1d7d8e8d
    } else if (pathname === "/api" && req.method === "PUT") {
        editUserNote(req, res)
    } else if (pathname === '/api/author' && req.method === 'POST') {
        let body = '';

        req.on("data", (chunk) => {
            body += chunk.toString();
        })

        req.on('end', () => {
            fs.readFile("./data.json", 'utf8', (err, data) => {
                if(err){
                    console.log("Error reading JSON file: ", err.message);
                    res.writeHead(500);
                    res.end({ error: "Internal Server Error" });

                    return;
                }

                try{
                    
                    body = JSON.parse(body);

                    if(body.name && body.surname && Object.keys(body).length === 2){

                        const   parsedUrl = url.parse(req.url, true),
                                {query} = parsedUrl;
                        
                        if(query.id){
                            const arrayData = JSON.parse(data),
                                    selectedIndex = arrayData.findIndex(el => el.id === query.id),
                                    selectedNote = arrayData[selectedIndex];

                            if(!selectedNote){
                                res.writeHead(404);
                                res.end(JSON.stringify({ error: "Invalid note's id" }));
                            }

                            selectedNote.author = {
                                ...body,
                                date: new Date(),
                            };

                            // 4 May 2024, hh:mm:ss am

                            arrayData[selectedIndex] = selectedNote
                        
                            fs.writeFile("./data.json", JSON.stringify(arrayData), "utf8", (err) => {
                                if (err) {
                                    console.log("Error writing: ", err.message);
                                    res.writeHead(500);
                                    res.end({ error: "Internal Server Error" });
                                } else {
                                    res.writeHead(200);
                                    res.end(JSON.stringify(body));
                                }
                            });

                            res.writeHead(200);
                            res.end(JSON.stringify(selectedNote));
                        }else{
                            res.writeHead(329);
                            res.end(JSON.stringify("Invalid note's id"));
                        }

                    }else{
                        res.writeHead(329);
                        res.end(JSON.stringify("Invalid body values"));
                    }

                }catch(err){
                    console.log("Error parsing: ", err.message);
                    res.writeHead(500);
                    res.end({ error: "Internal Server Error" });
                }
            })
        })

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

// 3. Написать связывание записей. Запрос на связь записи с id 1 к записе id 2 означает что
// в записе 1 появится ссылка на запись 2 и в записе 1 на запись 2
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
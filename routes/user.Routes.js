"use strict";
const routes = {
    //User Routes
    "POST /users/": "users.create",
    "POST /users/login": "users.login",

    "GET /users/": "users.userlist",
    "GET /users/finduser": "users.findUser",

    "PUT /users/updatuser": "users.details",
    "DELETE /users/delete": "users.deleteUser",

    "POST /users/change": "users.chnngepassword",
    "DELETE /users/all": "users.deleteAllData",

    //Other Routes
    "POST /users/UserCreate": "nextuser.UserCreate",
    "GET /users/findData": "nextuser.finddetails",

    "DELETE /users/deletedata": "nextuser.delete_service_data",



};
module.exports = routes;
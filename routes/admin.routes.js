"use strict";
const upload = require('../middleware/upload');
const routes = {


    // =======================ADMIN Routes================================//


    "POST /signup": "admin.signup",

    "POST /sign-in": "admin.signin_admin",

    "POST /Upload": [upload, "Image.admin_upload"],

    "POST /FORGET_PASSWORD": "admin.forget_password",

    "POST /Reset_Password": "admin.Reset_password",

    "PUT /update_details": "admin.update",

    "GET /show_admin_details": "admin.show",


    "GET /Allusers/": "admin_service.userlist",

    "GET /FindById/:id": "admin_service.findUser",

    "GET /getimage": "Image.get_All_image",

    "GET /Get_admin_image": "Image.ADMIN_Image",

    "GET /get_THird_service": "thirdparty.Get_data",


    "DELETE /delete/:id": "admin_service.deleteById",

    "DELETE /all_data": "admin_service.deleteAllData",

    "DELETE /Admin_delete": "admin.deleteAdmin",

    "DELETE /delete_image/:id": "Image.Admin_ImageDelete",

    "DELETE /delete_Third_table_details/:id": "thirdparty.THIrd_Delete",









};
module.exports = routes;
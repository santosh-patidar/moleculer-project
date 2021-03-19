"use strict";
const DbConnect = require("../../mixins/db.mixin");
const DbService = require("moleculer-db");
const { MoleculerClientError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const usermodel = require("../../models/user.Model");
const { mailerFun } = require("../../middleware/email");
require("dotenv").config();

/**
* @typedef {import('moleculer').Context} Context Moleculer's Context
*/

module.exports = {
    name: "admin_service",
    mixins: [DbService],
    adapter: DbConnect(),
    model: usermodel,

    settings: {
        /** Secret for JWT */
        JWT_SECRET: process.env.JWT_SECRET || "jwtsecret",

        fields: [
            "id",
            "user_name",
            "email",
            "password",
            "phone",
            "status",
            "createdAt",
            "updatedAt",
        ],

        entityValidator: {
            _id: { type: "string", optional: true },
            user_name: { type: "string", optional: true },
            email: { type: "email", optional: true },
            password: { type: "string", min: 6 },
            phone: { type: "string", optional: true },

        },
    },
    actions: {
        /**
         * ADD NEW USER
         *
         * @actions
         * @param {Object} user - User entity
         *
         * @returns {Object} Created entity & token
         */


        // """"=====================================DELETE USER BY ADMIN""""=======================================//

        deleteById: {
            auth: "required",
            params: {
                id: { type: "string" }
            },
            async handler(ctx) {
                let entity = ctx.params;
                // const getdata = await this.getById(ctx.params.id);
                return this.Promise.resolve().then(() => this.adapter.findOne({
                    where: {
                        id: entity.id, deleted_at: null
                    }
                }),
                    this.adapter.updateById(entity.id, {
                        $set: {
                            status: "inactive",
                            deleted_at: new Date(),
                        }
                    })).then((getdata) => {
                        if (!getdata)
                            return this.Promise.reject(new MoleculerClientError(
                                "user_id not found", 422, "Id Not found...",
                                [{ fields: "Id==> " + entity.id, message: "Is not found" },]
                            )
                            );
                        return {
                            message: "Data deleted succesfully...!"
                        }
                    })
            }
        },

        //""""=====================================FindOne User BY ADMIN=========================================""""//

        findUser: {
            auth: "required",
            params: {
                id: { type: "string" }
            },
            async handler(ctx) {
                let entity = ctx.params;
                const Data = [];
                const getdata = await this.adapter.find({
                    query: { id: entity.id, deleted_at: null },
                    attributes: [
                        "id",
                        "user_name",
                        "email",
                        "password",
                        "phone",
                        "createdAt",
                        "updatedAt",
                    ],
                });
                if (getdata) {
                    console.log(getdata);
                    for (let UserList of getdata) {
                        const SECOND_SERVICE = await ctx.call("nextuser.load", {
                            user_id: entity.id, deleted_at: null,
                        });
                        const IMAGE_SERVICE = await ctx.call("Image.conn", {
                            user_id: entity.id
                        });
                        const THIRD_SERVICE = await ctx.call("thirdparty.connects", {
                            tech_id: entity.id
                        });
                        const data = {
                            id: UserList.id,
                            name: UserList.user_name,
                            email: UserList.email,
                            password: UserList.password,
                            phone: UserList.phone,
                            status: UserList.status,
                            created_at: UserList.created_at,
                            updated_at: UserList.updated_at,
                            Second_Service: SECOND_SERVICE,
                            Third_Service: THIRD_SERVICE,
                            Image_Service: IMAGE_SERVICE
                        };
                        Data.push(data);


                        return { Data }
                    }
                }
                else {
                    return this.Promise.reject(
                        new MoleculerClientError(
                            "User Not Exist..!",
                            422,
                            "Id not found",
                            [{ field: "id=> " + entity.id, message: "is not found", },]
                        ));

                }
                return {
                    message: "Data not found...!"
                }
            }
        },

        //""""===================================UPDATE USER DETAILS BY ADMIN=====================================""""//

        details: {
            auth: "required",
            params: {
                user_name: { type: "string", optional: true },
                phone: { type: "string", optional: true }
            },

            async handler(ctx) {
                const { user_name, phone } = ctx.meta;
                let entity = ctx.params
                const updatedata = await this.adapter.findOne({
                    where: { id: entity.id, deleted_at: null },
                })
                if (!updatedata) {
                    return this.Promise.reject(
                        new MoleculerClientError(
                            "This user is  Not Exist..!",
                            422,
                            "",
                            [{
                                field: "user_id", message: "is not found",
                            }]
                        ));
                } else {
                    const doc = await this.adapter.updateById(entity.id, {
                        $set: {
                            user_name: entity.user_name,
                            phone: entity.phone
                        }
                    })
                    return { message: "User detail`s update successfully..", entity }
                }
            }
        },

        //=====================================CHANGE PASSWORD BY ADMIN==============================================//

        chnngepassword: {
            auth: "required",
            params: {
                email: {
                    type: "string"
                }
            },
            async handler(ctx) {

                const { oldpassword, password, confirmpassword } = ctx.params;
                let entity = ctx.params;
                const getdata = await this.adapter.findOne({
                    where: { email: entity.email }
                });
                if (!getdata) {
                    return this.Promise.reject(
                        new MoleculerClientError(
                            " user does not Exist..!",
                            422,
                            "Email not exist",
                            [{
                                field: entity.email, message: "is not found",
                            }]
                        ));
                }
                else {
                    const { id, email } = getdata;
                    const isMatch = await bcrypt.compare(oldpassword, getdata.password);
                    if (isMatch == true) {
                        if (password == confirmpassword) {
                            const hash = await bcrypt.hashSync(password, 10);
                            console.log(hash);
                            var datapass = this.adapter.updateById(entity.id, {
                                $set: {
                                    password: hash
                                }
                            });
                        }
                        if (!datapass) {
                            return this.Promise.reject(
                                new MoleculerClientError(
                                    "Please Check Password, Password is not Match ..!",
                                    422,
                                    "password not match",
                                    [{
                                        field: "Password", message: "is not Match..",
                                    }]
                                ));
                        }
                        else {
                            return { message: "password change Succesfully..." + " Your Change Password is  " + entity.password }
                        }
                    } else {
                        return this.Promise.reject(
                            new MoleculerClientError(
                                " Password  not Match ..!",
                                422,
                                "password not match",
                                [{
                                    field: "Password", message: "is not Match...",
                                }]
                            ));
                    }
                }
            }
        },

        //======================================DELETE ALL DATA IN DATABASE==========================================//

        deleteAllData: {
            params: {},
            async handler(ctx) {
                let entity = ctx.params;
                const deleteAll = await this.adapter.destroy({
                    where: {}
                });
                if (!deleteAll)
                    return this.Promise.reject(
                        new MoleculerClientError(
                            " Something Went Wrong..!",
                            422,
                            "DeleteAll",
                            [{
                                field: "data", message: "is not found..",
                            }]
                        ));
                return {
                    message: "All Data deleted successfully...", deleteAll
                }

            }
        },

        //=======================================USERLIST GET BY ADMIN================================================//

        userlist: {
            auth: "required",
            params: {},
            async handler(ctx) {
                const Data = [];
                // const entity = ctx.meta.user;
                // console.log(entity);
                const FoundData = await this.adapter.find({
                    query: { deleted_at: null },
                });
                if (FoundData) {
                    for (let UserList of FoundData) {
                        var SECOND_TABLE = await ctx.call("nextuser.load", {
                            user_id: UserList.id,
                            deleted_at: null,
                        });
                        var THIRD_TABLE = await ctx.call("thirdparty.connects", {
                            tech_id: UserList.id,
                            deleted_at: null,
                        });
                        var IMAGE_TABLE = await ctx.call("Image.conn", {
                            user_id: UserList.id,
                            deleted_at: null,
                        });
                        // if (SECOND_TABLE.length <= 0) {
                        //     SECOND_TABLE = "No Data";
                        // }
                        // if (THIRD_TABLE.length <= 0) {
                        //     THIRD_TABLE = "No Data";
                        // }
                        // if (IMAGE_TABLE.length <= 0) {
                        //     IMAGE_TABLE = "No Data";
                        // }
                        const data = {
                            id: UserList.id,
                            name: UserList.user_name,
                            email: UserList.email,
                            password: UserList.password,
                            phone: UserList.phone,
                            status: UserList.status,
                            created_at: UserList.created_at,
                            updated_at: UserList.updated_at,
                            Second_Service: SECOND_TABLE,
                            Third_Service: THIRD_TABLE,
                            Image_Service: IMAGE_TABLE

                        };
                        Data.push(data);
                    }
                    return {
                        message: "Data FoundData : - ",
                        Data,
                    };
                } else {
                    return Promise.reject(
                        new MoleculerClientError(
                            "Not FoundData!",
                            422,
                            "Not FoundData!",
                            [
                                {
                                    message: "Data Not FoundData . ",
                                },
                            ]
                        )
                    );
                }
            },
        },

        //============================================REsolve Token===================================================//

        resolveToken: {
            cache: {
                keys: ["token"],
                ttl: 60 * 60, // 1 hour
            },
            params: {
                token: "string",
            },
            handler(ctx) {
                return new this.Promise((resolve, reject) => {
                    jwt.verify(
                        ctx.params.token,
                        process.env.JWT_SECRET,
                        (err, decoded) => {
                            if (err) return reject(err);
                            resolve(decoded);
                        }
                    );
                }).then((decoded) => {
                    // console.log("user err", decoded.id);
                    // console.log("****************", decoded.id);
                    if (decoded.id) return this.getById(decoded.id);
                });
            },
        },


        //==============================================HASH METHODE==================================================//

        has: {
            params: {},
            async handler(ctx) {
                let entity = ctx.meta.user.id;
                const data = await this.adapter.findOne({
                    where: {
                        deleted_at: null,
                        user_id: entity,
                    },
                    attributes: ["id", "user_id", "location", "task", "createdAt", "updatedAt"],

                });

                return data
            },
        },
    },
    /**
    * Methods
    */
    methods: {
        async tranformlist(ctx, entities) {
            if (Array.isArray(entities)) {
                const result = await this.Promise.all(
                    entities.map((item) => this.transformEntity(ctx, item))
                );
                return { result };
            } else {
                const result = await this.transformEntity(ctx, entities);
                return { result };
            }
        },
        async transformEntity(ctx, entity) {
            if (!entity) return this.Promise.resolve();
            const result = await ctx.call("nextuser.hash", {
                user_id: entity.user_id,
            });
            entity.docInfo = result;
            return entity;
        },
        /**
        * Generate a JWT token from employee entity
        *
        * @param {Object} user
        */
        generateJWT(user) {
            const today = new Date();
            const exp = new Date(today);
            exp.setDate(today.getDate() + 60);

            return jwt.sign(
                {
                    id: user.id,
                    user_name: user.user_name,
                    email: user.email,
                    password: user.password,
                    exp: Math.floor(exp.getTime() / 1000),
                },
                process.env.JWT_SECRET,
            );
        },

        /**
        * Transform returned employee entity. Generate JWT token if neccessary.
        *
        * @param {Object} user
        * @param {Boolean} withToken
        */
        transformEntity(user, withToken, token) {
            if (user) {
                if (withToken) user.token = token || this.generateJWT(user);
            }
            return { user };
        },

        /**
        * Transform returned employee entity as profile.
        *
        * @param {Context} ctx
        * @param {Object} user
        * @param {Object?} loggedInUser
        */
        transformProfile(ctx, user, loggedInUser) {
            if (loggedInUser) {
                return ctx
                    .call("follows.has", {
                        user: loggedInUser.id.toString(),
                        follow: user.id.toString(),
                    })
                    .then((res) => {
                        user.following = res;
                        return { profile: user };
                    });
            }
            return { profile: user };
        },
    },



    /**
    * Fired after database connection establishing.
    */
    async afterConnected() { },
};
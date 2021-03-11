

const DbConnect = require("../mixins/db.mixin");
const DbService = require("moleculer-db");
const { MoleculerClientError } = require("moleculer").Errors;
const Sequelize = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = require("../models/user.Model");
require("dotenv").config();
const { Op } = require("sequelize");

/**
* @typedef {import('moleculer').Context} Context Moleculer's Context
*/

module.exports = {
    name: "users",
    mixins: [DbService],
    adapter: DbConnect(),
    model: users,
    settings: {
        /** Secret for JWT */
        JWT_SECRET: process.env.JWT_SECRET || "jwt-secret",
        fields: [
            "id",
            "user_name",
            "email",
            "password",
            "phone",
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
        create: {
            params: {
                user_name: { type: "string" },
                email: { type: "email" },
                password: { type: "string", min: 1 },
                phone: { type: "string" }
            },
            async handler(ctx) {
                let entity = ctx.params;
                if (entity.email) {
                    const foundData = await this.adapter.findOne({
                        where: { email: entity.email, deleted_at: null }
                    });
                    if (foundData)
                        return Promise.reject(
                            new MoleculerClientError("email Already Exist...!!",
                                422, "email Already Exist...!!",
                                [{ field: "email", message: "email Already Exist...!" }]
                            ));
                };
                entity.password = bcrypt.hashSync(entity.password, 10);
                const doc = await this.adapter.insert(entity);
                const user = await this.transformDocuments(ctx, {}, doc);
                return this.entityChanged("created", user, ctx).then(() => user);
            },
        },

        //Login Api  

        login: {
            params: {
                email: { type: "email" },
                password: { type: "string", min: 1 },
            },
            handler(ctx) {
                const { email, password } = ctx.params;
                return this.Promise.resolve().then(() => this.adapter.findOne({
                    where: { email: email, deleted_at: null },
                })
                )
                    .then((user) => {
                        if (!user)
                            return this.Promise.reject(
                                new MoleculerClientError(
                                    "Email or password is invalid!",
                                    422,
                                    "Email",
                                    [{ field: "email", message: "is not found" },]
                                ));
                        return bcrypt
                            .compare(password, user.password)
                            .then((res) => {
                                if (!res)
                                    return Promise.reject(
                                        new MoleculerClientError(
                                            "Wrong password!",
                                            422,
                                            "Password",
                                            [{ field: "email", message: "is not found", },]
                                        )
                                    );
                                return this.transformDocuments(ctx, {}, user);
                            });
                    })
                    .then((user) => this.transformEntity(user, true, ctx.meta.token));
            },
        },

        //""""FINDALL USER DETAILS""""
        userlist: {
            cache: false,
            async handler(ctx) {
                const finddata = await this.adapter.find({ query: { deleted_at: null } }, {
                    entity: ["id", "email", "user_name", "password", "phone", "createdAt", "updatedAt"]
                });
                const user = await this.transformDocuments(ctx, {}, finddata);
                return { message: "data found..", user }
            }
        },

        // """"DELETE USER""""
        deleteUser: {
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
                        return this.transformDocuments(ctx, {}, getdata)
                    })
            }
        },

        //""""FindOne User """"
        findUser: {
            auth: "require",
            params: {
                id: {
                    type: "string",
                },
            },
            async handler(ctx) {
                const { id } = ctx.params;
                // const getdata = await this.getById(ctx.params.id);
                let entity = ctx.params

                const getdata = await this.adapter.findOne({
                    where: { id: entity.id, deleted_at: null },
                })
                if (!getdata)
                    return this.Promise.reject(
                        new MoleculerClientError(
                            "User Not Exist..!",
                            422,
                            "Id not found",
                            [{ field: "id=> " + entity.id, message: "is not found", },]
                        ));
                const user = await this.transformDocuments(ctx, {}, getdata);
                return { message: "Data found...!", user }
            }
        },

        //""""UPDATE USER DETAILS""""
        details: {
            params: {
                user_name: { type: "string", optional: true },
                phone: { type: "string", optional: true }
            },

            async handler(ctx) {
                const { user_name, phone } = ctx.params;
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

        //CHANGE PASSWORD
        chnngepassword: {
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
                            // var data = { password: hash };
                            // console.log(data);
                            var datapass = this.adapter.updateById(entity.id, {
                                $set: {
                                    password: hash
                                }
                            });
                            // console.log(data);
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

        //DELETE ALL DATA IN DATABASE
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


        /**
        * Get user by JWT token (for API GW authentication)
        *
        * @actions
        * @param {String} token - JWT token
        *
        * @returns {Object} Resolved user
        */
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
                        this.settings.JWT_SECRET,
                        (err, decoded) => {
                            if (err) return reject(err);
                            resolve(decoded);
                        }
                    );
                }).then((decoded) => {
                    console.log("user err", decoded.id);
                    if (decoded.id) return this.getById(decoded.id);
                });
            },
        },
    },
    /**
    * Methods
    */
    methods: {
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
                this.settings.JWT_SECRET
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






























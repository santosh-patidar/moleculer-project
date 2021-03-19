"use strict";
const DbConnect = require("../../mixins/db.mixin");
const DbService = require("moleculer-db");
const { MoleculerClientError } = require("moleculer").Errors;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
require('dotenv').config()
const adminmodel = require('../../models/admin.Model');
const { mailerFun1 } = require('../../middleware/email');
var otpGenerator = require('otp-generator');
const { OTP } = require("../../middleware/otp");

module.exports = {
    name: "admin",
    mixins: [DbService],
    adapter: DbConnect(),
    model: adminmodel,
    settings: {
        /** Secret for JWT */
        JWT_SECRET: process.env.JWT_SECRET || "jwtsecret",

        fields: [
            "id",
            "admin_name",
            "email",
            "password",
            "phone",
            "status",
            "role",
            "createdAt",
            "updatedAt",
        ],

        entityValidator: {
            admin_name: { type: "string", optional: true },
            email: { type: "email", optional: true },
            password: { type: "string", min: 6 },
            phone: { type: "string", optional: true },

        },
    },
    actions: {
        /**
         * ==========================================ADD NEW ADMIN============================================
         *
         * @actions
         * @param {Object} admin - admin entity
         *
         * @returns {Object} Created entity & token
         */


        signup: {
            params: {

                admin_name: { type: "string" },
                email: { type: "email", optional: true },
                password: { type: "string", min: 6 },
                phone: { type: "string", optional: true },

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
                                [{
                                    field: "Password",
                                    message: "email Already Exist...!"
                                }]
                            )
                        )
                };
                entity.password = bcrypt.hashSync(entity.password, 10);
                const doc = await this.adapter.insert(entity);
                mailerFun1(entity);
                const admin = await this.transformDocuments(ctx, {}, doc);
                return this.entityChanged("created", admin, ctx).then(() => admin);
            },
        },

        //=========================================ADMIN LOGIN=====================================// 


        signin_admin: {
            cache: false,
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
                    .then((Userdata) => {
                        if (!Userdata)
                            return this.Promise.reject(
                                new MoleculerClientError(
                                    "Email or password is invalid!",
                                    422,
                                    "Email",
                                    [{ field: "email", message: "is not found" },]
                                ));
                        return bcrypt
                            .compare(password, Userdata.password)
                            .then((res) => {
                                if (!res)
                                    return Promise.reject(
                                        new MoleculerClientError(
                                            "Wrong password!",
                                            422,
                                            "Password",
                                            [{ field: "Password", message: "is not metch", },]
                                        )
                                    );
                                return this.transformDocuments(ctx, {}, Userdata);
                            });
                    })
                    .then((Userdata) => this.transformEntity(Userdata, true, ctx.meta.token));
            },
        },

        //""""===============================UPDATE ADMIN DETAILS""""==============================//


        update: {
            auth: "required",
            params: {
                name: { type: "string", optional: true },
                phone: { type: "string", optional: true }
            },

            async handler(ctx) {
                // const { name, phone } = ctx.params;
                let entity = ctx.params;
                let token = ctx.meta.admin;

                const updatedata = await this.adapter.findOne({
                    where: { id: token.id, deleted_at: null },
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
                    const doc = await this.adapter.updateById(token.id, {
                        $set: {
                            name: entity.name,
                            phone: entity.phone
                        }
                    })
                    return { message: "User detail`s update successfully..", }
                }
            }
        },

        //=================================GET ADMIN DETALIS=======================================//


        show: {
            auth: "required",
            params: {},
            async handler(ctx) {
                const data = [];
                let entity = ctx.meta.admin.id;

                const getadmindata = await this.adapter.findOne({
                    where: { id: entity, deleted_at: null }
                });
                if (getadmindata) {

                    // for (let UserList of getadmindata) {

                    var IMAGE_TABLE = await ctx.call("Image.admin_has", {
                        admin_id: entity,
                        deleted_at: null,
                    });
                    const aw = {
                        id: getadmindata.id,
                        name: getadmindata.name,
                        email: getadmindata.email,
                        password: getadmindata.password,
                        phone: getadmindata.phone,
                        status: getadmindata.status,
                        role: getadmindata.role,
                        created_at: getadmindata.created_at,
                        updated_at: getadmindata.updated_at,
                        Image_Service: IMAGE_TABLE

                    };
                    data.push(aw);
                    // }
                    return {
                        message: "Admin_data ====>>> ",
                        data,
                    };
                }
                else {
                    return Promise.reject(new MoleculerClientError(
                        "something went wrong..!",
                        422,
                        "",
                        [{
                            field: "Error_in", message: "admin_id",
                        }]
                    ));
                }

            }
        },

        //====================================""""DELETE ADMIN""""==================================//
        deleteAdmin: {
            auth: "required",
            params: {

            },
            async handler(ctx) {
                let entity = ctx.meta.admin.id;

                return this.Promise.resolve().then(() => this.adapter.findOne({
                    where: {
                        id: entity, deleted_at: null
                    }
                }),
                    this.adapter.updateById(entity, {
                        $set: {
                            status: "inactive",
                            deleted_at: new Date(),
                        }
                    })).then((getdata) => {
                        if (!getdata)
                            return this.Promise.reject(new MoleculerClientError(
                                "Admin_id not found", 422, "Id Not found...",
                                [{ fields: "Id==> " + entity.id, message: "Is not found" },]
                            )
                            );
                        return {
                            message: "Admin deleted succesfully...!"
                        }
                    })
            }
        },

        //=======================================Forget Admin =======================================//
        forget_password: {
            // auth: "required",
            params: {},
            async handler(ctx) {
                let entity = ctx.params;
                var otp = otpGenerator.generate(6, { upperCase: false, specialChars: false, digits: true, alphabets: false });
                const tempData = { email: entity.email, otp: otp };
                const getdata = await this.adapter.findOne({
                    where: { email: entity.email }
                });
                if (getdata) {
                    OTP(tempData);
                    const upadte = await this.adapter.updateById(entity.id, {
                        $set: {
                            otp: otp
                        },

                    })
                    console.log(tempData);
                    return { message: "otp send..!" }
                } else {
                    return this.Promise.reject(new MoleculerClientError(

                        "Admin_id not found", 422, "Id Not found...",

                        [{ fields: "Id==> " + entity.id, message: "Is not found" },]
                    ));

                }


            }

        },

        //=============================================RESET PASSWORD ================================//
        Reset_password: {
            params: {
                email: { type: "string" },
                password: { type: "string" },
                otp: { type: "string" }
            },
            async handler(ctx) {
                let entity = ctx.params;
                const resetadat = await this.adapter.findOne({
                    where: { email: entity.email, deleted_at: null }
                });
                if (!resetadat) {
                    return this.Promise.reject(new MoleculerClientError(

                        "Email not found", 422, "Email Not found...",

                        [{ fields: "Email " + entity.id, message: "Is not found" },]
                    ));

                } else {
                    const isMatch = await this.adapter.findOne({
                        where: { otp: entity.otp, deleted_at: null }
                    });
                    if (!isMatch) {
                        return this.Promise.reject(new MoleculerClientError(

                            "Opt not found", 422, "Enter Valid OTP..",

                            [{ fields: "OTP ", message: "Is not found" },]
                        ));
                    } else {
                        const hash = await bcrypt.hash(entity.password, 10);
                        console.log(hash);
                        const update = await this.adapter.updateById(entity.id, {
                            $set: {
                                password: hash,
                            }
                        })
                        if (!update) {
                            return this.Promise.reject(new MoleculerClientError(

                                "Something went Wrong", 422, "Something went Wrong..",

                                [{ fields: "issue " + entity.id, message: "password" },]
                            ));
                        } else {
                            return { message: "Password reset successfully..!" }
                        }
                    }
                }
            },
        },
        //==========================================HASH=============================================//
        has: {
            params: {},
            async handler(ctx) {
                let entity = ctx.params;
                var ww = [];
                const UserData = await this.adapter.find({
                    query: {
                        deleted_at: null,
                        id: entity.id,
                    },
                    // attributes: ["id",
                    //     "user_id",
                    //     "image",
                    //     "createdAt",
                    //     "updatedAt",],
                });
                for (let list of UserData) {
                    const data = {
                        id: list.id,
                        user_id: list.user_id,
                        admin_id: list.admin_id,
                        image: list.image,
                        status: list.status,
                        createdAt: list.createdAt,
                        updatedAt: list.updatedAt
                    }
                    // console.log(data);
                    ww.push(data)
                }
                return ww;

            }
        },
        //===========================REsolve Token==================================================//
        resolveToken: {
            cache: {
                keys: ["token"],
                ttl: 30, // 24 hour
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
    },

    methods: {

        /**
        * Generate a JWT token from employee entity
        *
        * @param {Object} user
        */
        generateJWT(admin) {
            const today = new Date();
            const exp = new Date(today);
            exp.setDate(today.getDate() + 30);

            return jwt.sign(
                {
                    id: admin.id,
                    name: admin.name,
                    email: admin.email,
                    password: admin.password,
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
        transformEntity(admin, withToken, token) {
            if (admin) {
                if (withToken) admin.token = token || this.generateJWT(admin);
            }
            return { admin };
        },

        /**
        * Transform returned employee entity as profile.
        *
        * @param {Context} ctx
        * @param {Object} admin
        * @param {Object?} loggedInadmin
        */
        transformProfile(ctx, admin, loggedInadmin) {
            if (loggedInadmin) {
                return ctx
                    .call("follows.has", {
                        admin: loggedInadmin.id.toString(),
                        follow: admin.id.toString(),
                    })
                    .then((res) => {
                        admin.following = res;
                        return { profile: admin };
                    });
            }
            return { profile: admin };
        },
    },


}
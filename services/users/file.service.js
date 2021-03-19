"use strict";
const DbConnect = require("../../mixins/db.mixin");
const DbService = require("moleculer-db");
const { MoleculerClientError } = require("moleculer").Errors;
require('dotenv').config()
const image = require('../../models/images');
const { Op } = require("sequelize");
module.exports = {
    name: "Image",
    mixins: [DbService],
    adapter: DbConnect(),
    model: image,
    settings: {
        fields: [
            "id",
            "user_id",
            "admin_id",
            "image",
            "createdAt",
            "updatedAt"],
        // entityValidator: {
        //     _id: { type: "string", optional: true },
        //     user_id: { type: "string", optional: true },
        //     image: { type: "string", optional: true },
        // },
    },
    actions: {

        //==================================ADMIN=========================================//

        admin_upload: {
            cache: false,
            auth: "required",
            async handler(ctx) {
                let entity = ctx.meta.admin;
                if (entity.id || deleted_at == null) {
                    const file = ctx.options.parentCtx.params.req.file;
                    const filename = file.filename;
                    const url = `${process.env.IMAGE_BASE}${filename}`
                    const data1 = {

                        admin_id: entity.id,
                        image: url,
                    }
                    const data = {
                        status: true,
                        statusCode: 200,
                        filename: filename,
                        image: url,
                        message: 'Image upload successfully.....'
                    }
                    const get = await this.adapter.insert(data1)
                    return { data, data1 }
                } else {
                    return { message: "Id not exist", status: false, statusCode: 404 }
                }
            },
        },

        //==================================hash methode=================================//

        admin_has: {
            params: {},
            async handler(ctx) {
                let entity = ctx.params;
                return await this.adapter.find({
                    query: {
                        deleted_at: null,
                        admin_id: entity.admin_id,
                    }, attributes: [
                        "id",
                        "admin_id",
                        "image",
                        "createdAt",
                        "updatedAt",],
                });

            }
        },

        //==================================ADMIN IMAGE DELETE==========================//

        Admin_ImageDelete: {
            auth: "required",
            params: {
                id: { type: "string" }
            },
            async handler(ctx) {
                let entity = ctx.params;

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

        //=====================================GET ADMIN IMAGE===========================//

        ADMIN_Image: {
            auth: "required",
            cache: false,
            params: {},
            async handler(ctx) {
                let entity = ctx.meta.admin.id;
                const admindata = await this.adapter.findOne({
                    where: { admin_id: entity },
                    attributes: [
                        "id",
                        "admin_id",
                        "image",
                        "createdAt",
                        "updatedAt"],
                });
                const getadmin = await this.adapter.find({
                    query: { admin_id: entity },
                    attributes: [
                        "id",
                        "admin_id",
                        "image",
                        "createdAt",
                        "updatedAt"],
                });
                if (!getadmin) {
                    return Promise.reject(new MoleculerClientError(
                        "User_id Invalid", 404, "Id", [{
                            fields: "image", message: "user_id not valid"
                        }]
                    ))
                }
                else {
                    const admin = await this.transformDocuments(ctx, {}, getadmin);
                    return this.entityChanged("created", admin, ctx).then(() => admin);
                }
            }
        },

        //=======================================USER=====================================//

        fileUpload: {
            auth: "required",
            async handler(ctx) {
                let entities = ctx.meta.user
                const file = ctx.options.parentCtx.params.req.file;
                const filename = file.filename;
                const url = `${process.env.IMAGE_BASE}${filename}`
                const data1 = {
                    user_id: entities.id,

                    image: url,
                }
                const data = {
                    status: true,
                    statusCode: 200,
                    filename: filename,
                    image: url,
                    message: 'Image upload successfully.....'
                }
                const get = await this.adapter.insert(data1)
                return { data, data1 }
            },
        },

        //================================== USER IMAGE DELETE ===========================//

        ImageDelete: {
            auth: "required",
            params: {
                id: { type: "string" }
            },
            async handler(ctx) {
                let entity = ctx.meta.user.id;

                return this.Promise.resolve().then(() => this.adapter.find({
                    query: {
                        user_id: entity, deleted_at: null
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

        image_delete: {
            auth: "required",
            params: {},
            async handler(ctx) {
                let entity = ctx.meta.user.id;
                const deletedata = await this.adapter.find({
                    query:
                    {
                        user_id: entity,
                        deleted_at: null
                    }

                });
                if (!deletedata) {
                    return Promise.reject(new MoleculerClientError(

                        "User_id Invalid",
                        404,
                        "Id",
                        [{
                            fields: "image", message: "user_id not valid"
                        }]
                    ));


                } else {

                    for (let List of deletedata) {
                        const update = await this.adapter.updateById(List.id, {
                            $set: {
                                status: "inactive",
                                deleted_at: new Date(),

                            }

                        });
                    }
                    return { message: "IMAGESS DELETED...!", user_id: entity }

                }
            }
        },
        //===================================GET USER IMAGE===============================//

        user_Image: {
            auth: "required",
            cache: false,
            params: {},
            async handler(ctx) {
                let entity = ctx.meta.user.id;
                const userdata = await this.adapter.find({
                    query: { user_id: entity },
                    attributes: [
                        "id",
                        "user_id",
                        "image",
                        "createdAt",
                        "updatedAt"],
                });
                if (!userdata) {
                    return Promise.reject(new MoleculerClientError(
                        "User_id Invalid", 404, "Id", [{
                            fields: "image", message: "user_id not valid"
                        }]
                    ))
                }
                else {
                    const user = await this.transformDocuments(ctx, {}, userdata);
                    return this.entityChanged("created", user, ctx).then(() => user);
                }
            }
        },

        //=====================================COMBINE============================//

        //=====================================GET ALL IMAGE==============================//

        get_All_image: {
            auth: "required",
            params: {},
            async handler(ctx) {

                const getdata = await this.adapter.find({
                    query: { deleted_at: null }

                });
                if (!getdata) {
                    return Promise.reject(new MoleculerClientError(
                        "Some issue", 404, "Image", [{
                            fields: "images", message: "images not found"
                        }]
                    ));
                } else {
                    return { messge: "IMAGE DATA===>>>", getdata }
                }

            }
        },

        //==================================HASH METHODE===================================//

        conn: {
            params: {},
            async handler(ctx) {
                let entity = ctx.params;
                var ww = [];
                const UserData = await this.adapter.find({
                    query: {
                        deleted_at: null,
                        user_id: entity.user_id,
                    },
                    attributes: ["id",
                        "user_id",
                        "image",
                        "createdAt",
                        "updatedAt",],
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

                    ww.push(data)
                }
                return ww;

            }
        },

        //==================================USER`S TOKEN_ID HASH METHODE======================//

        dd: {
            params: {},
            async handler(ctx) {
                let entity = ctx.meta.user;
                var dog = [];
                const getdata = await this.adapter.find({
                    query: {
                        deleted_at: null,
                        user_id: entity.id
                    },
                    attributes: [
                        "id",
                        "user_id",
                        "image",
                        "createdAt",
                        "updatedAt",]
                });
                for (let list of getdata) {
                    const data = {
                        id: list.id,
                        user_id: list.user_id,
                        image: list.image,
                        status: list.status,
                        createdAt: list.createdAt,
                        updatedAt: list.updatedAt
                    }

                    dog.push(data)
                }
                return dog;

            }
        },
    },
};

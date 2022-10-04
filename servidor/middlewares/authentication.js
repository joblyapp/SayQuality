const sql = require("../utils/sql.js");
const jwt = require("../utils/jwt.js");

module.exports = (request, response, next) => {
    if (!request.headers.authorization) {
        return next();
    };

    let header = request.headers.authorization.split(" ");

    if (header.length != 2) {

        return response
            .status(400)
            .json({
                "error": {
                    "code": 400,
                    "message": "El contenido de la cabezera \"authorization\" no es valido."
                }
            });

    };

    if (header[0] != "Bearer") {

        response
            .status(401)
            .json({
                "error": {
                    "code": 401,
                    "message": "No se admite ese tipo de tokens"
                }
            });

    } else {
        jwt.Check(header[1])
            .then((decode) => {
                sql.GetUser(decode.ID)
                    .then((users) => {
                        if (users.length == 0) {
                            return response
                                .status(500)
                                .json({
                                    "error": {
                                        "code": 500,
                                        "message": "Error interno."
                                    }
                                });
                        };

                        let user = users[0];

                        if (user.status == 3) {
                            return response
                                .status(410)
                                .json({
                                    "error": {
                                        "code": 410,
                                        "message": "Tu cuenta fue eliminada."
                                    }
                                });
                        } else if (user.status == 4) {
                            return response
                                .status(403)
                                .json({
                                    "error": {
                                        "code": 403,
                                        "message": "Tu cuenta fue suspendida."
                                    }
                                });
                        };

                        if (user.deleteAccount) {
                            let msg;
                            if (user.deleteTimestamp < Date.now()) {
                                msg = "Tu cuenta fue eliminada."
                            } else {
                                msg = "Reactiva tu cuenta."
                            };
                            return response
                                .status(410)
                                .json({
                                    "error": {
                                        "code": 410,
                                        "message": msg
                                    }
                                });
                        }

                        request.user = users[0];
                        return next();
                    })
                    .catch((e) => {
                        response
                            .status(500)
                            .json({
                                "error": {
                                    "code": 500,
                                    "message": "Error interno."
                                }
                            });
                    });

            }).catch((e) => {
                response
                    .status(401)
                    .json({
                        "error": {
                            "code": 401,
                            "message": "El token no es valido."
                        }
                    });

            });
    };

}
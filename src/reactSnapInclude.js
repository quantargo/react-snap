const dynamodbLib = require("./dynamodb-lib");

/**
 * can not use null as default for function because of TS error https://github.com/Microsoft/TypeScript/issues/14889
 *
 * @param {{options: *, basePath: string, beforeFetch: ?(function({ page: Page, route: string }):Promise), afterFetch: ?(function({ page: Page, browser: Browser, route: string }):Promise), onEnd: ?(function():void)}} opt
 * @return {Promise}
 */
module.exports.reactSnapInclude = async function () {

    try {
        /* Define all fixed routes */
        let out = [
            "/",
            "/blog",
            "/courses",
            "/qbits",
            "/consulting",
            "/team",
            "/login",
            "/contact",
            "/certificate",
            "/imprint",
            "/privacy",
            "/terms",
        ]

        let allContents = await dynamodbLib.getAllContents()
        out = out.concat(allContents)
        return out
    } catch (e) {
        console.log(e)
    }
};

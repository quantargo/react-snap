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
            "/qbits",
            "/qbits/8c4a3940-dc5b-11e9-8113-c9e44d8d947e",
            "/qbits/258c7480-dc5a-11e9-8113-c9e44d8d947e",
            "/qbits/24d9d0e0-dc5b-11e9-8113-c9e44d8d947e",
            "/qbits/b802d9c0-dc5b-11e9-8113-c9e44d8d947e",
            "/consulting",
            "/blog",
            "/blog/post/2019-04-29-viennar-meetup-march-full-talks-online",
            "/blog/post/2018-09-19-collaborative-data-science",
            "/blog/post/2019-02-25-meetup-announcement",
            "/blog/post/2019-04-11-viennar-meetup-march-impressions",
            "/blog/post/2019-01-23-why-management-loves-overfitting",
            "/blog/post/2020-04-21-new-course-platform-launch",
            "/team",
            "/login",
            "/contact",
            "/certificate",
            "/imprint",
            "/privacy",
            "/terms",
            "/courses",
        ]

        let allContents = await dynamodbLib.getAllContents()
        out = out.concat(allContents)
        return out
    } catch (e) {
        console.log(e)
    }
};

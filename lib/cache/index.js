if (process.env.CACHEDRIVER === "local") {
    process.log.system("Using local cache driver");
    const local = require("./local_driver");
    module.exports = {
        WipeCache: local.WipeCache,
        getMemoryUsage: local.getMemoryUsage,
        addWebtoken: local.addWebtoken,
        getWebtokenSave: local.getWebtokenSave,
        delWebtoken: local.delWebtoken,
        logoutWebtoken: local.logoutWebtoken,
        addPublicStaticResponse: local.addPublicStaticResponse,
        getPublicStaticResponseSave: local.getPublicStaticResponseSave,
        addPrivateStaticResponse: local.addPrivateStaticResponse,
        getPrivateStaticResponseSave: local.getPrivateStaticResponseSave,
        IPLimit: local.IPLimit,
        IPCheck: local.IPCheck,
        LimiterMiddleware: local.LimiterMiddleware
    };
} else if (process.env.CACHEDRIVER === "redis") {
    const redis = require("./redis_driver");
    process.log.system("Using redis cache driver");
    module.exports = {
        WipeCache: redis.WipeCache,
        getMemoryUsage: redis.getMemoryUsage,
        addWebtoken: redis.addWebtoken,
        getWebtokenSave: redis.getWebtokenSave,
        delWebtoken: redis.delWebtoken,
        logoutWebtoken: redis.logoutWebtoken,
        addPublicStaticResponse: redis.addPublicStaticResponse,
        getPublicStaticResponseSave: redis.getPublicStaticResponseSave,
        addPrivateStaticResponse: redis.addPrivateStaticResponse,
        getPrivateStaticResponseSave: redis.getPrivateStaticResponseSave,
        IPLimit: redis.IPLimit,
        IPCheck: redis.IPCheck,
        LimiterMiddleware: redis.LimiterMiddleware
    };
} else {
    process.log.error("Only local and redis cache drivers are supported");
    process.exit(1);
}
# Main Web portal for the EBG association

## Features
- [ ] User management
- [ ] Member management
- [ ] Financial processing for members
- [ ] Public API (Event/Poject/User/Power)
- [ ] Event management
- [ ] Project communities
- [ ] Solar API
- [ ] Pushnotification Hub (Split Service)
- [ ] Server monitoring tool (Split Service)
  - [ ] Systemctl monitoring
  - [ ] Crontab monitoring
  - [ ] Automatic backups + monitoring
  - [ ] Resources, Uptime, Network, IO
  - [ ] Web server config creation / maintaining
  - [ ] SMART Disk Monitoring
  - [ ] Package managers
- [ ] Application Monitoring (Split Service)
  - [ ] Uptime
  - [ ] SSL
- [ ] Pay what you want system
  - [ ] Virtual Server management (Proxmox)
  - [ ] Game server management (Pterodactyl)
# Documentation

## View Rendering

Pages are using FS-based routing. A new folder adds a new depth and `_id_` will be encoded to the `param.id` value that's used in the page rendering. For example, `/event/myEventName` uses this custom value for rendering.

The view renderer has two modes:
1. **Static**: Static pages are usually `/home`, for example. These are generated during runtime when the server starts and then served from an in-memory cache.
2. **Dynamic**: Dynamic pages are generated when requested and are cached for 60 seconds by default (configurable via the `DYNAMICVIEWCACHE_TTL` environment variable, in seconds).

## API Response Cache

You can import the middleware `publicStaticCache` in any API route you like. However, there are a few things to consider:

### Middleware Position
The middleware needs to be placed:
- After the rate-limiting middleware.
- If custom parameters requiring `req.user` are used, `verifyRequest` must be placed before this middleware.

### Middleware Parameters
The middleware has three parameters:
1. **Duration**: The time the response should be cached in milliseconds.
2. **objOptions**: An array listing all important values to consider from the `req` object. For example, if you cache a search with `/api/users?username=Bolver`, this should be listed. Otherwise, if a value for `?username=Vi` is currently cached, it will respond with that result, which would be incorrect. The array takes strings; if you want to refer to `req.user.user_id`, you would write `user.user_id`.
3. **overwrite**: A string that supports parameter formatting like `myCache:id`. When `params.id` is present, it will be filled during middleware execution. This is useful when something changes, and you need to force update the cache. For instance, `/api/users` lists all users, but after making `/api/user/add?user=BolverBlitz`, this user would be missing from `/api/users` until the cache time runs out. To fix this, write the same string into the `writeOverwriteCacheKey` function after you change a value in the database.



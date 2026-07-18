'use strict';

const config = require('./config');
require('./db/migrate').run();
const app = require('./app');

if (config.isProduction) {
    const missing = [];
    if (!config.admin.username) missing.push('ADMIN_USERNAME');
    if (!config.admin.passwordHash) missing.push('ADMIN_PASSWORD_HASH');
    if (!config.admin.sessionSecret) missing.push('ADMIN_SESSION_SECRET');
    if (missing.length) {
        console.error('Refuz să pornesc în producție fără variabilele de mediu obligatorii:', missing.join(', '));
        process.exit(1);
    }
}

app.listen(config.port, () => {
    console.log(`NEBI server pornit pe portul ${config.port} (env: ${config.nodeEnv}, NETOPIA: ${config.netopia.env})`);
});

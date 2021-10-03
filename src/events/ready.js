module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('\x1b[32m%s\x1b[0m' ,`Pronto - ${client.user.tag}`);
        // console.log(`\x1b[32m\x1b[4mPronto - ${client.user.tag}\x1b[0m`);
    }
};
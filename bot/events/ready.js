module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Connecté en tant que ${client.user.tag}`);
    client.user.setActivity('💎 Palace Gestion', { type: 3 }); // WATCHING
  },
};

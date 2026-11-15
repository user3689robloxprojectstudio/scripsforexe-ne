const app = require('../index');
const port = Number(process.env.PORT || 3000);

if (require.main === module) {
  app.listen(port, () => {
    console.log(`ScriptsForExe.net listening on http://localhost:${port}`);
  });
}

module.exports = app;

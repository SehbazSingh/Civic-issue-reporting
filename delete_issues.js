const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/civic-issues')
  .then(() => mongoose.connection.db.collection('issues').deleteMany({}))
  .then(() => {
    console.log('All issues deleted');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error deleting issues:', err);
    process.exit(1);
  });

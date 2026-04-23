const dotenv = require('dotenv');
const app = require('./app');
const connectDB = require('./db/connectDB');

dotenv.config({ path: './.env' });

const port = process.env.PORT || 3000;
console.log('Environment:', process.env.NODE_ENV);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error.message);
    process.exit(1);
  }
};

startServer();

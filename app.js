const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');

// Set up body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

// Set up multer
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb+srv://pavan123:pavan123@cluster0.dlgm5d6.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
});

// Create a user schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  photoPath: String,
});

// Create a user model
const User = mongoose.model('User', userSchema);

// Routes
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', upload.single('photo'), async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const photoPath = req.file ? req.file.path : null;

  // Create a new user
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    photoPath,
  });

  // Save the user
  await newUser.save();

  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Find the user using email
  const user = await User.findOne({ email });

  if (user) {
    bcrypt.compare(password, user.password, (err, result) => {
      if (result) {
        req.session.userId = user.email;
        res.redirect('/dashboard');
      } else {
        res.redirect('/login?error=1');
      }
    });
  } else {
    res.redirect('/login?error=1');
  }
});

app.get('/dashboard', async (req, res) => {
  if (req.session.userId) {
    const user = await User.findOne({ email: req.session.userId });

    res.render('dashboard', { user });
  } else {
    res.redirect('/login');
  }
});


// Test fo dashboard
// app.get('/dashboard', async (req, res) => {
//   res.render('dashboard');
// });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

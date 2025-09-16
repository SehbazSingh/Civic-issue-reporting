// Load env variables (EMAIL_USER, EMAIL_PASS, MONGODB_URI, MAIL_FROM, CORS_ORIGINS)
require('dotenv').config();

// Nodemailer setup (only if creds provided)
const nodemailer = require('nodemailer');
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}


const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const app = express();
const upload = multer({ dest: 'uploads/' });

// CORS allowlist (comma-separated in CORS_ORIGINS) or allow all in dev
const allowlist = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = allowlist.length
  ? {
      origin: function (origin, callback) {
        // allow local tools without origin
        if (!origin) return callback(null, true);
        if (allowlist.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
    }
  : {};
app.use(cors(corsOptions));
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/civic-issues';
mongoose.connect(MONGODB_URI);

const issueSchema = new mongoose.Schema({
  description: String,
  location: String,
  category: String,
  department: String,
  email: String,
  state: String,
  city: String,
  country: { type: String, default: 'India' },
  photoUrl: String,
  status: { type: String, default: 'submitted' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Issue = mongoose.model('Issue', issueSchema);

app.get('/', (req, res) => {
  res.send('Civic Issue Tracker Backend');
});

// Submit a new issue
app.post('/api/report', upload.single('photo'), async (req, res) => {
  const { description, location, category, department, email, state, city, country } = req.body;
  const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;
  try {
    const issue = await Issue.create({ description, location, category, department, email, state, city, country, photoUrl });

    // Send confirmation email if configured
    if (email && transporter) {
      const fromAddr = process.env.MAIL_FROM || process.env.EMAIL_USER;
      const mailOptions = {
        from: fromAddr,
        to: email,
        subject: 'Issue Submitted Successfully',
        text: `Thank you for reporting your issue. Your issue has been submitted successfully.\n\nYour Issue ID: ${issue._id}\n\nYou can use this ID to track the status of your issue.\n\nRegards,\nCivic Issue Reporting Team`,
      };
      transporter.sendMail(mailOptions).then(info => {
        console.log('Confirmation email sent:', info.response);
      }).catch(error => {
        console.error('Error sending confirmation email:', error);
      });
    }

    res.json({ message: 'Report received', issueId: issue._id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save issue.' });
  }
});


// List all issues
app.get('/api/issues', async (req, res) => {
  try {
    const issues = await Issue.find().sort({ createdAt: -1 });
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch issues.' });
  }
});

// Update issue status
app.patch('/api/issues/:id', express.json(), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const issue = await Issue.findById(id);
    if (!issue) return res.status(404).json({ error: 'Issue not found' });
    if (status) issue.status = status;
    issue.updatedAt = new Date();
    await issue.save();

    // Send progress email if configured
    if (issue.email && transporter) {
      const fromAddr = process.env.MAIL_FROM || process.env.EMAIL_USER;
      const mailOptions = {
        from: fromAddr,
        to: issue.email,
        subject: 'Civic Issue Progress Update',
        text: `Hello,\n\nYour issue (ID: ${issue._id}) status has been updated to: ${issue.status}.\n\nDescription: ${issue.description}\nLocation: ${issue.location}\nCategory: ${issue.category}\n\nThank you for helping improve your community!`,
      };
      transporter.sendMail(mailOptions).then(info => {
        console.log('Progress email sent:', info.response);
      }).catch(error => {
        console.error('Error sending email:', error);
      });
    }

    res.json({ message: 'Status updated', issue });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});

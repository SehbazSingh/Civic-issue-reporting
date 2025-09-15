// Nodemailer setup
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sehbazsingh58@gmail.com', // Replace with your email
    pass: 'vqvf cdba lbsk rkmm' // Replace with your app password
  }
});


const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mongoose = require('mongoose');
const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/civic-issues');

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

    // Send confirmation email to citizen with issue ID
    if (email) {
      const mailOptions = {
        from: 'sehbazsingh58@gmail.com',
        to: email,
        subject: 'Issue Submitted Successfully',
        text: `Thank you for reporting your issue. Your issue has been submitted successfully.\n\nYour Issue ID: ${issue._id}\n\nYou can use this ID to track the status of your issue.\n\nRegards,\nCivic Issue Reporting Team`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending confirmation email:', error);
        } else {
          console.log('Confirmation email sent:', info.response);
        }
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

    // Send progress email if email exists
    if (issue.email) {
      const mailOptions = {
        from: 'your-email@gmail.com', // Replace with your email
        to: issue.email,
        subject: 'Civic Issue Progress Update',
        text: `Hello,\n\nYour issue (ID: ${issue._id}) status has been updated to: ${issue.status}.\n\nDescription: ${issue.description}\nLocation: ${issue.location}\nCategory: ${issue.category}\n\nThank you for helping improve your community!`
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
        } else {
          console.log('Progress email sent:', info.response);
        }
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

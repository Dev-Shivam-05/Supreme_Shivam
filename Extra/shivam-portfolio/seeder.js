const path = require("path");
const { createRequire } = require("module");

const requireFromApp = createRequire(
  path.join(__dirname, "shivam-portfolio", "package.json")
);
const mongoose = requireFromApp("mongoose");
const dotenv = requireFromApp("dotenv");

dotenv.config({ path: path.join(__dirname, "shivam-portfolio", ".env") });

const Project = require("./models/Project");
const Inquiry = require("./models/Inquiry");
const VisitorLog = require("./models/VisitorLog");

const randomIp = () => {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join(".");
};

const countries = ["US", "India", "UK"];

const projects = [
  {
    title: "Art Generator",
    description: "AI-powered image generation app with social sharing and galleries.",
    technologies: ["Node.js", "Express", "MongoDB", "React", "OpenAI"],
    image: "/images/projects/art-generator.jpg",
    liveUrl: "https://example.com/art-generator",
    repoUrl: "https://github.com/yourname/art-generator",
    featured: true,
    viewCount: 12450
  },
  {
    title: "Weather App",
    description: "Real-time weather dashboard with radar maps and alerts.",
    technologies: ["Node.js", "Express", "MongoDB", "EJS", "Chart.js"],
    image: "/images/projects/weather-app.jpg",
    liveUrl: "https://example.com/weather-app",
    repoUrl: "https://github.com/yourname/weather-app",
    featured: true,
    viewCount: 8450
  },
  {
    title: "Freelance Portfolio",
    description: "High-converting portfolio with blog, contact form, and admin panel.",
    technologies: ["Node.js", "Express", "MongoDB", "EJS", "Bootstrap"],
    image: "/images/projects/portfolio.jpg",
    liveUrl: "https://example.com/portfolio",
    repoUrl: "https://github.com/yourname/portfolio",
    featured: true,
    viewCount: 15670
  }
];

const inquiries = [
  { name: "John Doe", email: "john@example.com", phone: "+1-555-1010", budget: "$3,000-$5,000", message: "I need a website", status: "NEW" },
  { name: "Jane Smith", email: "jane@example.com", phone: "+1-555-2020", budget: "$5,000-$10,000", message: "I need a website", status: "NEW" },
  { name: "Carlos Rivera", email: "carlos@example.com", phone: "+52-555-3030", budget: "$2,000-$3,000", message: "I need a website", status: "NEW" },
  { name: "Aisha Khan", email: "aisha@example.com", phone: "+91-999-4040", budget: "$4,000-$6,000", message: "I need a website", status: "NEW" },
  { name: "Liam Brown", email: "liam@example.com", phone: "+44-777-5050", budget: "$6,000-$8,000", message: "I need a website", status: "NEW" }
];

const now = new Date();
const visitorLogs = Array.from({ length: 20 }).map((_, i) => {
  const country = countries[Math.floor(Math.random() * countries.length)];
  const ts = new Date(now.getTime() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
  const paths = ["/", "/projects", "/blog", "/contact", "/projects/art-generator", "/projects/weather-app"];
  const methods = ["GET", "GET", "GET", "POST"];
  const agents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Mozilla/5.0 (X11; Linux x86_64)",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"
  ];
  return {
    ip: randomIp(),
    userAgent: agents[Math.floor(Math.random() * agents.length)],
    path: paths[Math.floor(Math.random() * paths.length)],
    method: methods[Math.floor(Math.random() * methods.length)],
    referrer: "",
    visitedAt: ts,
    country
  };
});

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Project.deleteMany({});
    await Inquiry.deleteMany({});
    await VisitorLog.deleteMany({});
    await Project.insertMany(projects);
    await Inquiry.insertMany(inquiries);
    await VisitorLog.insertMany(visitorLogs);
    console.log("Data Imported!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();